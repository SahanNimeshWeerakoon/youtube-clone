import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const videoParams = {
      key: YOUTUBE_API_KEY,
      id,
      part: 'snippet,contentDetails,statistics',
      fields: 'items(id,snippet,contentDetails,statistics)',
    };

    const videoResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: videoParams,
    });

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const video = videoResponse.data.items[0];

    return NextResponse.json({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high,
      channel: video.snippet.channelTitle,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      publishedAt: video.snippet.publishedAt,
    });
  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video details' },
      { status: 500 }
    );
  }
}
