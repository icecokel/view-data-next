import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildHistogramDataset } from "../src/core/data-generator/build-histogram-dataset";
import type { DataScale, HistogramDataset } from "../src/types/chart-data";

// Defaults mirror the playground controls so generated files can be reused directly.
const DEFAULT_SCALES: DataScale[] = [
  10000,
  50000,
  100000,
  500000,
  1000000,
  2000000,
  5000000,
  10000000,
];
const DEFAULT_BUCKET_COUNTS = [40, 80, 120, 160];
const DEFAULT_SEED = 20260212;
const DEFAULT_KEEP_RECORDS = 1;
const DEFAULT_OUTPUT_DIR = "public/mockup-data";

interface ScriptOptions {
  seed: number;
  scales: DataScale[];
  bucketCounts: number[];
  keepRecords: number;
  outputDir: string;
}

interface ManifestItem {
  scale: DataScale;
  bucketCount: number;
  seed: number;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  sampleSize: number;
  storedRecordCount: number;
  generationMs: number;
}

// Parses comma-separated numeric CLI values (e.g. "40,80,120").
function parseIntegerList(value: string): number[] {
  return value
    .split(",")
    .map((token) => Number.parseInt(token.trim(), 10))
    .filter((token) => Number.isFinite(token));
}

// Restricts user-provided scales to the DataScale union used by the app.
function parseDataScales(value: string): DataScale[] {
  return parseIntegerList(value).filter((scale): scale is DataScale =>
    DEFAULT_SCALES.includes(scale as DataScale),
  );
}

// Supported flags:
// --seed=20260212
// --scales=100000,500000
// --bucket-counts=80,120
// --keep-records=1
// --output-dir=public/mockup-data
function parseOptions(): ScriptOptions {
  const options: ScriptOptions = {
    seed: DEFAULT_SEED,
    scales: [...DEFAULT_SCALES],
    bucketCounts: [...DEFAULT_BUCKET_COUNTS],
    keepRecords: DEFAULT_KEEP_RECORDS,
    outputDir: path.resolve(process.cwd(), DEFAULT_OUTPUT_DIR),
  };

  for (const rawArg of process.argv.slice(2)) {
    if (!rawArg.startsWith("--")) {
      continue;
    }

    const [flag, value = ""] = rawArg.slice(2).split("=");

    if (flag === "seed") {
      const parsed = Number.parseInt(value, 10);

      if (Number.isFinite(parsed)) {
        options.seed = parsed;
      }
    }

    if (flag === "scales") {
      const parsed = parseDataScales(value);

      if (parsed.length > 0) {
        options.scales = parsed;
      }
    }

    if (flag === "bucket-counts") {
      const parsed = parseIntegerList(value);

      if (parsed.length > 0) {
        options.bucketCounts = parsed;
      }
    }

    if (flag === "keep-records") {
      const parsed = Number.parseInt(value, 10);

      if (Number.isFinite(parsed) && parsed >= 0) {
        options.keepRecords = parsed;
      }
    }

    if (flag === "output-dir" && value.trim().length > 0) {
      options.outputDir = path.resolve(process.cwd(), value.trim());
    }
  }

  return options;
}

// Keep file naming aligned with runtime loader in chart-playground.tsx.
function createMockupFileName(scale: DataScale, bucketCount: number, seed: number): string {
  return `mockup-scale-${scale}-bucket-${bucketCount}-seed-${seed}.json`;
}

// Reduces output size by keeping only N raw records for preview while preserving aggregates.
function compactDataset(dataset: HistogramDataset, keepRecords: number): HistogramDataset {
  const records = dataset.records.slice(0, keepRecords);

  return {
    ...dataset,
    records,
    pipeline: {
      ...dataset.pipeline,
      retainedRecordCount: records.length,
      retentionRatio: Number((records.length / dataset.sampleSize).toFixed(6)),
    },
  };
}

async function main() {
  const options = parseOptions();

  // Ensure output folder exists before writing per-scale JSON files.
  await mkdir(options.outputDir, { recursive: true });

  const manifest: ManifestItem[] = [];
  const startedAt = performance.now();

  // Produce one file per (bucketCount, scale) pair.
  for (const bucketCount of options.bucketCounts) {
    for (const scale of options.scales) {
      // Build full dataset first, then compact only retained raw records.
      const dataset = buildHistogramDataset({
        scale,
        bucketCount,
        seed: options.seed,
      });
      const output = compactDataset(dataset, options.keepRecords);
      const fileName = createMockupFileName(scale, bucketCount, options.seed);
      const filePath = path.join(options.outputDir, fileName);
      const serialized = JSON.stringify(output);

      await writeFile(filePath, serialized, "utf-8");

      manifest.push({
        scale,
        bucketCount,
        seed: options.seed,
        fileName,
        filePath,
        fileSizeBytes: Buffer.byteLength(serialized, "utf-8"),
        sampleSize: output.sampleSize,
        storedRecordCount: output.records.length,
        generationMs: output.generationMs,
      });

      console.log(
        `[mockup] ${fileName} | sample=${output.sampleSize} | storedRecords=${output.records.length} | size=${manifest[manifest.length - 1].fileSizeBytes}B`,
      );
    }
  }

  // Save manifest for inspection and for verifying generated coverage.
  const manifestPath = path.join(options.outputDir, "mockup-manifest.json");

  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        outputDir: options.outputDir,
        options,
        totalFiles: manifest.length,
        totalSizeBytes: manifest.reduce((sum, item) => sum + item.fileSizeBytes, 0),
        elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
        manifest,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`[mockup] manifest saved: ${manifestPath}`);
}

void main();
