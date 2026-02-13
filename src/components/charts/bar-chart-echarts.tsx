"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";

import type { HistogramDataset } from "@/types/chart-data";

const ReactECharts = dynamic(
  () => import("echarts-for-react").then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[460px] items-center justify-center text-sm text-slate-500">
        차트 로딩 중...
      </div>
    ),
  },
);

interface BarChartEChartsProps {
  dataset: HistogramDataset;
}

export function BarChartECharts({ dataset }: BarChartEChartsProps) {
  const animationDuration = dataset.scale >= 100000000 ? 350 : 700;

  const option: EChartsOption = {
    animation: true,
    animationDuration,
    animationDurationUpdate: Math.max(250, Math.floor(animationDuration * 0.7)),
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicInOut",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: 44,
      right: 20,
      top: 20,
      bottom: 56,
    },
    xAxis: {
      type: "category",
      data: dataset.labels,
      axisLabel: {
        interval: Math.max(0, Math.floor(dataset.bucketCount / 12)),
        rotate: 40,
        color: "#334155",
      },
      axisLine: {
        lineStyle: {
          color: "#cbd5e1",
        },
      },
    },
    yAxis: {
      type: "value",
      name: "Count",
      nameTextStyle: {
        color: "#334155",
      },
      splitLine: {
        lineStyle: {
          color: "#e2e8f0",
        },
      },
      axisLabel: {
        color: "#334155",
      },
    },
    series: [
      {
        name: "Records",
        type: "bar",
        data: dataset.counts,
        barMaxWidth: 24,
        itemStyle: {
          color: "#0f766e",
        },
        animationDelay: 0,
        large: true,
        largeThreshold: 400,
        progressive: 4000,
        progressiveThreshold: 8000,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      opts={{ renderer: "canvas" }}
      style={{ height: 460, width: "100%" }}
    />
  );
}
