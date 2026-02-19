import { describe, expect, it } from "vitest";

import { buildHistogramDataset } from "./build-histogram-dataset";

describe("buildHistogramDataset", () => {
  it("버킷 합계가 전체 데이터 건수와 일치한다", () => {
    const dataset = buildHistogramDataset({
      scale: 100000,
      bucketCount: 80,
      seed: 20260213,
    });

    const total = dataset.counts.reduce((sum, value) => sum + value, 0);

    expect(dataset.labels).toHaveLength(80);
    expect(dataset.counts).toHaveLength(80);
    expect(dataset.records).toHaveLength(25000);
    expect(total).toBe(100000);
    expect(dataset.sampleSize).toBe(100000);
    expect(dataset.isApproximate).toBe(false);
    expect(dataset.pipeline.mode).toBe("full-materialized");
    expect(dataset.pipeline.processedRecordCount).toBe(100000);
    expect(dataset.pipeline.retainedRecordCount).toBe(25000);
  });

  it("같은 입력이면 원시 레코드/분포 결과가 동일하다", () => {
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
    expect(a.records[0]).toEqual(b.records[0]);
    expect(a.records[199]).toEqual(b.records[199]);
    expect(a.min).toBe(b.min);
    expect(a.max).toBe(b.max);
    expect(a.average).toBe(b.average);
    expect(a.pipeline.sampleExpansionFactor).toBe(b.pipeline.sampleExpansionFactor);
    expect(a.pipeline.retentionRatio).toBe(b.pipeline.retentionRatio);
    expect(a.pipeline.checksum).toBe(b.pipeline.checksum);
  });

  it("시드가 바뀌면 결과가 달라진다", () => {
    const a = buildHistogramDataset({
      scale: 100000,
      bucketCount: 80,
      seed: 100,
    });
    const b = buildHistogramDataset({
      scale: 100000,
      bucketCount: 80,
      seed: 101,
    });

    expect(a.counts).not.toEqual(b.counts);
    expect(a.records[0].identity.recordId).not.toBe(b.records[0].identity.recordId);
  });

  it("원시 레코드 1건 구조가 충분히 복잡하다", () => {
    const dataset = buildHistogramDataset({
      scale: 100000,
      bucketCount: 40,
      seed: 7,
    });
    const first = dataset.records[0];

    expect(first.identity.recordId.startsWith("rec-")).toBe(true);
    expect(first.actor.user.tags.length).toBeGreaterThanOrEqual(3);
    expect(first.commerce.order.items.length).toBeGreaterThanOrEqual(2);
    expect(first.commerce.fulfillment.checkpoints).toHaveLength(3);
    expect(first.telemetry.embeddings).toHaveLength(12);
    expect(first.telemetry.checkpoints).toHaveLength(4);
    expect(first.quality.anomaly.signals).toHaveLength(3);
    expect(first.metric.value).toBeGreaterThanOrEqual(0);
    expect(first.metric.value).toBeLessThan(1000);
  });

  it("통계 값이 유효한 범위로 계산된다", () => {
    const dataset = buildHistogramDataset({
      scale: 100000,
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

  it("파이프라인 메트릭이 일관적이다", () => {
    const dataset = buildHistogramDataset({
      scale: 100000,
      bucketCount: 80,
      seed: 20260213,
    });

    expect(dataset.pipeline.processedRecordCount).toBe(100000);
    expect(dataset.pipeline.retainedRecordCount).toBeLessThanOrEqual(
      dataset.pipeline.processedRecordCount,
    );
    expect(dataset.pipeline.retentionRatio).toBeGreaterThan(0);
    expect(dataset.pipeline.retentionRatio).toBeLessThanOrEqual(1);
    expect(dataset.pipeline.sampleExpansionFactor).toBe(1);
    expect(dataset.pipeline.estimatedRecordBytes).toBeGreaterThan(0);
    expect(dataset.pipeline.estimatedScaleFootprintMb).toBeGreaterThan(0);
    expect(dataset.pipeline.timings.recordBuildMs).toBeGreaterThanOrEqual(0);
    expect(dataset.pipeline.timings.totalMs).toBeGreaterThanOrEqual(
      dataset.pipeline.timings.recordBuildMs,
    );
  });

  it("초대용량은 샘플 기반 스트림 처리로 합계를 유지한다", () => {
    const dataset = buildHistogramDataset({
      scale: 10000000,
      bucketCount: 80,
      seed: 20260213,
    });

    const total = dataset.counts.reduce((sum, value) => sum + value, 0);

    expect(dataset.isApproximate).toBe(true);
    expect(dataset.sampleSize).toBe(1000000);
    expect(dataset.pipeline.mode).toBe("sampled-stream");
    expect(dataset.pipeline.processedRecordCount).toBe(1000000);
    expect(dataset.pipeline.sampleExpansionFactor).toBe(10);
    expect(total).toBe(10000000);
  }, 20000);
});
