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

const LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월"];

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const actual = [120, 132, 145, 160, 152, 178, 190];
const target = [110, 120, 130, 150, 150, 165, 170];

export const areaLineCode = `"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const labels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월"];
const actual = [120, 132, 145, 160, 152, 178, 190];
const target = [110, 120, 130, 150, 150, 165, 170];

const data = {
  labels,
  datasets: [
    {
      label: "실제 트래픽",
      data: actual,
      borderColor: "#0ea5e9",
      backgroundColor: "rgba(14, 165, 233, 0.22)",
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 3,
    },
    {
      label: "목표 라인",
      data: target,
      borderColor: "#f59e0b",
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, title: { display: true, text: "방문 수" } },
  },
  plugins: {
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: { label: (ctx) => ctx.dataset.label + ": " + ctx.parsed.y + "명" },
    },
  },
};

export function CustomAreaLineChartPlot() {
  return <Line data={data} options={options} />;
}`;

const data: ChartData<"line", number[], string> = {
  labels: LABELS,
  datasets: [
    {
      label: "실제 트래픽",
      data: actual,
      borderColor: "#0ea5e9",
      backgroundColor: "rgba(14, 165, 233, 0.22)",
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 3,
    },
    {
      label: "목표 라인",
      data: target,
      borderColor: "#f59e0b",
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
  ],
};

const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 500,
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
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}명`,
      },
    },
  },
};

export function CustomAreaLineChartPlot() {
  return (
    <div className="h-[360px] w-full">
      <Line data={data} options={options} />
    </div>
  );
}
