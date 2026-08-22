import { NextRequest, NextResponse } from 'next/server';
import {
  addCropMetadata,
  createNamedCropOutputPath,
  createVideoThumbnail,
  cropVideo,
  getVideoPath,
  saveVideoMetadata,
  validateCropTimes,
  videoExists,
} from '@/app/lib/video-processing';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let outputPath: string | null = null;

  try {
    const body = await request.json();
    const videoId = body?.videoId as string | undefined;
    const startTime = Number(body?.startTime);
    const endTime = Number(body?.endTime);
    const videoDuration =
      body?.videoDuration !== undefined ? Number(body.videoDuration) : undefined;
    const cropName = typeof body?.cropName === 'string' ? body.cropName.trim() : '';
    const title = typeof body?.title === 'string' ? body.title : undefined;
    const thumbnailUrl =
      typeof body?.thumbnailUrl === 'string' ? body.thumbnailUrl : undefined;
    const channel = typeof body?.channel === 'string' ? body.channel : undefined;

    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const validationError = validateCropTimes(startTime, endTime, videoDuration);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!cropName || cropName.length > 100) {
      return NextResponse.json(
        { error: 'Enter a video name between 1 and 100 characters' },
        { status: 400 }
      );
    }

    if (!videoExists(videoId)) {
      return NextResponse.json(
        { error: 'Video not prepared. Call /api/crop/prepare first.' },
        { status: 404 }
      );
    }

    const inputPath = getVideoPath(videoId);
    outputPath = createNamedCropOutputPath(videoId, cropName);

    await cropVideo(inputPath, startTime, endTime, outputPath);
    const thumbnailPath = outputPath.replace(/\.mp4$/i, '.jpg');
    const savedThumbnail = await createVideoThumbnail(outputPath, thumbnailPath, 0).catch(
      () => null
    );
    await saveVideoMetadata(videoId, { title, thumbnailUrl, channel });
    const video = addCropMetadata(
      videoId,
      outputPath,
      cropName,
      startTime,
      endTime,
      savedThumbnail
    );

    return NextResponse.json({
      saved: true,
      videoId,
      crop: video.crops.at(-1),
    });
  } catch (error) {
    console.error('Crop process error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to crop video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
