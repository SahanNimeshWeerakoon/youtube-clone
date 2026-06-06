import { NextRequest, NextResponse } from 'next/server';
import { parseStoryboardSpec } from '@/app/lib/storyboard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch video page' },
        { status: 502 }
      );
    }

    const html = await response.text();
    const match = html.match(
      /"playerStoryboardSpecRenderer":\{"spec":"([^"]+)"/
    );

    if (!match) {
      return NextResponse.json(
        { error: 'Storyboard not available' },
        { status: 404 }
      );
    }

    const spec = match[1].replace(/\\u0026/g, '&');
    const storyboard = parseStoryboardSpec(spec);

    return NextResponse.json(storyboard);
  } catch (error) {
    console.error('Storyboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storyboard' },
      { status: 500 }
    );
  }
}
