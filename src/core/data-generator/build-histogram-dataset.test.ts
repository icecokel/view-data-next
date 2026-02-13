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
    expect(dataset.sampleSize).toBe(10000);
    expect(dataset.isApproximate).toBe(false);
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

  it("같은 시드여도 스케일이 다르면 분포 모양이 달라진다", () => {
    const small = buildHistogramDataset({
      scale: 10000,
      bucketCount: 80,
      seed: 20260213,
    });
    const large = buildHistogramDataset({
      scale: 100000000,
      bucketCount: 80,
      seed: 20260213,
    });

    const smallRatio = small.counts.map((value) => value / small.scale);
    const largeRatio = large.counts.map((value) => value / large.scale);
    const distance = smallRatio.reduce(
      (sum, value, index) => sum + Math.abs(value - largeRatio[index]),
      0,
    );

    expect(distance).toBeGreaterThan(0.1);
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

  it("버킷 분포가 충분히 들쭉날쭉하다", () => {
    const dataset = buildHistogramDataset({
      scale: 100000,
      bucketCount: 80,
      seed: 20260213,
    });
    const mean = dataset.counts.reduce((sum, value) => sum + value, 0) / dataset.counts.length;
    const variance =
      dataset.counts.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      dataset.counts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    expect(coefficientOfVariation).toBeGreaterThan(0.25);
  });

  it("초대용량은 샘플 기반 확장으로 합계를 유지한다", () => {
    const dataset = buildHistogramDataset({
      scale: 1000000000,
      bucketCount: 80,
      seed: 20260213,
    });

    const total = dataset.counts.reduce((sum, value) => sum + value, 0);

    expect(dataset.isApproximate).toBe(true);
    expect(dataset.sampleSize).toBe(1000000);
    expect(total).toBe(1000000000);
  });
});
