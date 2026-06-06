'use client';

import Image from 'next/image';
import Link from 'next/link';
import { YouTubeVideo, formatDuration } from '@/app/lib/youtube';
import { Play } from 'lucide-react';

interface VideoCardProps {
  video: YouTubeVideo;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      href={`/watch?v=${video.id}`}
      className="group cursor-pointer"
    >
      <div className="relative mb-3 overflow-hidden rounded-lg bg-gray-900 aspect-video">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-110 transition duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
          <Play
            size={48}
            className="text-white opacity-0 group-hover:opacity-100 transition"
            fill="white"
          />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-500 transition">
          {video.title}
        </h3>
        <p className="text-xs text-gray-500">{video.channelTitle}</p>
        <p className="text-xs text-gray-500">
          {new Date(video.publishedAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
