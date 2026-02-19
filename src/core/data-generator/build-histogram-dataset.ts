import type {
  ComplexMockRecord,
  DataScale,
  HistogramDataset,
} from "@/types/chart-data";

// Synthetic metric value range used for histogram bucketing (0..999).
const VALUE_MAX = 1000;
// Upper bound for full simulation to keep runtime predictable at high scales.
const MAX_SIMULATION_SAMPLES = 1000000;
// Raw records retained in memory and returned to UI for preview/inspection.
const MAX_RETAINED_RECORDS = 25000;

interface BuildDatasetInput {
  scale: DataScale;
  bucketCount: number;
  seed: number;
}

// Input payload for building one complex raw record.
interface RecordBuildInput {
  index: number;
  value: number;
  bucketIndex: number;
  bucketLabel: string;
  bucketCount: number;
  seed: number;
  random: () => number;
}

// Combines user seed with a salt so each stage can have deterministic but isolated randomness.
function mixSeed(seed: number, salt: number): number {
  const mixed = (seed ^ (salt + 0x9e3779b9 + (seed << 6) + (seed >>> 2))) >>> 0;
  return mixed === 0 ? 1 : mixed;
}

// Lightweight deterministic RNG (xorshift32); returns number in [0, 1).
function createSeededRng(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;

    return (value >>> 0) / 4294967296;
  };
}

