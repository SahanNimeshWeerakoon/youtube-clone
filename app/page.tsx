'use client';

import { useState } from 'react';
import SearchBar from '@/app/components/SearchBar';
import VideoGrid from '@/app/components/VideoGrid';
import { searchVideos, YouTubeVideo } from '@/app/lib/youtube';
import Link from 'next/link';
import { Library } from 'lucide-react';

export default function Home() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const result = await searchVideos(query, 20);
      setVideos(result.videos);
      setNextPageToken(result.nextPageToken);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Failed to search videos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken) return;

    setIsLoading(true);
    try {
      // This is simplified - in production you'd want to store the query
      const result = await searchVideos('trending', 20, nextPageToken);
      setVideos((prev) => [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error('Load more failed:', error);
      alert('Failed to load more videos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-red-600 whitespace-nowrap">
            ▶ CloneTube
          </Link>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          <Link
            href="/downloads"
            className="ml-auto flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Library size={18} />
            <span>Downloaded Videos</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {hasSearched ? (
          <VideoGrid
            videos={videos}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            hasMore={!!nextPageToken}
          />
        ) : (
          <div className="text-center py-24">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to CloneTube
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Search and discover videos using YouTube Data
            </p>
            <div className="text-gray-500 text-lg">
              👉 Use the search bar above to get started
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
