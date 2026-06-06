import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '20';
    const pageToken = searchParams.get('pageToken');

    if (!q) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const params = {
      key: YOUTUBE_API_KEY,
      q,
      part: 'snippet',
      type: 'video',
      maxResults,
      pageToken: pageToken || undefined,
      fields: 'items(id,snippet),nextPageToken,prevPageToken',
    };

    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, { params });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