// Generic numeric clamp helper.
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Stable numeric formatter used before storing telemetry-style decimal fields.
function toFixedNumber(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

// Builds bucket labels like "0-11", "12-24" based on configured bucket count.
function createBucketLabels(bucketCount: number): string[] {
  const step = VALUE_MAX / bucketCount;

  return Array.from({ length: bucketCount }, (_, index) => {
    const start = Math.floor(step * index);
    const end = Math.floor(step * (index + 1) - 1);
    return `${start}-${Math.max(start, end)}`;
  });
}

// Creates cumulative probability distribution used to sample bucket indices.
// Distribution shape intentionally changes by scale (waves + spikes) to emulate non-uniform real data.
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

// Binary search over cumulative distribution to pick a bucket from a random value.
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

// Produces one metric value uniformly inside the selected bucket range.
function sampleValueInBucket(
  bucketIndex: number,
  bucketCount: number,
  random: () => number,
): number {
  const start = Math.floor((bucketIndex * VALUE_MAX) / bucketCount);
  const end = Math.max(start, Math.floor(((bucketIndex + 1) * VALUE_MAX) / bucketCount) - 1);

  return start + Math.floor(random() * (end - start + 1));
}

// Scales sampled bucket counts so their sum matches the requested target scale.
// Largest-remainder method preserves relative distribution while fixing integer rounding.
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

// Region mapping used in synthetic geo payload.
function mapRegion(value: number): string {
  if (value < 250) {
    return "na-west";
  }

  if (value < 500) {
    return "na-east";
  }

  if (value < 750) {
    return "ap-northeast";
  }

  return "eu-central";
}

// Converts anomaly score into coarse risk level.
function mapRiskLevel(score: number): "normal" | "elevated" | "critical" {
  if (score >= 0.82) {
    return "critical";
  }

  if (score >= 0.56) {
    return "elevated";
  }

  return "normal";
}

// Converts normalized score to a compact band label.
function mapScoringBand(score: number): "low" | "medium" | "high" {
  if (score >= 0.75) {
    return "high";
  }

  if (score >= 0.45) {
    return "medium";
  }

  return "low";
}

// Builds one intentionally complex mock record.
// This function is the main source of "real-world-like" nested object weight.
function createComplexRecord({
  index,
  value,
  bucketIndex,
  bucketLabel,
  bucketCount,
  seed,
  random,
}: RecordBuildInput): ComplexMockRecord {
  const ordinal = index + 1;
  const entropy = mixSeed(seed, value + bucketIndex * 4099 + ordinal * 17)
    .toString(16)
    .padStart(8, "0");
  const ratio = value / VALUE_MAX;
  const eventEpochMs = 1710000000000 + ordinal * 1297;
  const tierRoll = random();
  const accountTier =
    tierRoll < 0.55 ? "free" : tierRoll < 0.88 ? "team" : "enterprise";
  const retryCount = Math.floor(random() * 4);
  const itemCount = 2 + (ordinal % 3);
  const items = Array.from({ length: itemCount }, (_, itemIndex) => {
    const quantity = 1 + Math.floor(random() * 4);
    const unitPrice = Math.round((24 + random() * 620) * 100) / 100;
    const discountRate = toFixedNumber(random() * 0.25, 4);

    return {
      sku: `SKU-${bucketIndex}-${itemIndex}-${entropy.slice(0, 4)}`,
      category: ["hardware", "saas", "addon"][itemIndex % 3],
      quantity,
      unitPrice,
      discountRate,
    };
  });
  const subtotal = toFixedNumber(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    2,
  );
  const discountTotal = toFixedNumber(
    items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * item.discountRate,
      0,
    ),
    2,
  );
  const taxTotal = toFixedNumber((subtotal - discountTotal) * 0.1, 2);
  const shippingTotal = toFixedNumber(2 + random() * 12, 2);
  const grandTotal = toFixedNumber(
    subtotal - discountTotal + taxTotal + shippingTotal,
    2,
  );
  const score = clamp(0.22 + ratio * 0.5 + random() * 0.35, 0, 1);
  const anomalyLevel = mapRiskLevel(score);
  const normalizedScore = toFixedNumber(clamp(score * (0.85 + random() * 0.24), 0, 1), 6);

  return {
    identity: {
      recordId: `rec-${entropy}-${ordinal}`,
      tenantId: `tenant-${1 + (bucketIndex % 12)}`,
      partition: bucketIndex % 16,
      traceId: `tr-${mixSeed(seed, ordinal ^ value).toString(16)}`,
      version: 1,
    },
    actor: {
      user: {
        userId: `user-${mixSeed(seed, ordinal * 13).toString(16)}`,
        accountTier,
        locale: ["ko-KR", "en-US", "ja-JP"][bucketIndex % 3],
        tags: [
          `bucket-${bucketIndex}`,
          `segment-${bucketIndex % 5}`,
          `tier-${accountTier}`,
        ],
      },
      session: {
        sessionId: `sess-${entropy}-${bucketIndex}`,
        startedAt: new Date(eventEpochMs - Math.floor(random() * 600000)).toISOString(),
        sequence: ordinal,
        retryCount,
      },
      device: {
        os: ["ios", "android", "web"][bucketIndex % 3] as "ios" | "android" | "web",
        osVersion: `${14 + (bucketIndex % 5)}.${Math.floor(random() * 5)}`,
        appVersion: `${1 + (bucketIndex % 3)}.${Math.floor(random() * 10)}.${Math.floor(
          random() * 10,
        )}`,
        model: `model-${bucketIndex % 8}`,
        network: ["wifi", "lte", "5g"][bucketIndex % 3] as "wifi" | "lte" | "5g",
      },
      geo: {
        country: ["KR", "US", "JP", "DE"][bucketIndex % 4],
        region: mapRegion(value),
        lat: toFixedNumber(-80 + random() * 160, 6),
        lng: toFixedNumber(-170 + random() * 340, 6),
        timezone: ["Asia/Seoul", "America/Los_Angeles", "Asia/Tokyo", "Europe/Berlin"][
          bucketIndex % 4
        ],
      },
    },
    commerce: {
      order: {
        orderId: `ord-${entropy}-${bucketIndex}`,
        currency: ["USD", "KRW", "JPY"][bucketIndex % 3] as "USD" | "KRW" | "JPY",
        items,
        couponCodes: [`AUTO-${bucketIndex % 9}`, `VIP-${ordinal % 7}`],
        totals: {
          subtotal,
          discountTotal,
          taxTotal,
          shippingTotal,
          grandTotal,
        },
      },
      payment: {
        method: ["card", "wallet", "bank"][bucketIndex % 3] as
          | "card"
          | "wallet"
          | "bank",
        gateway: ["stripe", "adyen", "inhouse"][ordinal % 3] as
          | "stripe"
          | "adyen"
          | "inhouse",
        installments: 1 + (ordinal % 6),
        auth: {
          approved: score < 0.92,
          score: toFixedNumber(score, 6),
          reasonCodes: score < 0.56 ? ["pass"] : ["velocity", "geo-mismatch"],
        },
      },
      fulfillment: {
        channel: ["standard", "express", "pickup"][ordinal % 3] as
          | "standard"
          | "express"
          | "pickup",
        warehouseId: `wh-${1 + (bucketIndex % 6)}`,
        etaMinutes: 20 + Math.floor(random() * 360),
        checkpoints: [
          { step: "packed", atOffsetMinutes: 3, success: true },
          { step: "shipped", atOffsetMinutes: 32, success: score < 0.95 },
          { step: "arrived", atOffsetMinutes: 120, success: score < 0.89 },
        ],
      },
    },
    telemetry: {
      features: {
        flags: {
          fastPath: value > 600,
          dedupeEnabled: bucketIndex % 2 === 0,
          scoreV2Enabled: bucketIndex % 3 === 0,
          edgeCacheHit: random() > 0.4,
          shadowMode: random() > 0.7,
          fallbackUsed: retryCount > 1,
        },
        counters: [
          {
            name: "attempts",
            value: 1 + retryCount,
            trend: toFixedNumber(-0.3 + random() * 0.6, 6),
          },
          {
            name: "items",
            value: itemCount,
            trend: toFixedNumber(-0.3 + random() * 0.6, 6),
          },
          {
            name: "bucketTraffic",
            value: 1 + Math.round(value * 0.7),
            trend: toFixedNumber(-0.3 + random() * 0.6, 6),
          },
        ],
      },
      embeddings: Array.from({ length: 12 }, (_, embeddingIndex) =>
        toFixedNumber(
          Math.sin((bucketIndex + 1) * (embeddingIndex + 1) * 0.17) *
            (0.55 + random() * 0.45),
          6,
        ),
      ),
      checkpoints: [
        { stage: "ingest", atOffsetMs: 8, state: "ok" },
        {
          stage: "enrich",
          atOffsetMs: 15 + Math.floor(random() * 12),
          state: retryCount > 1 ? "warn" : "ok",
        },
        {
          stage: "aggregate",
          atOffsetMs: 27 + Math.floor(random() * 15),
          state: score > 0.82 ? "retry" : "ok",
        },
        {
          stage: "publish",
          atOffsetMs: 40 + Math.floor(random() * 18),
          state: score > 0.9 ? "warn" : "ok",
        },
      ],
      timings: {
        ingestMs: toFixedNumber(1 + random() * 6, 3),
        normalizeMs: toFixedNumber(1 + random() * 6, 3),
        scoreMs: toFixedNumber(1 + random() * 6, 3),
        publishMs: toFixedNumber(1 + random() * 6, 3),
      },
    },
    quality: {
      anomaly: {
        score: toFixedNumber(score, 6),
        level: anomalyLevel,
        signals: [
          {
            name: "velocity",
            value: toFixedNumber(random(), 6),
            threshold: 0.62,
          },
          {
            name: "amount",
            value: toFixedNumber(grandTotal / 1000, 6),
            threshold: 0.7,
          },
          {
            name: "geo",
            value: toFixedNumber(random(), 6),
            threshold: 0.66,
          },
        ],
      },
      scoring: {
        raw: toFixedNumber(score * 1000, 3),
        normalized: normalizedScore,
        band: mapScoringBand(normalizedScore),
      },
      tags: [
        `bucket:${bucketIndex}`,
        `risk:${anomalyLevel}`,
        `region:${mapRegion(value)}`,
      ],
    },
    metric: {
      value,
      bucketIndex,
      bucketLabel,
      eventAt: new Date(eventEpochMs).toISOString(),
      derived: {
        movingAverage: toFixedNumber(value * (0.92 + random() * 0.16), 4),
        percentileHint: toFixedNumber((bucketIndex + 1) / bucketCount, 6),
        confidence: toFixedNumber(clamp(0.4 + random() * 0.6, 0, 1), 6),
      },
    },
  };
}

