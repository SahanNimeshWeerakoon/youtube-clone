import { NextRequest, NextResponse } from 'next/server';
import {
  createVideoReadStream,
  getDownloadedAssetPath,
  getFileStats,
  nodeStreamToWeb,
} from '@/app/lib/video-processing';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = request.nextUrl.searchParams.get('asset');
  const crop = request.nextUrl.searchParams.get('crop') ?? undefined;
  if (!['full', 'thumbnail', 'crop', 'crop-thumbnail'].includes(asset ?? '')) {
    return NextResponse.json({ error: 'Invalid asset' }, { status: 400 });
  }

  const filePath = getDownloadedAssetPath(
    id,
    asset as 'full' | 'thumbnail' | 'crop' | 'crop-thumbnail',
    crop
  );
  if (!filePath) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const stat = getFileStats(filePath);
    const isThumbnail = asset === 'thumbnail' || asset === 'crop-thumbnail';
    const range = request.headers.get('range');
    if (!isThumbnail && range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        return NextResponse.json({ error: 'Invalid range header' }, { status: 416 });
      }
      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1;
      if (start >= stat.size || end >= stat.size || start > end) {
        return NextResponse.json({ error: 'Range not satisfiable' }, { status: 416 });
      }
      return new NextResponse(
        nodeStreamToWeb(createVideoReadStream(filePath, start, end)),
        {
          status: 206,
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': String(end - start + 1),
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, max-age=3600',
          },
        }
      );
    }

    return new NextResponse(nodeStreamToWeb(createVideoReadStream(filePath)), {
      headers: {
        'Content-Type': isThumbnail ? 'image/jpeg' : 'video/mp4',
        'Content-Length': String(stat.size),
        'Accept-Ranges': isThumbnail ? 'none' : 'bytes',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
