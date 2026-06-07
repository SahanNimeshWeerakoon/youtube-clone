'use client';

import { YouTubeVideo } from '@/app/lib/youtube';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: YouTubeVideo[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function VideoGrid({
  videos,
  isLoading,
  onLoadMore,
  hasMore,
}: VideoGridProps) {
  console.log({videos});
  if (videos.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No videos found. Try searching for something.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => {
          if(video.id)
            return <VideoCard key={video.id ?? video.thumbnail} video={video} />
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )}

      {hasMore && !isLoading && onLoadMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
