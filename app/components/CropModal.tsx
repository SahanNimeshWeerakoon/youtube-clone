'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Slider from 'rc-slider';
import { Download, Loader2, Scissors, Volume2, VolumeX, X, Play, Pause } from 'lucide-react';
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
  const [prepareState, setPrepareState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle'
  );
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<string | null>('720p');
  const [assumedDownloadMbps] = useState(20); // used for estimated download time
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);

  const videoSrc = `/api/crop/video/${videoId}`;

  const startPrepare = async (quality?: string) => {
    setPrepareState('loading');
    setPrepareError(null);
    try {
      const response = await fetch('/api/crop/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, quality }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to prepare video');
      }

      setPrepareState('ready');
    } catch (err) {
      setPrepareState('error');
      setPrepareError(err instanceof Error ? err.message : 'Failed to prepare video');
    }
  };

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
    if (!durationSeconds || durationSeconds <= 0 || duration !== 0) return;

    const frame = requestAnimationFrame(() => {
      initializeRange(durationSeconds);
    });

    return () => cancelAnimationFrame(frame);
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

    setCurrentTime(video.currentTime);

    if (video.currentTime >= endTime - 0.05) {
      video.currentTime = startTime;
      void video.play().catch(() => {});
    }
  };

  const enableAudio = useCallback(() => {
    setIsMuted(false);
    const video = videoRef.current;
    if (video) {
      video.muted = false;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  const handleRangeChange = (value: number | number[]) => {
    if (!Array.isArray(value)) return;
    const [start, end] = value;
    setStartTime(start);
    setEndTime(end);
    setDownloadError(null);
    enableAudio();
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      const video = videoRef.current;
      if (video) {
        video.muted = next;
      }
      return next;
    });
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      try {
        await video.play();
      } catch {}
    }
  };

  const handleSeekScrub = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
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
            {prepareState === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/95 p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h3 className="text-sm font-semibold mb-3">Select quality</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Estimated download times assume an average network speed of {assumedDownloadMbps} Mbps.
                  </p>
                  <div className="space-y-2 mb-4">
                    {['1080p', '720p', '480p', '360p'].map((q) => {
                      const dur = durationSeconds && durationSeconds > 0 ? durationSeconds : 120;
                      const bitrateMap: Record<string, number> = { '1080p': 8, '720p': 5, '480p': 2.5, '360p': 1.2 };
                      const mbps = bitrateMap[q] ?? 2.5;
                      const sizeMB = (mbps * dur) / 8;
                      const estSec = (mbps * dur) / assumedDownloadMbps;
                      const estMin = Math.max(1, Math.round(estSec / 60));
                      return (
                        <label key={q} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="quality"
                              value={q}
                              checked={selectedQuality === q}
                              onChange={() => setSelectedQuality(q)}
                            />
                            <div>
                              <div className="text-sm font-medium">{q}</div>
                              <div className="text-xs text-gray-500">≈ {Math.round(sizeMB)} MB</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">{estMin} min</div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void startPrepare(selectedQuality ?? undefined)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                    >
                      Download for cropping
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              <>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={enableAudio}
                  playsInline
                  muted={isMuted}
                />
                <button
                  type="button"
                  onClick={toggleMute}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                  aria-label={isMuted ? 'Unmute preview' : 'Mute preview'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Play/pause and progress overlay */}
                <div className="absolute left-3 bottom-3 flex items-center gap-3 text-white">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 transition"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <div className="text-sm bg-black/50 px-2 py-1 rounded">{formatTime(currentTime)}</div>
                </div>

                {/* In-range progress bar */}
                <div className="absolute left-0 right-0 bottom-0 h-2">
                  <div className="h-2 bg-white/20 w-full" />
                  <div
                    className="h-2 bg-red-500 absolute left-0 top-0"
                    style={{
                      width: `${
                        endTime > startTime
                          ? Math.max(0, Math.min(100, ((currentTime - startTime) / (endTime - startTime)) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Scrub bar, time display and speed control */}
          {prepareState === 'ready' && duration > 0 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>Crop range</span>
                  <span>
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </span>
                </div>
                <Slider
                  range
                  min={0}
                  max={duration}
                  step={0.1}
                  value={[startTime, endTime]}
                  onChange={handleRangeChange}
                  allowCross={false}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={startTime}
                  max={endTime}
                  step={0.05}
                  value={Math.min(Math.max(currentTime, startTime), endTime)}
                  onChange={(e) => handleSeekScrub(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="text-sm text-gray-600 w-36 text-right">
                  {formatTime(currentTime)} / {formatTime(endTime - startTime)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600">Speed</label>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="text-sm w-16 text-right">
                  {playbackRate.toFixed(2)}x
                </div>
              </div>
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
