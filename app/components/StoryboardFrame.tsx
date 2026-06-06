'use client';

import { useEffect, useRef, useState } from 'react';
import type { StoryboardFrame as Frame } from '@/app/lib/storyboard';

interface StoryboardFrameProps {
  frame: Frame;
  fill?: boolean;
  className?: string;
}

export default function StoryboardFrame({
  frame,
  fill = false,
  className = '',
}: StoryboardFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const sheetWidth = frame.cols * frame.thumbWidth;
  const sheetHeight = frame.rows * frame.thumbHeight;

  useEffect(() => {
    if (!fill || !containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setScale(
        Math.max(width / frame.thumbWidth, height / frame.thumbHeight)
      );
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fill, frame.thumbWidth, frame.thumbHeight]);

  if (!fill) {
    return (
      <div
        className={`overflow-hidden ${className}`}
        style={{ width: frame.thumbWidth, height: frame.thumbHeight }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.sheetUrl}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          className="max-w-none"
          style={{
            width: sheetWidth,
            height: sheetHeight,
            marginLeft: -frame.col * frame.thumbWidth,
            marginTop: -frame.row * frame.thumbHeight,
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: frame.thumbWidth,
          height: frame.thumbHeight,
          transform: `scale(${scale})`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.sheetUrl}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          className="max-w-none"
          style={{
            width: sheetWidth,
            height: sheetHeight,
            marginLeft: -frame.col * frame.thumbWidth,
            marginTop: -frame.row * frame.thumbHeight,
          }}
        />
      </div>
    </div>
  );
}
