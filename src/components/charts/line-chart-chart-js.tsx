"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

import type { HistogramDataset } from "@/types/chart-data";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

interface LineChartChartJsProps {
  dataset: HistogramDataset;
  labels?: string[];
  counts?: number[];
}

export function LineChartChartJs({ dataset, labels, counts }: LineChartChartJsProps) {
  const animationDuration = dataset.scale >= 100000000 ? 350 : 700;
  const chartLabels = labels ?? dataset.labels;
  const chartCounts = counts ?? dataset.counts;

  const data: ChartData<"line", number[], string> = {
    labels: chartLabels,
    datasets: [
      {
        label: "Records",
        data: chartCounts,
        borderColor: "#1d4ed8",
        backgroundColor: "rgba(37, 99, 235, 0.14)",
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
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
      <Line data={data} options={options} />
    </div>
  );
}
