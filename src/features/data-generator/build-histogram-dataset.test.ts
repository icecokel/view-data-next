import { describe, expect, it } from "vitest";

import { buildHistogramDataset } from "./build-histogram-dataset";

describe("buildHistogramDataset", () => {
  it("버킷 합계가 전체 데이터 건수와 일치한다", () => {
    const dataset = buildHistogramDataset({
      scale: 10000,
      bucketCount: 80,
      seed: 20260213,
    });

    const total = dataset.counts.reduce((sum, value) => sum + value, 0);

    expect(dataset.labels).toHaveLength(80);
    expect(dataset.counts).toHaveLength(80);
    expect(total).toBe(10000);
  });

  it("같은 입력이면 분포 결과가 동일하다", () => {
    const a = buildHistogramDataset({
      scale: 100000,
      bucketCount: 120,
      seed: 42,
    });
    const b = buildHistogramDataset({
      scale: 100000,
      bucketCount: 120,
      seed: 42,
    });

    expect(a.labels).toEqual(b.labels);
    expect(a.counts).toEqual(b.counts);
    expect(a.min).toBe(b.min);
    expect(a.max).toBe(b.max);
    expect(a.average).toBe(b.average);
  });

  it("시드가 바뀌면 분포 결과가 달라진다", () => {
    const a = buildHistogramDataset({
      scale: 10000,
      bucketCount: 80,
      seed: 100,
    });
    const b = buildHistogramDataset({
      scale: 10000,
      bucketCount: 80,
      seed: 101,
    });

    expect(a.counts).not.toEqual(b.counts);
  });

  it("통계 값이 유효한 범위로 계산된다", () => {
    const dataset = buildHistogramDataset({
      scale: 10000,
      bucketCount: 40,
      seed: 7,
    });

    expect(dataset.min).toBeGreaterThanOrEqual(0);
    expect(dataset.max).toBeLessThan(1000);
    expect(dataset.average).toBeGreaterThanOrEqual(dataset.min);
    expect(dataset.average).toBeLessThanOrEqual(dataset.max);
    expect(Number.isNaN(Date.parse(dataset.generatedAt))).toBe(false);
    expect(dataset.generationMs).toBeGreaterThanOrEqual(0);
  });
});
