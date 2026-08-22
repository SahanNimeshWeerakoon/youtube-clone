import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const DOWNLOAD_DIR =
  process.env.DOWNLOAD_DIR ??
  path.join(/* turbopackIgnore: true */ process.cwd(), 'downloads');
const YT_DLP_BIN = process.env.YT_DLP_BIN ?? 'yt-dlp';
const FFMPEG_BIN = process.env.FFMPEG_BIN ?? 'ffmpeg';
const YT_DLP_COOKIES_FILE = process.env.YT_DLP_COOKIES_FILE;
const YT_DLP_PROXY = process.env.YT_DLP_PROXY;
const YT_DLP_EXTRACTOR_ARGS = process.env.YT_DLP_EXTRACTOR_ARGS;

const downloadInProgress = new Map<string, Promise<string>>();
let dependencyCheck: Promise<void> | undefined;

function ensureDirs() {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

export interface DownloadedCrop {
  name: string;
  filename: string;
  thumbnailFilename: string | null;
  createdAt: string;
  startTime: number;
  endTime: number;
}

export interface DownloadedVideo {
  videoId: string;
  title: string;
  thumbnail: string | null;
  channel: string;
  downloadedAt: string;
  fullVideoFilename: string;
  crops: DownloadedCrop[];
}

interface SaveVideoMetadata {
  title?: string;
  thumbnailUrl?: string;
  channel?: string;
}

function getVideoDirectory(videoId: string): string {
  return path.join(DOWNLOAD_DIR, videoId);
}

function getMetadataPath(videoId: string): string {
  return path.join(getVideoDirectory(videoId), 'metadata.json');
}

export function getVideoPath(videoId: string): string {
  return path.join(getVideoDirectory(videoId), 'full-video.mp4');
}

export function videoExists(videoId: string): boolean {
  return fs.existsSync(getVideoPath(videoId));
}

function runCommand(
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      reject(
        new Error(
          `${command} failed to start: ${err.message}. Is ${command} installed?`
        )
      );
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(`${command} exited with code ${code}: ${stderr || stdout}`)
        );
      }
    });
  });
}

async function ensureVideoTools(): Promise<void> {
  dependencyCheck ??= Promise.all([
    runCommand(YT_DLP_BIN, ['--version']),
    runCommand(FFMPEG_BIN, ['-version']),
  ]).then(() => undefined);

  try {
    await dependencyCheck;
  } catch (error) {
    dependencyCheck = undefined;
    throw error;
  }
}

