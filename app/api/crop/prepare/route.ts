import { NextRequest, NextResponse } from 'next/server';
import { downloadVideo, videoExists } from '@/app/lib/video-processing';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const videoId = body?.videoId as string | undefined;
    const quality = body?.quality as string | undefined;

    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    if (videoExists(videoId)) {
      return NextResponse.json({ ready: true, cached: true });
    }

    await downloadVideo(videoId, quality);

    return NextResponse.json({ ready: true, cached: false });
  } catch (error) {
    console.error('Crop prepare error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to prepare video for cropping';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
