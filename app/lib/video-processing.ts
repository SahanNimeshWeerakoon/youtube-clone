import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';

const TEMP_DIR = path.join(os.tmpdir(), 'youtube-clone');
const VIDEO_DIR = path.join(TEMP_DIR, 'videos');
const CROP_DIR = path.join(TEMP_DIR, 'crops');
const YT_DLP_BIN = process.env.YT_DLP_BIN ?? 'yt-dlp';
const FFMPEG_BIN = process.env.FFMPEG_BIN ?? 'ffmpeg';

const downloadInProgress = new Map<string, Promise<string>>();
let dependencyCheck: Promise<void> | undefined;

function ensureDirs() {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  fs.mkdirSync(CROP_DIR, { recursive: true });
}

export function getVideoPath(videoId: string): string {
  return path.join(VIDEO_DIR, `${videoId}.mp4`);
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
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const tempOutput = path.join(VIDEO_DIR, `${videoId}.%(ext)s`);

    // Map quality to yt-dlp format selector
    const formatMap: Record<string, string> = {
      '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio/best[ext=mp4]/best',
      '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio/best[ext=mp4]/best',
      '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio/best[ext=mp4]/best',
      '360p': 'bestvideo[height<=360][ext=mp4]+bestaudio/best[ext=mp4]/best',
      best: 'bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best',
    };

    const format = quality && formatMap[quality] ? formatMap[quality] : formatMap.best;

    await runCommand(YT_DLP_BIN, [
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
      url,
    ]);

    const files = fs.readdirSync(VIDEO_DIR).filter((f) => f.startsWith(videoId));
    const downloaded = files.find((f) => f.endsWith('.mp4'));

    if (!downloaded) {
      throw new Error('yt-dlp completed but no video file was found');
    }

    const downloadedPath = path.join(VIDEO_DIR, downloaded);
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
  const id = `${videoId}-${Date.now()}`;
  return path.join(CROP_DIR, `${id}.mp4`);
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
