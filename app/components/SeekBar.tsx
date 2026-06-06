'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import StoryboardFrame from '@/app/components/StoryboardFrame';
import {
  fetchStoryboard,
  getFrameAtTime,
  type StoryboardData,
  type StoryboardFrame as Frame,
} from '@/app/lib/storyboard';

interface SeekBarProps {
  videoId: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export default function SeekBar({
  videoId,
  currentTime,
  duration,
  onSeek,
}: SeekBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverX, setHoverX] = useState(0);
  const [frame, setFrame] = useState<Frame | null>(null);
  const storyboardRef = useRef<StoryboardData | null>(null);

  const loadStoryboard = useCallback(async () => {
    if (storyboardRef.current) return;
    try {
      storyboardRef.current = await fetchStoryboard(videoId);
    } catch {
      // Preview unavailable — time tooltip still works
    }
  }, [videoId]);

  useEffect(() => {
    void loadStoryboard();
  }, [loadStoryboard]);

  const getTimeFromEvent = (clientX: number) => {
    const bar = barRef.current;
    if (!bar || duration <= 0) return 0;

    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = getTimeFromEvent(e.clientX);

    setHoverX(x);
    setHoverTime(time);

    if (storyboardRef.current) {
      setFrame(getFrameAtTime(storyboardRef.current, time));
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    void loadStoryboard();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setFrame(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSeek(getTimeFromEvent(e.clientX));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const tooltipLeft = Math.max(
    80,
    Math.min(hoverX, (barRef.current?.clientWidth ?? 160) - 80)
  );

  return (
    <div className="relative pt-2">
      {isHovering && (
        <div
          className="absolute bottom-full mb-2 -translate-x-1/2 pointer-events-none z-20"
          style={{ left: tooltipLeft }}
        >
          <div className="bg-black/90 rounded overflow-hidden shadow-lg border border-white/10">
            {frame ? (
              <StoryboardFrame frame={frame} />
            ) : (
              <div
                className="bg-gray-800 flex items-center justify-center text-white/60 text-xs"
                style={{ width: 160, height: 90 }}
              >
                Loading preview…
              </div>
            )}
            <div className="text-white text-xs text-center py-1 font-medium">
              {formatTime(hoverTime)}
            </div>
          </div>
        </div>
      )}

      <div
        ref={barRef}
        className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group hover:h-2.5 transition-all"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        <div
          className="absolute inset-y-0 left-0 bg-red-600 rounded-full"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `${m}:${String(s).padStart(2, '0')}`;
}
