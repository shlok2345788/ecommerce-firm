import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export class ImageStorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageStorageConfigurationError';
  }
}

function getB2Config() {
  const values = {
    keyId: process.env.B2_APPLICATION_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
    bucketName: process.env.B2_BUCKET_NAME,
  };
  const configured = Object.values(values).some(Boolean);

  if (!configured) return null;

  if (Object.values(values).some((value) => !value)) {
    throw new ImageStorageConfigurationError(
      'Backblaze storage is partially configured. Set B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET_NAME.'
    );
  }

  return {
    ...values,
    endpoint:
      process.env.B2_ENDPOINT ||
      `https://s3.${process.env.B2_REGION || 'us-east-005'}.backblazeb2.com`,
    publicUrl: process.env.B2_PUBLIC_URL,
  };
}

function getSafeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase() || '.jpg';
  const baseName = path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase()
    .slice(0, 50);

  return `${baseName || 'image'}-${crypto.randomUUID()}${extension}`;
}

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Images must be 4 MB or smaller');
  }

  const fileName = getSafeFileName(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const b2 = getB2Config();

  if (b2) {
    const client = new S3Client({
      endpoint: b2.endpoint,
      region: process.env.B2_REGION || 'us-east-005',
      credentials: {
        accessKeyId: b2.keyId,
        secretAccessKey: b2.applicationKey,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: b2.bucketName,
        Key: `products/${fileName}`,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicBaseUrl = (b2.publicUrl || `${b2.endpoint}/${b2.bucketName}`)
      .replace(/\/+$/, '');
    return `${publicBaseUrl}/products/${encodeURIComponent(fileName)}`;
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${fileName}`, buffer, {
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new ImageStorageConfigurationError(
      'Persistent image storage is not configured. Set BLOB_READ_WRITE_TOKEN or the B2 storage variables.'
    );
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, fileName), buffer);
  return `/uploads/${fileName}`;
}
