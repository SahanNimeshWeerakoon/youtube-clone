export interface StoryboardLevel {
  levelIndex: number;
  thumbWidth: number;
  thumbHeight: number;
  frameCount: number;
  cols: number;
  rows: number;
  intervalMs: number;
}

export interface StoryboardData {
  urlTemplate: string;
  levels: StoryboardLevel[];
}

export interface StoryboardFrame {
  sheetUrl: string;
  col: number;
  row: number;
  cols: number;
  rows: number;
  thumbWidth: number;
  thumbHeight: number;
  timeSeconds: number;
}

export function parseStoryboardSpec(spec: string): StoryboardData {
  const parts = spec.split('|');
  const urlTemplate = parts[0];

  const levels = parts.slice(1).map((part, index) => {
    const [thumbWidth, thumbHeight, frameCount, cols, rows, intervalMs] =
      part.split('#');

    return {
      levelIndex: index,
      thumbWidth: parseInt(thumbWidth, 10),
      thumbHeight: parseInt(thumbHeight, 10),
      frameCount: parseInt(frameCount, 10),
      cols: parseInt(cols, 10),
      rows: parseInt(rows, 10),
      intervalMs: parseInt(intervalMs, 10),
    };
  });

  return { urlTemplate, levels };
}

export function pickPreviewLevel(levels: StoryboardLevel[]): StoryboardLevel {
  const withInterval = levels.filter((l) => l.intervalMs > 0);
  if (withInterval.length === 0) return levels[levels.length - 1];
  return withInterval[withInterval.length - 1];
}

export function estimateDuration(level: StoryboardLevel): number {
  if (level.intervalMs <= 0) return level.frameCount * 2;
  return (level.frameCount * level.intervalMs) / 1000;
}

export function getFrameAtTime(
  data: StoryboardData,
  timeSeconds: number,
  level?: StoryboardLevel
): StoryboardFrame {
  const previewLevel = level ?? pickPreviewLevel(data.levels);
  const intervalSec =
    previewLevel.intervalMs > 0 ? previewLevel.intervalMs / 1000 : 2;

  const frameIndex = Math.min(
    Math.max(0, Math.floor(timeSeconds / intervalSec)),
    previewLevel.frameCount - 1
  );

  const framesPerSheet = previewLevel.cols * previewLevel.rows;
  const sheetIndex = Math.floor(frameIndex / framesPerSheet);
  const frameInSheet = frameIndex % framesPerSheet;
  const col = frameInSheet % previewLevel.cols;
  const row = Math.floor(frameInSheet / previewLevel.cols);

  const sheetUrl = data.urlTemplate
    .replace('$L', String(previewLevel.levelIndex))
    .replace('$N', String(sheetIndex));

  return {
    sheetUrl,
    col,
    row,
    cols: previewLevel.cols,
    rows: previewLevel.rows,
    thumbWidth: previewLevel.thumbWidth,
    thumbHeight: previewLevel.thumbHeight,
    timeSeconds: frameIndex * intervalSec,
  };
}

const storyboardCache = new Map<string, StoryboardData>();

export async function fetchStoryboard(videoId: string): Promise<StoryboardData> {
  const cached = storyboardCache.get(videoId);
  if (cached) return cached;

  const response = await fetch(`/api/storyboard/${videoId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch storyboard');
  }

  const data: StoryboardData = await response.json();
  storyboardCache.set(videoId, data);
  return data;
}
