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

const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const labels = WEEK_DAYS;
const baseCounts = [24, 32, 28, 35, 30, 18, 22];
const addCounts = [12, 18, 10, 24, 20, 15, 9];

export const stackedBarCode = `"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const labels = ["월", "화", "수", "목", "금", "토", "일"];
const baseCounts = [24, 32, 28, 35, 30, 18, 22];
const addCounts = [12, 18, 10, 24, 20, 15, 9];

const data = {
  labels,
  datasets: [
    {
      label: "신규 사용자",
      data: baseCounts,
      backgroundColor: "#3b82f6",
      stack: "인증유입",
      borderRadius: { topLeft: 8, topRight: 8 },
    },
    {
      label: "재방문 사용자",
      data: addCounts,
      backgroundColor: "#06b6d4",
      stack: "인증유입",
      borderRadius: { topLeft: 8, topRight: 8 },
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: { stacked: true, beginAtZero: true, title: { display: true, text: "사용자 수" } },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => ctx.dataset.label + ": " + ctx.parsed.y + "명",
        footer: (items) => {
          const total = items.reduce((acc, item) => acc + item.parsed.y, 0);
          return "총합: " + total + "명";
        },
      },
    },
  },
};

export function CustomStackedBarChartPlot() {
  return <Bar data={data} options={options} />;
}`;

const data: ChartData<"bar", number[], string> = {
  labels,
  datasets: [
    {
      label: "신규 사용자",
      data: baseCounts,
      backgroundColor: "#3b82f6",
      stack: "인증유입",
      borderRadius: { topLeft: 8, topRight: 8 },
    },
    {
      label: "재방문 사용자",
      data: addCounts,
      backgroundColor: "#06b6d4",
      stack: "인증유입",
      borderRadius: { topLeft: 8, topRight: 8 },
    },
  ],
};

const options: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: "사용자 수",
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}명`,
        footer: (items) => {
          const total = items.reduce((acc, item) => acc + (item.parsed.y as number), 0);
          return `총합: ${total}명`;
        },
      },
    },
  },
};

export function CustomStackedBarChartPlot() {
  return (
    <div className="h-[360px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
