'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Film, Play, Scissors, X } from 'lucide-react';
import type { DownloadedVideo } from '@/app/lib/video-processing';

interface PlayableVideo {
  title: string;
  src: string;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function VideoGroupGallery({ video }: { video: DownloadedVideo }) {
  const [playing, setPlaying] = useState<PlayableVideo | null>(null);

  useEffect(() => {
    if (!playing) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlaying(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [playing]);

  const originalSrc = `/api/downloads/${video.videoId}/file?asset=full`;
  const originalThumbnail = `/api/downloads/${video.videoId}/file?asset=thumbnail`;

  return (
    <>
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-600">
              Original
            </p>
            <h2 className="mt-1 text-xl font-bold">Source video</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Stored offline
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPlaying({ title: video.title, src: originalSrc })}
          className="group grid w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[minmax(280px,480px)_1fr]"
        >
          <div className="relative aspect-video overflow-hidden bg-gray-900">
            {video.thumbnail ? (
              <Image src={originalThumbnail} alt="" fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500"><Film size={42} /></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-red-600 shadow-xl">
                <Play size={22} fill="currentColor" />
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-center p-5 sm:p-7">
            <span className="mb-2 text-xs font-semibold text-gray-400">ORIGINAL VIDEO</span>
            <h3 className="line-clamp-3 text-xl font-bold leading-tight sm:text-2xl">{video.title}</h3>
            {video.channel && <p className="mt-3 text-sm text-gray-500">{video.channel}</p>}
            <p className="mt-5 text-sm font-semibold text-red-600">Click to play offline</p>
          </div>
        </button>
      </section>

      <section className="mt-12">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-600">Clips</p>
          <h2 className="mt-1 text-xl font-bold">
            {video.crops.length} {video.crops.length === 1 ? 'cropped video' : 'cropped videos'}
          </h2>
        </div>

        {video.crops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center text-gray-500">
            <Scissors className="mx-auto mb-3" size={28} />
            <p className="text-sm">No clips have been saved in this group yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {video.crops.map((crop) => {
              const cropQuery = encodeURIComponent(crop.filename);
              const cropSrc = `/api/downloads/${video.videoId}/file?asset=crop&crop=${cropQuery}`;
              const cropThumbnail = crop.thumbnailFilename
                ? `/api/downloads/${video.videoId}/file?asset=crop-thumbnail&crop=${cropQuery}`
                : originalThumbnail;
              return (
                <button
                  key={crop.filename}
                  type="button"
                  onClick={() => setPlaying({ title: crop.name, src: cropSrc })}
                  className="group overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-900">
                    <Image src={cropThumbnail} alt="" fill unoptimized className="object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 transition group-hover:bg-black/25">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-red-600 opacity-90 shadow-lg">
                        <Play size={18} fill="currentColor" />
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
                      {formatDuration(crop.endTime - crop.startTime)}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-sm font-bold">{crop.name}</h3>
                    <p className="mt-1 text-xs text-gray-400">Cropped video · Click to play</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlaying(null);
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 text-white">
              <h2 className="truncate text-sm font-semibold sm:text-base">{playing.title}</h2>
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close video player"
              >
                <X size={20} />
              </button>
            </div>
            <video
              key={playing.src}
              src={playing.src}
              className="aspect-video w-full bg-black"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </>
  );
}
