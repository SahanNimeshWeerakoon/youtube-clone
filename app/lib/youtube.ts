export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  durationSeconds?: number;
}

export interface YouTubeVideoDetail extends YouTubeVideo {
  description: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  channel: string;
}

export async function searchVideos(
  query: string,
  maxResults: number = 20,
  pageToken?: string
) {
  const params = new URLSearchParams({
    q: query,
    maxResults: maxResults.toString(),
    ...(pageToken && { pageToken }),
  });

  const response = await fetch(`/api/search?${params}`);

  if (!response.ok) {
    throw new Error('Failed to search videos');
  }

  const data = await response.json();

  return {
    videos: data.items.map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { medium: { url: string } };
          channelTitle: string;
          publishedAt: string;
        };
        duration?: string;
        thumbnailUrl?: string;
      }) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.thumbnailUrl ?? item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        durationSeconds: item.duration
          ? parseDurationToSeconds(item.duration)
          : undefined,
      })
    ),
    nextPageToken: data.nextPageToken,
    prevPageToken: data.prevPageToken,
  };
}

export async function getVideoDetails(videoId: string) {
  const response = await fetch(`/api/videos/${videoId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch video details');
  }

  return response.json();
}

export function parseDurationToSeconds(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = regex.exec(duration);
  if (!matches) return 0;

  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  const seconds = matches[3] ? parseInt(matches[3], 10) : 0;

  return hours * 3600 + minutes * 60 + seconds;
}

// Function to convert ISO 8601 duration to readable format
export function formatDuration(duration: string): string {
  const regex =
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = regex.exec(duration);

  if (!matches) return '0:00';

  const hours = matches[1] ? parseInt(matches[1]) : 0;
  const minutes = matches[2] ? parseInt(matches[2]) : 0;
  const seconds = matches[3] ? parseInt(matches[3]) : 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