// Estimates bytes-per-record from a small sample for rough footprint reporting.
function estimateRecordBytes(records: ComplexMockRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  const sampleCount = Math.min(20, records.length);
  let bytes = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    bytes += JSON.stringify(records[index]).length * 2;
  }

  return Math.max(1, Math.round(bytes / sampleCount));
}

export function buildHistogramDataset({
  scale,
  bucketCount,
  seed,
}: BuildDatasetInput): HistogramDataset {
  const startedAt = performance.now();
  // "sampled-stream" mode starts when requested scale exceeds this sample size.
  const sampleSize = Math.min(scale, MAX_SIMULATION_SAMPLES);
  // We do not keep all raw records in memory; only a preview slice is retained.
  const retentionLimit = Math.min(sampleSize, MAX_RETAINED_RECORDS);
  const labels = createBucketLabels(bucketCount);
  let counts = Array.from<number>({ length: bucketCount }).fill(0);
  const records: ComplexMockRecord[] = [];
  // Separate RNG streams reduce accidental coupling between distribution shape and record fields.
  const distributionRandom = createSeededRng(
    mixSeed(seed, scale ^ (bucketCount * 2654435761)),
  );
  const sampleRandom = createSeededRng(mixSeed(seed, scale + bucketCount * 4099));
  const bucketDistribution = createBucketDistribution(
    bucketCount,
    scale,
    distributionRandom,
  );
  const buildStartedAt = performance.now();
  const recordRandom = createSeededRng(mixSeed(seed, bucketCount * 193));

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let total = 0;
  let checksum = 0;

  for (let index = 0; index < sampleSize; index += 1) {
    // 1) pick bucket by distribution, 2) sample value inside bucket.
    const bucketIndex = pickBucketIndex(bucketDistribution, sampleRandom());
    const value = sampleValueInBucket(bucketIndex, bucketCount, sampleRandom);
    const bucketLabel = labels[bucketIndex];
    // Build a full nested raw record so generation cost reflects realistic object complexity.
    const record = createComplexRecord({
      index,
      value,
      bucketIndex,
      bucketLabel,
      bucketCount,
      seed,
      random: recordRandom,
    });

    if (value < min) {
      min = value;
    }

    if (value > max) {
      max = value;
    }

    total += value;
    counts[bucketIndex] += 1;
    checksum += record.quality.scoring.raw * (bucketIndex + 1) + record.metric.derived.confidence;

    if (index < retentionLimit) {
      records.push(record);
    }
  }

  const afterRecordBuild = performance.now();
  // Approximate mode means we sampled less than requested total scale.
  const isApproximate = sampleSize < scale;

  if (isApproximate) {
    // Expand sampled histogram back to target scale while preserving shape.
    counts = scaleCountsToTarget(counts, sampleSize, scale);
  }

  const afterAggregation = performance.now();
  const estimatedRecordBytes = estimateRecordBytes(records);
  const estimatedScaleFootprintMb =
    estimatedRecordBytes === 0
      ? 0
      : toFixedNumber((estimatedRecordBytes * scale) / (1024 * 1024), 2);
  const sampleExpansionFactor = toFixedNumber(scale / sampleSize, 6);
  const retentionRatio = toFixedNumber(records.length / sampleSize, 6);
  const pipelineMode = isApproximate ? "sampled-stream" : "full-materialized";

  return {
    scale,
    bucketCount,
    labels,
    counts,
    records,
    pipeline: {
      mode: pipelineMode,
      // Number of records actually looped through and materialized in processing step.
      processedRecordCount: sampleSize,
      // Number of records kept for UI preview/debug (bounded by retention limit).
      retainedRecordCount: records.length,
      retentionRatio,
      // 1 means full-materialized; >1 means sampled-stream expansion.
      sampleExpansionFactor,
      estimatedRecordBytes,
      estimatedScaleFootprintMb,
      checksum: toFixedNumber(checksum, 3),
      timings: {
        recordBuildMs: toFixedNumber(afterRecordBuild - buildStartedAt, 2),
        aggregationMs: toFixedNumber(afterAggregation - afterRecordBuild, 2),
        totalMs: toFixedNumber(afterAggregation - buildStartedAt, 2),
      },
    },
    min,
    max,
    average: toFixedNumber(total / sampleSize, 2),
    seed,
    generatedAt: new Date().toISOString(),
    generationMs: toFixedNumber(performance.now() - startedAt, 2),
    sampleSize,
    isApproximate,
  };
}
