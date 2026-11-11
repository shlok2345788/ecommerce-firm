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
  const keyId = process.env.B2_APPLICATION_KEY_ID?.trim();
  const applicationKey = process.env.B2_APPLICATION_KEY?.trim();
  const bucketName = process.env.B2_BUCKET_NAME?.trim();

  const configured = Boolean(keyId || applicationKey || bucketName);

  if (!configured) return null;

  if (!keyId || !applicationKey || !bucketName) {
    throw new ImageStorageConfigurationError(
      'Backblaze storage is partially configured. Set B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET_NAME.'
    );
  }

  if (bucketName === 'YOUR_BUCKET_NAME') {
    throw new ImageStorageConfigurationError(
      'B2_BUCKET_NAME is set to placeholder "YOUR_BUCKET_NAME". Replace it with your actual Backblaze bucket name (e.g. ecommerce5768utgmjh).'
    );
  }

  if (keyId.length < 20) {
    throw new ImageStorageConfigurationError(
      'Invalid B2_APPLICATION_KEY_ID: "' + keyId + '" is a 12-character Master Application Key ID. Backblaze S3 API strictly requires a 25-character Application Key ID (starts with 00...). Create one in Backblaze under App Keys -> "Add a New Application Key".'
    );
  }

  let endpoint = process.env.B2_ENDPOINT?.trim();
  if (endpoint && !endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    endpoint = `https://${endpoint}`;
  }
  if (endpoint) {
    endpoint = endpoint.replace(/\/+$/, '');
  }

  let region = process.env.B2_REGION?.trim();
  if (!region && endpoint) {
    const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
    if (match) {
      region = match[1];
    }
  }
  region = region || 'us-east-005';
  endpoint = endpoint || `https://s3.${region}.backblazeb2.com`;

  const isPrivate =
    process.env.B2_PRIVATE_BUCKET === 'true' ||
    process.env.B2_BUCKET_PRIVATE === 'true';
  const defaultPublicUrl = isPrivate ? '/api/images' : undefined;

  return {
    keyId,
    applicationKey,
    bucketName,
    region,
    endpoint,
    publicUrl:
      process.env.B2_PUBLIC_URL?.trim()?.replace(/\/+$/, '') || defaultPublicUrl,
  };
}

export function getB2Client() {
  const b2 = getB2Config();
  if (!b2) return null;

  const client = new S3Client({
    endpoint: b2.endpoint,
    region: b2.region,
    credentials: {
      accessKeyId: b2.keyId,
      secretAccessKey: b2.applicationKey,
    },
  });

  return { client, bucketName: b2.bucketName };
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
      region: b2.region,
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
