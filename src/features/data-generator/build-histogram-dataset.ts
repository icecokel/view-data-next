import type { DataScale, HistogramDataset } from "@/types/chart-data";

const VALUE_MAX = 1000;

interface BuildDatasetInput {
  scale: DataScale;
  bucketCount: number;
  seed: number;
}

function createSeededRng(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;

    return (value >>> 0) / 4294967296;
  };
}

function createBucketLabels(bucketCount: number): string[] {
  const step = VALUE_MAX / bucketCount;

  return Array.from({ length: bucketCount }, (_, index) => {
    const start = Math.floor(step * index);
    const end = Math.floor(step * (index + 1) - 1);
    return `${start}-${Math.max(start, end)}`;
  });
}

export function buildHistogramDataset({
  scale,
  bucketCount,
  seed,
}: BuildDatasetInput): HistogramDataset {
  const startedAt = performance.now();
  const counts = Array.from<number>({ length: bucketCount }).fill(0);
  const labels = createBucketLabels(bucketCount);
  const random = createSeededRng(seed);

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let total = 0;

  for (let index = 0; index < scale; index += 1) {
    const normalized = (random() + random() + random()) / 3;
    const value = Math.floor(normalized * VALUE_MAX);

    if (value < min) {
      min = value;
    }

    if (value > max) {
      max = value;
    }

    total += value;

    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.floor((value / VALUE_MAX) * bucketCount),
    );

    counts[bucketIndex] += 1;
  }

  return {
    scale,
    bucketCount,
    labels,
    counts,
    min,
    max,
    average: Number((total / scale).toFixed(2)),
    seed,
    generatedAt: new Date().toISOString(),
    generationMs: Number((performance.now() - startedAt).toFixed(2)),
  };
}
