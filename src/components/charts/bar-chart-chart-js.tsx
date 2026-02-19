"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import type { HistogramDataset } from "@/types/chart-data";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface BarChartChartJsProps {
  dataset: HistogramDataset;
  labels?: string[];
  counts?: number[];
  yMin?: number;
  yMax?: number;
}

export function BarChartChartJs({
  dataset,
  labels,
  counts,
  yMin,
  yMax,
}: BarChartChartJsProps) {
  const animationDuration = dataset.scale >= 100000000 ? 350 : 700;
  const chartLabels = labels ?? dataset.labels;
  const chartCounts = counts ?? dataset.counts;

  const data: ChartData<"bar", number[], string> = {
    labels: chartLabels,
    datasets: [
      {
        label: "Records",
        data: chartCounts,
        backgroundColor: "#2563eb",
        borderRadius: 2,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animationDuration,
      easing: "easeOutCubic",
    },
    animations: {
      y: {
        from: 0,
      },
    },
    normalized: true,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 12,
          maxRotation: 40,
          minRotation: 40,
        },
      },
      y: {
        beginAtZero: true,
        min: yMin,
        max: yMax,
        title: {
          display: true,
          text: "Count",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
  };

  return (
    <div className="h-[460px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
