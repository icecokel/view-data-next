export type DataScale =
  | 10000
  | 100000
  | 1000000
  | 10000000
  | 100000000
  | 1000000000;

export interface HistogramDataset {
  scale: DataScale;
  bucketCount: number;
  labels: string[];
  counts: number[];
  min: number;
  max: number;
  average: number;
  seed: number;
  generatedAt: string;
  generationMs: number;
  sampleSize: number;
  isApproximate: boolean;
}

export type ChartLibrary = "echarts" | "chartjs";
