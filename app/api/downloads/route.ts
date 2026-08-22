import { NextResponse } from 'next/server';
import { listDownloadedVideos } from '@/app/lib/video-processing';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ videos: listDownloadedVideos() });
}
