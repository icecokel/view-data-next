import type { DataScale, HistogramDataset } from "@/types/chart-data";

const VALUE_MAX = 1000;
const MAX_SIMULATION_SAMPLES = 1000000;

interface BuildDatasetInput {
  scale: DataScale;
  bucketCount: number;
  seed: number;
}

function mixSeed(seed: number, salt: number): number {
  const mixed = (seed ^ (salt + 0x9e3779b9 + (seed << 6) + (seed >>> 2))) >>> 0;
  return mixed === 0 ? 1 : mixed;
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

function createBucketDistribution(
  bucketCount: number,
  scale: DataScale,
  random: () => number,
): number[] {
  const scaleLog = Math.log10(scale);
  const roughness = 0.78 + (scaleLog - 4) * 0.08;
  const waveAFrequency = 0.38 + scaleLog * 0.09;
  const waveBFrequency = 1.05 + scaleLog * 0.13;
  const spikeChance = Math.min(0.28, 0.1 + (scaleLog - 4) * 0.02);
  const phaseA = random() * Math.PI * 2;
  const phaseB = random() * Math.PI * 2;
  const weights = Array.from<number>({ length: bucketCount }).fill(0);

  let totalWeight = 0;

  for (let index = 0; index < bucketCount; index += 1) {
    const base = 0.35 + random() * 0.85;
    const waveA = 1 + 0.75 * roughness * Math.sin(index * waveAFrequency + phaseA);
    const waveB = 1 + 0.4 * roughness * Math.sin(index * waveBFrequency + phaseB);
    const spikeBoost =
      random() < spikeChance ? 1.6 + random() * (2.2 * roughness + 0.6) : 1;
    const weight = Math.max(0.001, base * waveA * waveB * spikeBoost);

    weights[index] = weight;
    totalWeight += weight;
  }

  const cumulative = Array.from<number>({ length: bucketCount }).fill(0);
  let running = 0;

  for (let index = 0; index < bucketCount; index += 1) {
    running += weights[index] / totalWeight;
    cumulative[index] = running;
  }

  cumulative[bucketCount - 1] = 1;

  return cumulative;
}

function pickBucketIndex(cumulative: number[], value: number): number {
  let left = 0;
  let right = cumulative.length - 1;

  while (left < right) {
    const middle = Math.floor((left + right) / 2);

    if (value <= cumulative[middle]) {
      right = middle;
    } else {
      left = middle + 1;
    }
  }

  return left;
}

function sampleValueInBucket(
  bucketIndex: number,
  bucketCount: number,
  random: () => number,
): number {
  const start = Math.floor((bucketIndex * VALUE_MAX) / bucketCount);
  const end = Math.max(start, Math.floor(((bucketIndex + 1) * VALUE_MAX) / bucketCount) - 1);

  return start + Math.floor(random() * (end - start + 1));
}

function scaleCountsToTarget(
  sampleCounts: number[],
  sampleTotal: number,
  targetTotal: number,
): number[] {
  if (sampleTotal === targetTotal) {
    return sampleCounts;
  }

  const scaleFactor = targetTotal / sampleTotal;
  const scaledCounts = Array.from<number>({ length: sampleCounts.length }).fill(0);
  const remainders: { index: number; remainder: number }[] = [];

  let assigned = 0;

  for (let index = 0; index < sampleCounts.length; index += 1) {
    const scaled = sampleCounts[index] * scaleFactor;
    const baseCount = Math.floor(scaled);

    scaledCounts[index] = baseCount;
    assigned += baseCount;
    remainders.push({ index, remainder: scaled - baseCount });
  }

  const remaining = targetTotal - assigned;

  remainders.sort((a, b) => b.remainder - a.remainder);

  for (let index = 0; index < remaining; index += 1) {
    const targetIndex = remainders[index % remainders.length].index;
    scaledCounts[targetIndex] += 1;
  }

  return scaledCounts;
}

export function buildHistogramDataset({
  scale,
  bucketCount,
  seed,
}: BuildDatasetInput): HistogramDataset {
  const startedAt = performance.now();
  const sampleSize = Math.min(scale, MAX_SIMULATION_SAMPLES);
  let counts = Array.from<number>({ length: bucketCount }).fill(0);
  const labels = createBucketLabels(bucketCount);
  const distributionRandom = createSeededRng(
    mixSeed(seed, scale ^ (bucketCount * 2654435761)),
  );
  const sampleRandom = createSeededRng(mixSeed(seed, scale + bucketCount * 4099));
  const bucketDistribution = createBucketDistribution(
    bucketCount,
    scale,
    distributionRandom,
  );

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let total = 0;

  for (let index = 0; index < sampleSize; index += 1) {
    const bucketIndex = pickBucketIndex(bucketDistribution, sampleRandom());
    const value = sampleValueInBucket(bucketIndex, bucketCount, sampleRandom);

    if (value < min) {
      min = value;
    }

    if (value > max) {
      max = value;
    }

    total += value;

    counts[bucketIndex] += 1;
  }

  const isApproximate = sampleSize < scale;
  if (isApproximate) {
    counts = scaleCountsToTarget(counts, sampleSize, scale);
  }

  return {
    scale,
    bucketCount,
    labels,
    counts,
    min,
    max,
    average: Number((total / sampleSize).toFixed(2)),
    seed,
    generatedAt: new Date().toISOString(),
    generationMs: Number((performance.now() - startedAt).toFixed(2)),
    sampleSize,
    isApproximate,
  };
}