export async function downloadVideo(videoId: string, quality?: string): Promise<string> {
  ensureDirs();
  await ensureVideoTools();

  const outputPath = getVideoPath(videoId);
  if (fs.existsSync(outputPath)) {
    return outputPath;
  }

  const existing = downloadInProgress.get(videoId);
  if (existing) {
    return existing;
  }

  const downloadPromise = (async () => {
    const videoDirectory = getVideoDirectory(videoId);
    fs.mkdirSync(videoDirectory, { recursive: true });
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const tempOutput = path.join(videoDirectory, 'source.%(ext)s');

    // Map quality to yt-dlp format selector
    const formatMap: Record<string, string> = {
      '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio/best[ext=mp4]/best',
      '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio/best[ext=mp4]/best',
      '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio/best[ext=mp4]/best',
      '360p': 'bestvideo[height<=360][ext=mp4]+bestaudio/best[ext=mp4]/best',
      '144p': 'bestvideo[height<=144][ext=mp4]+bestaudio/best[height<=144][ext=mp4]/worst[ext=mp4]/worst',
      best: 'bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best',
    };

    const format = quality && formatMap[quality] ? formatMap[quality] : formatMap.best;

    const baseArgs = [
      '-f',
      format,
      '--js-runtimes',
      'node',
      '--retries',
      '3',
      '--fragment-retries',
      '3',
      '--merge-output-format',
      'mp4',
      '-o',
      tempOutput,
      '--no-playlist',
    ];

    if (YT_DLP_COOKIES_FILE) {
      baseArgs.push('--cookies', YT_DLP_COOKIES_FILE);
    }
    if (YT_DLP_PROXY) {
      baseArgs.push('--proxy', YT_DLP_PROXY);
    }
    if (YT_DLP_EXTRACTOR_ARGS) {
      baseArgs.push('--extractor-args', YT_DLP_EXTRACTOR_ARGS);
    }

    try {
      await runCommand(YT_DLP_BIN, [...baseArgs, url]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // YouTube increasingly requires a PO token for its default web client.
      // These clients currently provide a useful token-free fallback. Operators
      // can override this with YT_DLP_EXTRACTOR_ARGS when YouTube changes again.
      if (message.includes('HTTP Error 403') && !YT_DLP_EXTRACTOR_ARGS) {
        await runCommand(YT_DLP_BIN, [
          ...baseArgs,
          '--extractor-args',
          'youtube:player_client=web_embedded,tv',
          url,
        ]).catch((fallbackError) => {
          const fallbackMessage =
            fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          throw new Error(
            `YouTube refused the server's download request (HTTP 403). ` +
              `Configure YT_DLP_COOKIES_FILE and, when required, ` +
              `YT_DLP_EXTRACTOR_ARGS with a PO-token provider/client. ${fallbackMessage}`
          );
        });
      } else {
        throw error;
      }
    }

    const files = fs.readdirSync(videoDirectory);
    const downloaded = files.find((f) => f.startsWith('source.') && f.endsWith('.mp4'));

    if (!downloaded) {
      throw new Error('yt-dlp completed but no video file was found');
    }

    const downloadedPath = path.join(videoDirectory, downloaded);
    if (downloadedPath !== outputPath) {
      fs.renameSync(downloadedPath, outputPath);
    }

    return outputPath;
  })();

  downloadInProgress.set(videoId, downloadPromise);

  try {
    return await downloadPromise;
  } finally {
    downloadInProgress.delete(videoId);
  }
}

export async function cropVideo(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<string> {
  ensureDirs();

  if (!fs.existsSync(inputPath)) {
    throw new Error('Source video file not found');
  }

  const duration = endTime - startTime;
  if (duration <= 0) {
    throw new Error('End time must be greater than start time');
  }

  await ensureVideoTools();

  await runCommand(FFMPEG_BIN, [
    '-y',
    '-ss',
    String(startTime),
    '-i',
    inputPath,
    '-t',
    String(duration),
    '-map',
    '0:v:0',
    '-map',
    '0:a:0?',
    '-c',
    'copy',
    '-avoid_negative_ts',
    'make_zero',
    outputPath,
  ]);

  if (!fs.existsSync(outputPath)) {
    throw new Error('FFmpeg completed but output file was not created');
  }

  return outputPath;
}

export async function createVideoThumbnail(
  videoPath: string,
  outputPath: string,
  seekSeconds = 0
): Promise<string> {
  await ensureVideoTools();
  await runCommand(FFMPEG_BIN, [
    '-y',
    '-ss',
    String(Math.max(0, seekSeconds)),
    '-i',
    videoPath,
    '-frames:v',
    '1',
    '-vf',
    'scale=640:-2',
    '-q:v',
    '3',
    outputPath,
  ]);
  if (!fs.existsSync(outputPath)) {
    throw new Error('Failed to create clip thumbnail');
  }
  return outputPath;
}

export function createVideoReadStream(
  filePath: string,
  start?: number,
  end?: number
): fs.ReadStream {
  return fs.createReadStream(filePath, start !== undefined ? { start, end } : {});
}

export function getFileStats(filePath: string): fs.Stats {
  return fs.statSync(filePath);
}

export function createCropOutputPath(videoId: string): string {
  ensureDirs();
  const cropDirectory = path.join(getVideoDirectory(videoId), 'crops');
  fs.mkdirSync(cropDirectory, { recursive: true });
  return path.join(cropDirectory, `crop-${Date.now()}.mp4`);
}

export function sanitizeDownloadName(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function createNamedCropOutputPath(videoId: string, requestedName: string): string {
  ensureDirs();
  const cropDirectory = path.join(getVideoDirectory(videoId), 'crops');
  fs.mkdirSync(cropDirectory, { recursive: true });
  const safeName = sanitizeDownloadName(requestedName) || 'Cropped video';
  let filename = `${safeName}.mp4`;
  let suffix = 2;
  while (fs.existsSync(path.join(cropDirectory, filename))) {
    filename = `${safeName} (${suffix}).mp4`;
    suffix += 1;
  }
  return path.join(cropDirectory, filename);
}

function readMetadata(videoId: string): DownloadedVideo | null {
  try {
    return JSON.parse(fs.readFileSync(getMetadataPath(videoId), 'utf8')) as DownloadedVideo;
  } catch {
    return null;
  }
}

function writeMetadata(metadata: DownloadedVideo): void {
  const directory = getVideoDirectory(metadata.videoId);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(getMetadataPath(metadata.videoId), JSON.stringify(metadata, null, 2));
}

export async function saveVideoMetadata(
  videoId: string,
  details: SaveVideoMetadata
): Promise<DownloadedVideo> {
  const existing = readMetadata(videoId);
  const directory = getVideoDirectory(videoId);
  fs.mkdirSync(directory, { recursive: true });

  let thumbnail = existing?.thumbnail ?? null;
  if (!thumbnail && details.thumbnailUrl) {
    try {
      const response = await fetch(details.thumbnailUrl);
      if (response.ok) {
        const thumbnailPath = path.join(directory, 'thumbnail.jpg');
        fs.writeFileSync(thumbnailPath, Buffer.from(await response.arrayBuffer()));
        thumbnail = 'thumbnail.jpg';
      }
    } catch {
      // Metadata is still useful if YouTube's thumbnail host is unavailable.
    }
  }

  const metadata: DownloadedVideo = {
    videoId,
    title: details.title?.trim() || existing?.title || `Video ${videoId}`,
    thumbnail,
    channel: details.channel?.trim() || existing?.channel || '',
    downloadedAt: existing?.downloadedAt || new Date().toISOString(),
    fullVideoFilename: 'full-video.mp4',
    crops: existing?.crops || [],
  };
  writeMetadata(metadata);
  return metadata;
}

export function addCropMetadata(
  videoId: string,
  outputPath: string,
  name: string,
  startTime: number,
  endTime: number,
  thumbnailPath: string | null
): DownloadedVideo {
  const metadata = readMetadata(videoId) ?? {
    videoId,
    title: `Video ${videoId}`,
    thumbnail: null,
    channel: '',
    downloadedAt: new Date().toISOString(),
    fullVideoFilename: 'full-video.mp4',
    crops: [],
  };
  metadata.crops.push({
    name: sanitizeDownloadName(name) || 'Cropped video',
    filename: path.basename(outputPath),
    thumbnailFilename: thumbnailPath ? path.basename(thumbnailPath) : null,
    createdAt: new Date().toISOString(),
    startTime,
    endTime,
  });
  writeMetadata(metadata);
  return metadata;
}

export function listDownloadedVideos(): DownloadedVideo[] {
  ensureDirs();
  return fs
    .readdirSync(DOWNLOAD_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[a-zA-Z0-9_-]{11}$/.test(entry.name))
    .map((entry) => readMetadata(entry.name))
    .filter((item): item is DownloadedVideo => Boolean(item && videoExists(item.videoId)))
    .sort((a, b) => Date.parse(b.downloadedAt) - Date.parse(a.downloadedAt));
}

export function getDownloadedVideo(videoId: string): DownloadedVideo | null {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;
  const metadata = readMetadata(videoId);
  return metadata && videoExists(videoId) ? metadata : null;
}

export function getDownloadedAssetPath(
  videoId: string,
  asset: 'full' | 'thumbnail' | 'crop' | 'crop-thumbnail',
  cropFilename?: string
): string | null {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;
  const metadata = readMetadata(videoId);
  if (!metadata) return null;
  if (asset === 'thumbnail') {
    return metadata.thumbnail ? path.join(getVideoDirectory(videoId), metadata.thumbnail) : null;
  }
  if ((asset === 'crop' || asset === 'crop-thumbnail') && cropFilename) {
    const crop = metadata.crops.find((item) => item.filename === path.basename(cropFilename));
    if (!crop) return null;
    const filename =
      asset === 'crop-thumbnail' ? crop.thumbnailFilename : crop.filename;
    return filename ? path.join(getVideoDirectory(videoId), 'crops', filename) : null;
  }
  return asset === 'full' ? getVideoPath(videoId) : null;
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Best-effort cleanup
  }
}

export function nodeStreamToWeb(stream: Readable): ReadableStream {
  return Readable.toWeb(stream) as ReadableStream;
}

export function validateCropTimes(
  startTime: number,
  endTime: number,
  videoDuration?: number
): string | null {
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 'Start and end times must be valid numbers';
  }

  if (startTime < 0) {
    return 'Start time cannot be negative';
  }

  if (endTime <= startTime) {
    return 'End time must be greater than start time';
  }

  if (videoDuration !== undefined && endTime > videoDuration) {
    return 'End time cannot exceed video duration';
  }

  const minDuration = 0.5;
  if (endTime - startTime < minDuration) {
    return 'Crop selection must be at least 0.5 seconds';
  }

  return null;
}
