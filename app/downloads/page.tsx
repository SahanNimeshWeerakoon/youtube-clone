import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Film, FolderOpen } from 'lucide-react';
import { listDownloadedVideos } from '@/app/lib/video-processing';

export const dynamic = 'force-dynamic';

export default function DownloadsPage() {
  const videos = listDownloadedVideos();

  return (
    <main className="min-h-screen bg-[#fafafa] text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to search"
          >
            <ArrowLeft size={21} />
          </Link>
          <Link href="/" className="text-2xl font-bold text-red-600">
            ▶ CloneTube
          </Link>
          <div className="ml-auto flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            <FolderOpen size={17} />
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-red-600">
            Your library
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Downloaded videos</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Every source video and its named clips are kept together for offline playback.
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Film size={26} />
            </div>
            <h2 className="text-xl font-bold">No downloaded videos yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Search for a video, open the crop tool, and prepare it. Your full video and clips will appear here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Find a video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <article key={video.videoId} className="group min-w-0">
                <Link
                  href={`/downloads/${video.videoId}`}
                  className="relative block aspect-video overflow-hidden rounded-xl bg-gray-900 shadow-sm ring-1 ring-black/5"
                >
                  {video.thumbnail ? (
                    <Image
                      src={`/api/downloads/${video.videoId}/file?asset=thumbnail`}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                      <Film size={38} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
                    {video.crops.length} {video.crops.length === 1 ? 'clip' : 'clips'}
                  </span>
                </Link>

                <div className="pt-3">
                  <Link href={`/downloads/${video.videoId}`}>
                    <h2 className="line-clamp-2 text-[15px] font-bold leading-5 transition hover:text-red-600">
                      {video.title}
                    </h2>
                  </Link>
                  {video.channel && <p className="mt-1 text-xs text-gray-500">{video.channel}</p>}

                  <p className="mt-2 text-xs font-medium text-red-600">
                    Open video group →
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
