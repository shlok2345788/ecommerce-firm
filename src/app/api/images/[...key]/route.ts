import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getB2Client } from '@/lib/imageStorage';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const keyParts = params.key;
    if (!keyParts || keyParts.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const key = keyParts.map(decodeURIComponent).join('/');

    const b2 = getB2Client();
    if (!b2) {
      return new NextResponse('Storage provider not configured', { status: 503 });
    }

    const command = new GetObjectCommand({
      Bucket: b2.bucketName,
      Key: key,
    });

    const response = await b2.client.send(command);

    if (!response.Body) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const bodyStream = typeof (response.Body as any).transformToWebStream === 'function'
      ? (response.Body as any).transformToWebStream()
      : (response.Body as any);

    const contentType = response.ContentType || 'image/jpeg';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    if (response.ContentLength) {
      headers['Content-Length'] = String(response.ContentLength);
    }

    return new NextResponse(bodyStream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return new NextResponse('Image Not Found', { status: 404 });
    }
    console.error('Image proxy error:', error);
    return new NextResponse('Failed to retrieve image', { status: 500 });
  }
}

