import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { getDownloadedVideo } from '@/app/lib/video-processing';
import VideoGroupGallery from './VideoGroupGallery';

export const dynamic = 'force-dynamic';

export default async function VideoGroupPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const video = getDownloadedVideo(videoId);
  if (!video) notFound();

  return (
    <main className="min-h-screen bg-[#fafafa] text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <Link
            href="/downloads"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft size={19} />
            <span className="hidden sm:inline">All downloads</span>
          </Link>
          <Link href="/" className="text-xl font-bold text-red-600 sm:text-2xl">▶ CloneTube</Link>
          <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-gray-500">
            <FolderOpen size={16} />
            Video group
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-9 sm:py-12">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-red-600">Offline library</p>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">{video.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Original video and {video.crops.length} {video.crops.length === 1 ? 'clip' : 'clips'} stored together in the project.
          </p>
        </div>
        <VideoGroupGallery video={video} />
      </div>
    </main>
  );
}
