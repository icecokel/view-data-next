"use client";

import { useMemo, useState } from "react";

import { buildHistogramDataset } from "@/features/data-generator/build-histogram-dataset";
import type { ChartLibrary, DataScale } from "@/types/chart-data";

import { BarChartChartJs } from "./bar-chart-chart-js";
import { BarChartECharts } from "./bar-chart-echarts";

const SCALE_OPTIONS: DataScale[] = [10000, 100000, 1000000];
const BUCKET_OPTIONS = [40, 80, 120, 160];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatMs(value: number) {
  return `${value.toFixed(2)}ms`;
}

export function ChartPlayground() {
  const [activeLibrary, setActiveLibrary] = useState<ChartLibrary>("echarts");
  const [scale, setScale] = useState<DataScale>(10000);
  const [bucketCount, setBucketCount] = useState<number>(80);
  const [seed, setSeed] = useState<number>(20260212);

  const dataset = useMemo(
    () => buildHistogramDataset({ scale, bucketCount, seed }),
    [scale, bucketCount, seed],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-100 p-6">
        <p className="text-sm font-semibold tracking-wide text-teal-700">
          DATA VIZ PRACTICE
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Bar Chart 비교 실습 (ECharts vs Chart.js)
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
            onClick={() => setActiveLibrary("echarts")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeLibrary === "echarts"
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ECharts 방식
          </button>
          <button
            type="button"
            onClick={() => setActiveLibrary("chartjs")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeLibrary === "chartjs"
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Chart.js 방식
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
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">데이터 건수</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatNumber(dataset.scale)}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">버킷 수</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{dataset.bucketCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">최소 / 최대</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {dataset.min} / {dataset.max}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">평균값</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{dataset.average}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">생성 시간</p>
          <p suppressHydrationWarning className="mt-1 text-lg font-bold text-slate-900">
            {formatMs(dataset.generationMs)}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">동일 데이터 Bar 차트</h2>
          <p suppressHydrationWarning className="text-xs text-slate-500">
            seed: {dataset.seed} / generated: {dataset.generatedAt}
          </p>
        </div>

        {activeLibrary === "echarts" ? (
          <BarChartECharts dataset={dataset} />
        ) : (
          <BarChartChartJs dataset={dataset} />
        )}
      </section>
    </div>
  );
}
