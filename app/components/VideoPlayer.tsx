'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Maximize, Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
}

export default function VideoPlayer({ videoId }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('720');
  const playerRef = useRef<HTMLDivElement>(null);

  const qualityOptions = [
    { label: '1080p', value: '1080' },
    { label: '720p', value: '720' },
    { label: '480p', value: '480' },
    { label: '360p', value: '360' },
  ];

  const handleFullscreen = () => {
    if (playerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  };

  // Embed YouTube player
  return (
    <div className="space-y-4">
      {/* YouTube Embedded Player */}
      <div
        ref={playerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ paddingBottom: '56.25%', height: 0 }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0&fs=1`}
          title="Video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {/* Quality Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-700">Quality:</span>
        <div className="flex gap-2 flex-wrap">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedQuality(option.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                selectedQuality === option.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          (Selected: {selectedQuality}p)
        </span>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          ℹ️ Video quality depends on availability from YouTube. This is using YouTube's embedded player.
        </p>
      </div>
    </div>
  );
}
