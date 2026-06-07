'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Slider from 'rc-slider';
import { Download, Loader2, Scissors, X } from 'lucide-react';
import 'rc-slider/assets/index.css';

interface CropModalProps {
  videoId: string;
  videoTitle: string;
  durationSeconds?: number;
  onClose: () => void;
}

export default function CropModal({
  videoId,
  videoTitle,
  durationSeconds,
  onClose,
}: CropModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prepareState, setPrepareState] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const videoSrc = `/api/crop/video/${videoId}`;

  useEffect(() => {
    const prepare = async () => {
      try {
        const response = await fetch('/api/crop/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to prepare video');
        }

        setPrepareState('ready');
      } catch (err) {
        setPrepareState('error');
        setPrepareError(
          err instanceof Error ? err.message : 'Failed to prepare video'
        );
      }
    };

    void prepare();
  }, [videoId]);

  const initializeRange = useCallback((videoDuration: number) => {
    setDuration(videoDuration);
    const defaultEnd = Math.min(videoDuration, Math.max(10, videoDuration * 0.1));
    setStartTime(0);
    setEndTime(defaultEnd > 0 ? defaultEnd : videoDuration);
  }, []);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    initializeRange(video.duration);
  };

  useEffect(() => {
    if (durationSeconds && durationSeconds > 0 && duration === 0) {
      initializeRange(durationSeconds);
    }
  }, [durationSeconds, duration, initializeRange]);

  const seekToStart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startTime;
    void video.play().catch(() => {});
  }, [startTime]);

  useEffect(() => {
    if (prepareState !== 'ready' || endTime <= startTime) return;
    seekToStart();
  }, [prepareState, startTime, endTime, seekToStart]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.currentTime >= endTime - 0.05) {
      video.currentTime = startTime;
      void video.play().catch(() => {});
    }
  };

  const handleRangeChange = (value: number | number[]) => {
    if (!Array.isArray(value)) return;
    const [start, end] = value;
    setStartTime(start);
    setEndTime(end);
    setDownloadError(null);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch('/api/crop/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          startTime,
          endTime,
          videoDuration: duration > 0 ? duration : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to crop video');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `crop-${videoId}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Failed to download cropped video'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <Scissors size={20} className="text-red-600 shrink-0" />
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              Crop Video
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          <p className="text-sm text-gray-600 truncate">{videoTitle}</p>

          <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
            {prepareState === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <Loader2 size={36} className="animate-spin text-red-500" />
                <p className="text-sm">Downloading video for cropping…</p>
                <p className="text-xs text-white/60">This may take a minute</p>
              </div>
            )}

            {prepareState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-red-400 text-sm">{prepareError}</p>
                <p className="text-white/60 text-xs">
                  Ensure yt-dlp and ffmpeg are installed on the server.
                </p>
              </div>
            )}

            {prepareState === 'ready' && (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                playsInline
                muted
              />
            )}
          </div>

          {prepareState === 'ready' && duration > 0 && (
            <div className="space-y-4">
              <div className="px-1">
                <Slider
                  range
                  min={0}
                  max={duration}
                  step={0.1}
                  value={[startTime, endTime]}
                  onChange={handleRangeChange}
                  styles={{
                    track: { backgroundColor: '#dc2626', height: 6 },
                    rail: { backgroundColor: '#e5e7eb', height: 6 },
                    handle: {
                      borderColor: '#dc2626',
                      backgroundColor: '#fff',
                      opacity: 1,
                      height: 18,
                      width: 18,
                      marginTop: -6,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    },
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Start:{' '}
                  <strong className="text-gray-900">{formatTime(startTime)}</strong>
                </span>
                <span>
                  Selection:{' '}
                  <strong className="text-gray-900">
                    {formatTime(endTime - startTime)}
                  </strong>
                </span>
                <span>
                  End:{' '}
                  <strong className="text-gray-900">{formatTime(endTime)}</strong>
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Preview loops between your selected start and end times.
              </p>
            </div>
          )}

          {downloadError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {downloadError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={
              prepareState !== 'ready' ||
              isDownloading ||
              endTime <= startTime ||
              duration <= 0
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition"
          >
            {isDownloading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Download size={16} />
                Download Crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const frac = Math.round((seconds % 1) * 10);

  const base =
    h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;

  return frac > 0 ? `${base}.${frac}` : base;
}
