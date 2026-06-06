'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import StoryboardFrame from '@/app/components/StoryboardFrame';
import {
  estimateDuration,
  fetchStoryboard,
  getFrameAtTime,
  pickPreviewLevel,
  type StoryboardData,
  type StoryboardFrame as Frame,
} from '@/app/lib/storyboard';

interface ThumbnailPreviewProps {
  videoId: string;
  thumbnail: string;
  title: string;
  durationSeconds?: number;
}

export default function ThumbnailPreview({
  videoId,
  thumbnail,
  title,
  durationSeconds,
}: ThumbnailPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [hoverTime, setHoverTime] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const storyboardRef = useRef<StoryboardData | null>(null);
  const durationRef = useRef(durationSeconds ?? 0);

  const loadStoryboard = useCallback(async () => {
    if (storyboardRef.current || loadFailed) return;

    try {
      const data = await fetchStoryboard(videoId);
      storyboardRef.current = data;
      setStoryboard(data);

      if (!durationSeconds) {
        const level = pickPreviewLevel(data.levels);
        durationRef.current = estimateDuration(level);
      }
    } catch {
      setLoadFailed(true);
    }
  }, [videoId, durationSeconds, loadFailed]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    void loadStoryboard();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setFrame(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const data = storyboardRef.current;
    if (!container || !data) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const fraction = x / rect.width;
    const duration =
      durationRef.current || estimateDuration(pickPreviewLevel(data.levels));
    const time = fraction * duration;

    setHoverTime(time);
    setFrame(getFrameAtTime(data, time));
  };

  const showPreview = isHovering && frame && storyboard && !loadFailed;
  const duration = durationRef.current || durationSeconds;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {showPreview ? (
        <StoryboardFrame frame={frame} fill className="absolute inset-0" />
      ) : (
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      )}

      {duration != null && duration > 0 && (
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded z-10">
          {formatDurationFromSeconds(duration)}
        </span>
      )}

      {showPreview && (
        <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded z-10">
          {formatDurationFromSeconds(hoverTime)}
        </span>
      )}
    </div>
  );
}

function formatDurationFromSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
