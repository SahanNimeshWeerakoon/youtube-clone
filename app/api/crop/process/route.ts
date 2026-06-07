import { NextRequest, NextResponse } from 'next/server';
import {
  createCropOutputPath,
  createVideoReadStream,
  cropVideo,
  deleteFile,
  getFileStats,
  getVideoPath,
  nodeStreamToWeb,
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

    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const validationError = validateCropTimes(startTime, endTime, videoDuration);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!videoExists(videoId)) {
      return NextResponse.json(
        { error: 'Video not prepared. Call /api/crop/prepare first.' },
        { status: 404 }
      );
    }

    const inputPath = getVideoPath(videoId);
    outputPath = createCropOutputPath(videoId);

    await cropVideo(inputPath, startTime, endTime, outputPath);

    const stat = getFileStats(outputPath);
    const stream = createVideoReadStream(outputPath);
    const cropOutputPath = outputPath;

    stream.on('close', () => {
      deleteFile(cropOutputPath);
    });

    stream.on('error', () => {
      deleteFile(cropOutputPath);
    });

    const safeTitle = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `crop-${safeTitle}.mp4`;

    return new NextResponse(nodeStreamToWeb(stream), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(stat.size),
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (outputPath) {
      deleteFile(outputPath);
    }

    console.error('Crop process error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to crop video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
