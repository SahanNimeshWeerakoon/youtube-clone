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
    const items = response.data.items ?? [];

    if (items.length === 0) {
      return NextResponse.json(response.data);
    }

    const videoIds = items
      .map((item: { id: { videoId: string } }) => item.id.videoId)
      .join(',');

    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        key: YOUTUBE_API_KEY,
        id: videoIds,
        part: 'contentDetails,snippet',
        fields: 'items(id,contentDetails,snippet(thumbnails))',
      },
    });

    type VideoDetails = {
      id: string;
      contentDetails: { duration: string };
      snippet: {
        thumbnails: { high?: { url: string }; medium: { url: string } };
      };
    };

    const detailsMap = new Map<string, VideoDetails>(
      (detailsResponse.data.items ?? []).map((item: VideoDetails) => [
        item.id,
        item,
      ])
    );

    const enrichedItems = items.map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { medium: { url: string } };
          channelTitle: string;
          publishedAt: string;
        };
      }) => {
        const id = item.id.videoId;
        const details = detailsMap.get(id);
        const thumbnail =
          details?.snippet?.thumbnails?.high?.url ??
          details?.snippet?.thumbnails?.medium?.url ??
          item.snippet.thumbnails.medium.url;

        return {
          ...item,
          duration: details?.contentDetails?.duration,
          thumbnailUrl: thumbnail,
        };
      }
    );

    return NextResponse.json({
      ...response.data,
      items: enrichedItems,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
