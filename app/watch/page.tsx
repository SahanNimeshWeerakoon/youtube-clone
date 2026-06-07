'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import {
  getVideoDetails,
  parseDurationToSeconds,
  YouTubeVideoDetail,
} from '@/app/lib/youtube';
import VideoPlayer from '@/app/components/VideoPlayer';
import CropModal from '@/app/components/CropModal';
import { ChevronLeft, Scissors } from 'lucide-react';

function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get('v');
  const [video, setVideo] = useState<YouTubeVideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setError('No video ID provided');
      setIsLoading(false);
      return;
    }

    const fetchVideo = async () => {
      try {
        const data = await getVideoDetails(videoId);
        setVideo(data);
      } catch (err) {
        setError('Failed to load video details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">No video selected</p>
          <Link
            href="/"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link
            href="/"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-red-600 hover:text-red-700 transition">
            <ChevronLeft size={24} />
            <span>Back</span>
          </Link>
          <div className="text-2xl font-bold text-red-600">▶ CloneTube</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Video Player */}
          <VideoPlayer
            videoId={videoId}
            durationSeconds={
              video?.duration ? parseDurationToSeconds(video.duration) : undefined
            }
          />

          {/* Video Details */}
          {video && (
            <div className="mt-6 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {video.title}
              </h1>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {video.channel}
                  </p>
                  <p>
                    {parseInt(video.viewCount).toLocaleString()} views •{' '}
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCropModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition shrink-0"
                >
                  <Scissors size={16} />
                  Crop
                </button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Likes: {parseInt(video.likeCount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCropModal && videoId && video && (
        <CropModal
          videoId={videoId}
          videoTitle={video.title}
          durationSeconds={
            video.duration ? parseDurationToSeconds(video.duration) : undefined
          }
          onClose={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
}

export default function Watch() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
