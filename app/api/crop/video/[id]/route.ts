import { NextRequest, NextResponse } from 'next/server';
import {
  createVideoReadStream,
  getFileStats,
  getVideoPath,
  nodeStreamToWeb,
  videoExists,
} from '@/app/lib/video-processing';

export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    if (!videoExists(videoId)) {
      return NextResponse.json(
        { error: 'Video not prepared. Call /api/crop/prepare first.' },
        { status: 404 }
      );
    }

    const filePath = getVideoPath(videoId);
    const stat = getFileStats(filePath);
    const range = request.headers.get('range');

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        return NextResponse.json({ error: 'Invalid range header' }, { status: 416 });
      }

      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;

      if (start >= stat.size || end >= stat.size || start > end) {
        return NextResponse.json({ error: 'Range not satisfiable' }, { status: 416 });
      }

      const chunkSize = end - start + 1;
      const stream = createVideoReadStream(filePath, start, end);

      return new NextResponse(nodeStreamToWeb(stream), {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': 'video/mp4',
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }

    const stream = createVideoReadStream(filePath);

    return new NextResponse(nodeStreamToWeb(stream), {
      headers: {
        'Content-Length': String(stat.size),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Video stream error:', error);
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    );
  }
}
