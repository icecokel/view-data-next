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
}

export function BarChartChartJs({ dataset }: BarChartChartJsProps) {
  const animationDuration = dataset.scale >= 100000000 ? 350 : 700;

  const data: ChartData<"bar", number[], string> = {
    labels: dataset.labels,
    datasets: [
      {
        label: "Records",
        data: dataset.counts,
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
