"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { buildHistogramDataset } from "@/core/data-generator/build-histogram-dataset";
import type {
  ChartKind,
  ChartLibrary,
  DataScale,
  HistogramDataset,
} from "@/types/chart-data";

import { BarChartChartJs } from "./bar-chart-chart-js";
import { BarChartECharts } from "./bar-chart-echarts";
import { LineChartChartJs } from "./line-chart-chart-js";
import { LineChartECharts } from "./line-chart-echarts";

// Scales used in the playground selector. These values map 1:1 with DataScale type.
const SCALE_OPTIONS: DataScale[] = [
  10000,
  50000,
  100000,
  500000,
  1000000,
  2000000,
  5000000,
  10000000,
];
const BUCKET_OPTIONS = [40, 80, 120, 160];
const TAB_SWITCH_DELAY_MS = 260;
const ZOOM_STEP_PERCENT = 20;
const MIN_ZOOM_PERCENT = 20;

// Locale-friendly integer display helper.
function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

// Consistent millisecond text formatting for metrics cards.
function formatMs(value: number) {
  return `${value.toFixed(2)}ms`;
}

// Displays memory estimate values in MB.
function formatMb(value: number) {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value)}MB`;
}

// File naming contract shared with scripts/generate-mockup-data.ts.
function createMockupFileName(scale: DataScale, bucketCount: number, seed: number) {
  return `mockup-scale-${scale}-bucket-${bucketCount}-seed-${seed}.json`;
}

export function ChartPlayground() {
  const [activeLibrary, setActiveLibrary] = useState<ChartLibrary>("echarts");
  const [pendingLibrary, setPendingLibrary] = useState<ChartLibrary | null>(null);
  const [isSwitchingLibrary, setIsSwitchingLibrary] = useState<boolean>(false);
  const [chartKind, setChartKind] = useState<ChartKind>("bar");
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [zoomOffsetPercent, setZoomOffsetPercent] = useState<number>(0);
  const [scale, setScale] = useState<DataScale>(100000);
  const [bucketCount, setBucketCount] = useState<number>(80);
  const [seed, setSeed] = useState<number>(20260212);
  const [isRawDataVisible, setIsRawDataVisible] = useState<boolean>(false);
  const [prebuiltDatasets, setPrebuiltDatasets] = useState<Map<
    DataScale,
    HistogramDataset
  > | null>(null);
  const [mockupHitCount, setMockupHitCount] = useState<number>(0);
  const [isPreparingDatasets, setIsPreparingDatasets] = useState<boolean>(true);
  const switchTimeoutRef = useRef<number | null>(null);
  const selectedLibrary = pendingLibrary ?? activeLibrary;

  useEffect(
    // Clear pending tab-switch timeout when unmounting.
    () => () => {
      if (switchTimeoutRef.current !== null) {
        window.clearTimeout(switchTimeoutRef.current);
      }
    },
    [],
  );

  function handleLibraryTabClick(nextLibrary: ChartLibrary) {
    // Ignore click when target tab is already selected.
    if (nextLibrary === selectedLibrary) {
      return;
    }

    if (switchTimeoutRef.current !== null) {
      window.clearTimeout(switchTimeoutRef.current);
    }

    setPendingLibrary(nextLibrary);
    setIsSwitchingLibrary(true);

    // Small delay adds visible "switching" feedback for chart engine swap.
    switchTimeoutRef.current = window.setTimeout(() => {
      setActiveLibrary(nextLibrary);
      setPendingLibrary(null);
      setIsSwitchingLibrary(false);
      switchTimeoutRef.current = null;
    }, TAB_SWITCH_DELAY_MS);
  }

  useEffect(() => {
    let isCancelled = false;

    async function prepareDatasets() {
      // Rebuild cache whenever seed/bucket changes.
      setIsPreparingDatasets(true);
      setPrebuiltDatasets(null);

      const results = await Promise.all(
        SCALE_OPTIONS.map(async (option) => {
          const mockupFileName = createMockupFileName(option, bucketCount, seed);

          try {
            // Prefer static mockup files to avoid heavy runtime generation cost.
            const response = await fetch(`/mockup-data/${mockupFileName}`, {
              cache: "force-cache",
            });

            if (response.ok) {
              const parsed = (await response.json()) as HistogramDataset;
              return {
                option,
                dataset: parsed,
                source: "mockup-file" as const,
              };
            }
          } catch {
            // Fall through to runtime generation.
          }

          // Fallback path when matching mockup file does not exist.
          return {
            option,
            dataset: buildHistogramDataset({
              scale: option,
              bucketCount,
              seed,
            }),
            source: "runtime-generated" as const,
          };
        }),
      );

      if (isCancelled) {
        return;
      }

      // Useful for quickly verifying how many scales came from static files.
      setMockupHitCount(
        results.filter((item) => item.source === "mockup-file").length,
      );
      setPrebuiltDatasets(
        new Map(results.map((item) => [item.option, item.dataset] as const)),
      );
      setIsPreparingDatasets(false);
    }

    void prepareDatasets();

    return () => {
      isCancelled = true;
    };
  }, [bucketCount, seed]);

  // Selected dataset for the currently active scale button.
  const selectedDataset = prebuiltDatasets?.get(scale) ?? null;
  // Aggregated prebuild stats shown in the UI for observability.
  const prebuiltTotalMs = prebuiltDatasets
    ? Array.from(prebuiltDatasets.values()).reduce(
        (sum, item) => sum + item.generationMs,
        0,
      )
    : 0;
  const prebuiltTotalSampleSize = prebuiltDatasets
    ? Array.from(prebuiltDatasets.values()).reduce(
        (sum, item) => sum + item.sampleSize,
        0,
      )
    : 0;
  // Chart zoom only affects visible bucket window, not source dataset itself.
  const visibleBucketCount = selectedDataset
    ? Math.max(8, Math.round(selectedDataset.bucketCount * (zoomPercent / 100)))
    : 8;
  const maxStartIndex = selectedDataset
    ? Math.max(0, selectedDataset.bucketCount - visibleBucketCount)
    : 0;
  const visibleStartIndex = Math.round((zoomOffsetPercent / 100) * maxStartIndex);
  const visibleEndIndex = visibleStartIndex + visibleBucketCount;
  const visibleLabels = useMemo(
    () =>
      selectedDataset
        ? selectedDataset.labels.slice(visibleStartIndex, visibleEndIndex)
        : [],
    [selectedDataset, visibleStartIndex, visibleEndIndex],
  );
  const visibleCounts = useMemo(
    () =>
      selectedDataset
        ? selectedDataset.counts.slice(visibleStartIndex, visibleEndIndex)
        : [],
    [selectedDataset, visibleStartIndex, visibleEndIndex],
  );
  const firstRecord = selectedDataset?.records[0] ?? null;
  const canZoomIn = Boolean(selectedDataset) && zoomPercent > MIN_ZOOM_PERCENT;
  const canZoomOut = Boolean(selectedDataset) && zoomPercent < 100;

  function handleZoomIn() {
    setZoomPercent((prev) => Math.max(MIN_ZOOM_PERCENT, prev - ZOOM_STEP_PERCENT));
  }

  function handleZoomOut() {
    setZoomPercent((prev) => Math.min(100, prev + ZOOM_STEP_PERCENT));
  }

  function handleZoomReset() {
    setZoomPercent(100);
    setZoomOffsetPercent(0);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-100 p-6">
        <p className="text-sm font-semibold tracking-wide text-teal-700">
          DATA VIZ PRACTICE
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Chart 비교 실습 (ECharts vs Chart.js)
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          같은 목업 데이터와 같은 컨트롤을 사용하고, 렌더링 엔진만 탭으로
          전환해 성능과 체감을 비교합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLibraryTabClick("echarts")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedLibrary === "echarts"
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ECharts 방식
          </button>
          <button
            type="button"
            onClick={() => handleLibraryTabClick("chartjs")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedLibrary === "chartjs"
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Chart.js 방식
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setChartKind("bar")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              chartKind === "bar"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Bar 차트
          </button>
          <button
            type="button"
            onClick={() => setChartKind("line")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              chartKind === "line"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Line 차트
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">데이터 크기</span>
            {SCALE_OPTIONS.map((option) => {
              const isActive = option === scale;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScale(option)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formatNumber(option)}건
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="bucket-count" className="text-sm font-medium text-slate-700">
              버킷 수
            </label>
            <select
              id="bucket-count"
              value={bucketCount}
              onChange={(event) => setBucketCount(Number(event.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
            >
              {BUCKET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSeed((prev) => prev + 1)}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              데이터 다시 생성
            </button>
            <button
              type="button"
              onClick={() => setIsRawDataVisible((prev) => !prev)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isRawDataVisible
                  ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                  : "bg-indigo-700 text-white hover:bg-indigo-600"
              }`}
            >
              {isRawDataVisible ? "원시데이터 숨기기" : "원시데이터 보기"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">줌</span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={!canZoomIn}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              줌인
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={!canZoomOut}
              className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              줌아웃
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              disabled={zoomPercent === 100 && zoomOffsetPercent === 0}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              초기화
            </button>
            <p className="text-xs text-slate-600">
              {selectedDataset
                ? `배율 ${zoomPercent}% / 표시 구간 ${visibleStartIndex + 1}-${Math.min(
                    selectedDataset.bucketCount,
                    visibleEndIndex,
                  )} / ${selectedDataset.bucketCount}`
                : "데이터 준비 중..."}
            </p>
          </div>

          {zoomPercent < 100 ? (
            <div className="mt-2 flex items-center gap-3">
              <label htmlFor="zoom-offset" className="text-xs text-slate-600">
                구간 이동
              </label>
              <input
                id="zoom-offset"
                type="range"
                min={0}
                max={100}
                step={1}
                value={zoomOffsetPercent}
                onChange={(event) => setZoomOffsetPercent(Number(event.target.value))}
                className="w-full"
              />
            </div>
          ) : null}
          <p className="mt-2 text-xs text-slate-600">
            프리빌드: {SCALE_OPTIONS.length}개 스케일 / 처리{" "}
            {formatNumber(prebuiltTotalSampleSize)}건 / 누적{" "}
            {formatMs(prebuiltTotalMs)} / 파일 사용 {mockupHitCount}개 /{" "}
            {isPreparingDatasets ? "준비 중" : "준비 완료"}
          </p>
        </div>
      </section>

      {selectedDataset ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-8">
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">데이터 건수</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNumber(selectedDataset.scale)}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">버킷 수</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {selectedDataset.bucketCount}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">최소 / 최대</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {selectedDataset.min} / {selectedDataset.max}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">평균값</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {selectedDataset.average}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">생성 시간</p>
              <p suppressHydrationWarning className="mt-1 text-lg font-bold text-slate-900">
                {formatMs(selectedDataset.generationMs)}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">실제 처리 레코드</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNumber(selectedDataset.pipeline.processedRecordCount)}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">메모리 보존 레코드</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNumber(selectedDataset.pipeline.retainedRecordCount)}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">처리 모드</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {selectedDataset.pipeline.mode}
              </p>
            </article>
          </section>

          {isRawDataVisible ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  원시 레코드 1건 샘플
                </h2>
                <p className="text-xs text-slate-500">
                  records[0] 구조 미리보기
                </p>
              </div>
              {firstRecord ? (
                <pre className="max-h-[360px] overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                  {JSON.stringify(firstRecord, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-slate-500">표시할 레코드 데이터가 없습니다.</p>
              )}
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                동일 데이터 {chartKind === "bar" ? "Bar" : "Line"} 차트
              </h2>
              <p suppressHydrationWarning className="text-xs text-slate-500">
                seed: {selectedDataset.seed} / generated: {selectedDataset.generatedAt}
              </p>
            </div>
            {selectedDataset.isApproximate ? (
              <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                샘플 기반 추정: {formatNumber(selectedDataset.sampleSize)}건 샘플을
                {` ${formatNumber(selectedDataset.scale)}건`}으로 비율 확장했습니다.
              </p>
            ) : null}
            <p className="mb-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
              파이프라인: 처리 {formatNumber(selectedDataset.pipeline.processedRecordCount)}
              건 / 보존 {formatNumber(selectedDataset.pipeline.retainedRecordCount)}건 /
              확장 배율 x{selectedDataset.pipeline.sampleExpansionFactor.toFixed(2)} /
              전체 스케일 추정 메모리{" "}
              {formatMb(selectedDataset.pipeline.estimatedScaleFootprintMb)}
            </p>

            <div className="relative min-h-[460px]">
              {isSwitchingLibrary ? (
                <div className="flex h-[460px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
                  <p className="text-sm font-medium text-slate-600">차트 전환 중...</p>
                </div>
              ) : activeLibrary === "echarts" ? (
                chartKind === "bar" ? (
                  <BarChartECharts
                    dataset={selectedDataset}
                    labels={visibleLabels}
                    counts={visibleCounts}
                  />
                ) : (
                  <LineChartECharts
                    dataset={selectedDataset}
                    labels={visibleLabels}
                    counts={visibleCounts}
                  />
                )
              ) : chartKind === "bar" ? (
                <BarChartChartJs
                  dataset={selectedDataset}
                  labels={visibleLabels}
                  counts={visibleCounts}
                />
              ) : (
                <LineChartChartJs
                  dataset={selectedDataset}
                  labels={visibleLabels}
                  counts={visibleCounts}
                />
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <p className="text-sm font-medium text-slate-700">
              목업 데이터 준비 중입니다...
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
