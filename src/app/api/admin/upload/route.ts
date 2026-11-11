import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ImageStorageConfigurationError, uploadImage } from '@/lib/imageStorage';

export const runtime = 'nodejs';

const MAX_UPLOAD_BATCH_SIZE = 3.5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const allFiles: File[] = [];
    if (files && files.length > 0) {
      allFiles.push(...files);
    } else if (singleFile) {
      allFiles.push(singleFile);
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (allFiles.reduce((total, file) => total + file.size, 0) > MAX_UPLOAD_BATCH_SIZE) {
      return NextResponse.json({ error: 'Upload fewer images per batch. Each batch must be below 3.5 MB.' }, { status: 413 });
    }

    const uploadedFiles: Array<{ name: string; url: string }> = [];

    for (const file of allFiles) {
      uploadedFiles.push({ name: file.name, url: await uploadImage(file) });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No image files were provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadedFiles[0].url,
      urls: uploadedFiles.map((file) => file.url),
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    if (error instanceof ImageStorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof Error && error.message.startsWith('Unsupported file type:')) {
      return NextResponse.json({ error: error.message }, { status: 415 });
    }

    if (error instanceof Error && error.message === 'Images must be 4 MB or smaller') {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }

    const details = error instanceof Error ? `: ${error.message}` : '';
    return NextResponse.json(
      {
        error: `Image storage provider rejected the upload${details}. Check the provider credentials, bucket name, region, and public URL configuration.`,
      },
      { status: 502 }
    );
  }
}
