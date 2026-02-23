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
const values = [58, 71, 49, 82, 66, 93, 77];

export const basicBarCode = `"use client";

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
const values = [58, 71, 49, 82, 66, 93, 77];

const data = {
  labels,
  datasets: [
    {
      label: "일별 방문수",
      data: values,
      backgroundColor: "#2563eb",
      borderRadius: 6,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, title: { display: true, text: "방문 수" } },
  },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ctx.parsed.y + "명" } },
  },
};

export function BasicBarChartPlot() {
  return <Bar data={data} options={options} />;
}`;

const data: ChartData<"bar", number[], string> = {
  labels,
  datasets: [
    {
      label: "일별 방문수",
      data: values,
      backgroundColor: "#2563eb",
      borderRadius: 6,
    },
  ],
};

const options: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 400,
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "방문 수",
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.parsed.y}명`,
      },
    },
  },
};

export function BasicBarChartPlot() {
  return (
    <div className="h-[360px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
