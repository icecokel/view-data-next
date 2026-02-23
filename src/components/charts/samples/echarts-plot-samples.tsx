"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";

type PlotVariant = {
  label: "기본" | "커스텀";
  description: string;
  option: EChartsOption;
  code: string;
};

type PlotItem = {
  typeName: string;
  summary: string;
  basic: PlotVariant;
  custom: PlotVariant;
};

const ReactECharts = dynamic(
  () => import("echarts-for-react").then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center text-sm text-slate-500">
        ECharts 로딩 중...
      </div>
    ),
  },
);

function EChartsShell({ option }: { option: EChartsOption }) {
  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      opts={{ renderer: "canvas" }}
      style={{ height: 320, width: "100%" }}
    />
  );
}

const weekLabels = ["월", "화", "수", "목", "금", "토", "일"];
const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월"];

const plotSamples: PlotItem[] = [
  {
    typeName: "Bar",
    summary: "범주형 수치 비교에 사용하는 기본 막대 차트",
    basic: {
      label: "기본",
      description: "월별 방문 수를 기본 막대형으로 표시한 샘플",
      option: {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        grid: {
          left: 48,
          right: 16,
          top: 24,
          bottom: 34,
        },
        xAxis: {
          type: "category",
          data: weekLabels,
        },
        yAxis: {
          type: "value",
          name: "방문 수",
        },
        series: [
          {
            type: "bar",
            name: "방문 수",
            data: [58, 71, 49, 82, 66, 93, 77],
            itemStyle: { color: "#3b82f6" },
            barWidth: "45%",
          },
        ],
      },
      code: `const option = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: 48, right: 16, top: 24, bottom: 34 },
  xAxis: { type: "category", data: ["월", "화", "수", "목", "금", "토", "일"] },
  yAxis: { type: "value", name: "방문 수" },
  series: [
    {
      type: "bar",
      name: "방문 수",
      data: [58, 71, 49, 82, 66, 93, 77],
      itemStyle: { color: "#3b82f6" },
      barWidth: "45%",
    },
  ],
};`,
    },
    custom: {
      label: "커스텀",
      description: "데이터를 가로 막대 + 그라디언트 색상 + 상단 라벨로 커스텀한 샘플",
      option: {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        grid: {
          left: 60,
          right: 22,
          top: 24,
          bottom: 34,
        },
        xAxis: {
          type: "value",
          name: "방문 수",
        },
        yAxis: {
          type: "category",
          data: weekLabels,
          inverse: true,
          axisLine: { show: false },
        },
        series: [
          {
            type: "bar",
            data: [58, 71, 49, 82, 66, 93, 77],
            name: "방문 수",
            barMaxWidth: 18,
            label: {
              show: true,
              position: "right",
              color: "#0f172a",
              formatter: (params) => {
                return String(params.value as number) + "명";
              },
            },
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: "#60a5fa" },
                  { offset: 1, color: "#2563eb" },
                ],
              },
            },
          },
        ],
      },
      code: `const option = {
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  xAxis: { type: "value", name: "방문 수" },
  yAxis: { type: "category", data: ["월", "화", "수", "목", "금", "토", "일"], inverse: true },
  series: [
    {
      type: "bar",
      name: "방문 수",
      data: [58, 71, 49, 82, 66, 93, 77],
      label: { show: true, position: "right", formatter: (params) => params.value + "명" },
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: "#60a5fa" },
            { offset: 1, color: "#2563eb" },
          ],
        },
      },
    },
  ],
};`,
    },
  },
  {
    typeName: "Line",
    summary: "연속형 지표 변화를 보여주는 라인 차트",
    basic: {
      label: "기본",
      description: "월별 지표 추세를 기본 라인으로 표시",
      option: {
        tooltip: {
          trigger: "axis",
        },
        grid: {
          left: 48,
          right: 16,
          top: 24,
          bottom: 34,
        },
        xAxis: { type: "category", data: monthLabels },
        yAxis: {
          type: "value",
          name: "지표",
        },
        series: [
          {
            type: "line",
            name: "실적",
            data: [120, 132, 145, 160, 152, 178, 190],
            smooth: false,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 3 },
          },
        ],
      },
      code: `const option = {
  tooltip: { trigger: "axis" },
  xAxis: { type: "category", data: ["1월", "2월", "3월", "4월", "5월", "6월", "7월"] },
  yAxis: { type: "value", name: "지표" },
  series: [
    {
      type: "line",
      data: [120, 132, 145, 160, 152, 178, 190],
      smooth: false,
      symbol: "circle",
      symbolSize: 7,
      lineStyle: { width: 3 },
    },
  ],
};`,
    },
    custom: {
      label: "커스텀",
      description: "실제값과 목표값을 함께 보여주고 영역 채움으로 커스텀한 샘플",
      option: {
        tooltip: {
          trigger: "axis",
          formatter: (params) => {
            if (!Array.isArray(params)) {
              return "";
            }
            return params.map((item) => `${item.seriesName}: ${item.data} 건`).join("<br />");
          },
        },
        grid: {
          left: 48,
          right: 16,
          top: 24,
          bottom: 34,
        },
        xAxis: { type: "category", data: monthLabels },
        yAxis: {
          type: "value",
          name: "방문 수",
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        series: [
          {
            type: "line",
            name: "실제",
            data: [120, 132, 145, 160, 152, 178, 190],
            smooth: 0.3,
            showSymbol: false,
            lineStyle: { width: 3, color: "#0ea5e9" },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(14, 165, 233, 0.2)" },
                  { offset: 1, color: "rgba(14, 165, 233, 0)" },
                ],
              },
            },
          },
          {
            type: "line",
            name: "목표",
            data: [110, 120, 130, 150, 150, 165, 170],
            smooth: 0.3,
            symbol: "diamond",
            symbolSize: 6,
            lineStyle: { width: 2, type: "dashed", color: "#f59e0b" },
            itemStyle: { color: "#f59e0b" },
          },
        ],
      },
      code: `const option = {
  tooltip: {
    trigger: "axis",
    formatter: (params) => {
      if (!Array.isArray(params)) return "";
      return params.map((item) => item.seriesName + ": " + item.data + " 건").join("<br />");
    },
  },
  xAxis: { type: "category", data: ["1월", "2월", "3월", "4월", "5월", "6월", "7월"] },
  yAxis: { type: "value", name: "방문 수", splitLine: { lineStyle: { color: "#e2e8f0" } } },
  series: [
    {
      type: "line",
      name: "실제",
      data: [120, 132, 145, 160, 152, 178, 190],
      smooth: 0.3,
      showSymbol: false,
      lineStyle: { width: 3, color: "#0ea5e9" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(14, 165, 233, 0.2)" },
            { offset: 1, color: "rgba(14, 165, 233, 0)" },
          ],
        },
      },
    },
    {
      type: "line",
      name: "목표",
      data: [110, 120, 130, 150, 150, 165, 170],
      smooth: 0.3,
      symbol: "diamond",
      symbolSize: 6,
      lineStyle: { width: 2, type: "dashed", color: "#f59e0b" },
    },
  ],
};`,
    },
  },
  {
    typeName: "Pie",
    summary: "구성 비율을 보여주는 파이 차트",
    basic: {
      label: "기본",
      description: "채널별 구성 비율을 기본 파이형으로 표시",
      option: {
        tooltip: { trigger: "item" },
        legend: {
          orient: "horizontal",
          bottom: 0,
          textStyle: { color: "#334155" },
        },
        series: [
          {
            type: "pie",
            radius: "65%",
            data: [
              { value: 335, name: "검색" },
              { value: 310, name: "추천" },
              { value: 274, name: "광고" },
              { value: 235, name: "직접" },
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 16,
                shadowColor: "rgba(15, 23, 42, 0.4)",
              },
            },
          },
        ],
      },
      code: `const option = {
  tooltip: { trigger: "item" },
  legend: { orient: "horizontal", bottom: 0 },
  series: [
    {
      type: "pie",
      radius: "65%",
      data: [
        { value: 335, name: "검색" },
        { value: 310, name: "추천" },
        { value: 274, name: "광고" },
        { value: 235, name: "직접" },
      ],
    },
  ],
};`,
    },
    custom: {
      label: "커스텀",
      description: "도넛형+로제 타입+커스텀 라벨로 구성한 샘플",
      option: {
        tooltip: { trigger: "item", formatter: "{b}: {c}건 ({d}%)" },
        legend: {
          top: "5%",
          right: "0%",
          textStyle: { color: "#334155" },
        },
        series: [
          {
            type: "pie",
            name: "유입 채널",
            radius: ["38%", "68%"],
            center: ["50%", "58%"],
            roseType: "radius",
            data: [
              { value: 28, name: "검색", itemStyle: { color: "#2563eb" } },
              { value: 21, name: "추천", itemStyle: { color: "#0ea5e9" } },
              { value: 26, name: "광고", itemStyle: { color: "#38bdf8" } },
              { value: 25, name: "직접", itemStyle: { color: "#7dd3fc" } },
            ],
            label: { show: true, formatter: "{b}: {c}" },
            labelLine: { length: 12, length2: 12 },
            itemStyle: {
              borderRadius: 6,
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          },
        ],
      },
      code: `const option = {
  tooltip: { trigger: "item", formatter: "{b}: {c}건 ({d}%)" },
  legend: { top: "5%", right: "0%" },
  series: [
    {
      type: "pie",
      name: "유입 채널",
      radius: ["38%", "68%"],
      roseType: "radius",
      data: [
        { value: 28, name: "검색", itemStyle: { color: "#2563eb" } },
        { value: 21, name: "추천", itemStyle: { color: "#0ea5e9" } },
        { value: 26, name: "광고", itemStyle: { color: "#38bdf8" } },
        { value: 25, name: "직접", itemStyle: { color: "#7dd3fc" } },
      ],
      label: { show: true, formatter: "{b}: {c}" },
      itemStyle: { borderRadius: 6, borderColor: "#ffffff", borderWidth: 2 },
    },
  ],
};`,
    },
  },
  {
    typeName: "Scatter",
    summary: "두 축 상의 상관 관계를 보는 산점도",
    basic: {
      label: "기본",
      description: "월별 X/Y 값 쌍을 기본 산점도로 표시",
      option: {
        tooltip: {
          trigger: "item",
        },
        xAxis: {
          type: "value",
          name: "평균 지연(초)",
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        yAxis: {
          type: "value",
          name: "에러율(%)",
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        series: [
          {
            type: "scatter",
            symbolSize: 18,
            data: [
              [12, 34],
              [22, 39],
              [33, 42],
              [41, 58],
              [52, 62],
              [63, 68],
              [72, 79],
            ],
            itemStyle: { color: "#7c3aed" },
          },
        ],
      },
      code: `const option = {
  tooltip: { trigger: "item" },
  xAxis: { type: "value", name: "평균 지연(초)" },
  yAxis: { type: "value", name: "에러율(%)" },
  series: [
    {
      type: "scatter",
      symbolSize: 18,
      data: [[12, 34], [22, 39], [33, 42], [41, 58], [52, 62], [63, 68], [72, 79]],
      itemStyle: { color: "#7c3aed" },
    },
  ],
};`,
    },
    custom: {
      label: "커스텀",
      description: "버블 크기, 그라디언트 색상으로 커스텀한 산점도",
      option: {
        tooltip: {
          trigger: "item",
          formatter: (params) => {
            const value = params.value as number[];
            return "X: " + value[0] + "\\nY: " + value[1] + "\\n크기: " + value[2];
          },
        },
        xAxis: {
          type: "value",
          name: "처리량",
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        yAxis: {
          type: "value",
          name: "CPU",
          splitLine: { lineStyle: { color: "#e2e8f0" } },
        },
        visualMap: {
          show: false,
          min: 10,
          max: 35,
          dimension: 2,
          inRange: {
            color: ["#60a5fa", "#2563eb"],
          },
        },
        series: [
          {
            type: "scatter",
            data: [
              [12, 34, 10],
              [22, 39, 18],
              [33, 42, 28],
              [41, 58, 16],
              [52, 62, 22],
              [63, 68, 14],
              [72, 79, 32],
            ],
            symbolSize: (value) => {
              const point = value as number[];
              return point[2] * 0.9;
            },
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#93c5fd" },
                  { offset: 1, color: "#1d4ed8" },
                ],
              },
              shadowBlur: 8,
              shadowColor: "rgba(37, 99, 235, 0.4)",
            },
          },
        ],
      },
      code: `const option = {
  tooltip: {
    trigger: "item",
    formatter: (params) => {
      const value = params.value as number[];
      return "X: " + value[0] + "\\nY: " + value[1] + "\\n크기: " + value[2];
    },
  },
  xAxis: { type: "value", name: "처리량" },
  yAxis: { type: "value", name: "CPU" },
  visualMap: { show: false, min: 10, max: 35, dimension: 2, inRange: { color: ["#60a5fa", "#2563eb"] } },
  series: [
    {
      type: "scatter",
      data: [[12, 34, 10], [22, 39, 18], [33, 42, 28], [41, 58, 16], [52, 62, 22], [63, 68, 14], [72, 79, 32]],
      symbolSize: (value) => value[2] * 0.9,
      itemStyle: { color: "#1d4ed8" },
    },
  ],
};`,
    },
  },
  {
    typeName: "Radar",
    summary: "다차원 성능 항목을 비교하는 레이더",
    basic: {
      label: "기본",
      description: "5개 항목 강도를 기본 레이더 폼으로 표시",
      option: {
        radar: {
          indicator: [
            { name: "속도", max: 100 },
            { name: "안정성", max: 100 },
            { name: "확장성", max: 100 },
            { name: "가시성", max: 100 },
            { name: "운영성", max: 100 },
          ],
          center: ["50%", "55%"],
          radius: "60%",
        },
        tooltip: {
          trigger: "item",
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: [82, 74, 90, 67, 58],
                name: "프로덕트 A",
              },
            ],
            areaStyle: {
              color: "rgba(59, 130, 246, 0.15)",
            },
            lineStyle: {
              width: 2,
              color: "#2563eb",
            },
          },
        ],
      },
      code: `const option = {
  radar: {
    indicator: [
      { name: "속도", max: 100 },
      { name: "안정성", max: 100 },
      { name: "확장성", max: 100 },
      { name: "가시성", max: 100 },
      { name: "운영성", max: 100 },
    ],
    radius: "60%",
  },
  series: [
    {
      type: "radar",
      data: [{ value: [82, 74, 90, 67, 58], name: "프로덕트 A" }],
      areaStyle: { color: "rgba(59, 130, 246, 0.15)" },
      lineStyle: { width: 2, color: "#2563eb" },
    },
  ],
};`,
    },
    custom: {
      label: "커스텀",
      description: "현재/목표를 비교하고 분할 패턴을 넣은 레이더 샘플",
      option: {
        legend: {
          data: ["현재", "목표"],
          left: 16,
          top: 8,
        },
        radar: {
          indicator: [
            { name: "속도", max: 100 },
            { name: "안정성", max: 100 },
            { name: "확장성", max: 100 },
            { name: "가시성", max: 100 },
            { name: "운영성", max: 100 },
          ],
          shape: "circle",
          splitArea: {
            areaStyle: {
              color: ["rgba(148, 163, 184, 0.05)", "rgba(148, 163, 184, 0.08)"],
            },
          },
          splitLine: {
            lineStyle: {
                color: "#cbd5e1",
            },
          },
          center: ["50%", "58%"],
          radius: "62%",
        },
        series: [
          {
            type: "radar",
            name: "현재",
            data: [{ value: [78, 81, 73, 85, 70], name: "현재" }],
            areaStyle: {
              color: "rgba(14, 165, 233, 0.2)",
            },
            lineStyle: {
              width: 2,
              color: "#0284c7",
            },
          },
          {
            type: "radar",
            name: "목표",
            data: [{ value: [90, 85, 92, 90, 88], name: "목표" }],
            areaStyle: {
              color: "rgba(34, 197, 94, 0.15)",
            },
            lineStyle: {
              width: 2,
              color: "#16a34a",
            },
            symbol: "diamond",
            symbolSize: 8,
          },
        ],
      },
      code: `const option = {
  legend: { data: ["현재", "목표"], left: 16, top: 8 },
  radar: {
    indicator: [
      { name: "속도", max: 100 },
      { name: "안정성", max: 100 },
      { name: "확장성", max: 100 },
      { name: "가시성", max: 100 },
      { name: "운영성", max: 100 },
    ],
    shape: "circle",
    splitArea: { areaStyle: { color: ["rgba(148, 163, 184, 0.05)", "rgba(148, 163, 184, 0.08)"] } },
    radius: "62%",
  },
  series: [
    {
      type: "radar",
      name: "현재",
      data: [{ value: [78, 81, 73, 85, 70], name: "현재" }],
      areaStyle: { color: "rgba(14, 165, 233, 0.2)" },
      lineStyle: { width: 2, color: "#0284c7" },
    },
    {
      type: "radar",
      name: "목표",
      data: [{ value: [90, 85, 92, 90, 88], name: "목표" }],
      areaStyle: { color: "rgba(34, 197, 94, 0.15)" },
      lineStyle: { width: 2, color: "#16a34a" },
      symbol: "diamond",
      symbolSize: 8,
    },
  ],
};`,
    },
  },
  {
    typeName: "Gauge",
    summary: "단일 KPI 진행도에 적합한 계기형 차트",
    basic: {
      label: "기본",
      description: "가장 기본적인 게이지형 KPI 샘플",
      option: {
        series: [
          {
            type: "gauge",
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 5,
            itemStyle: { color: "#0ea5e9" },
            pointer: {
              itemStyle: {
                color: "#0f172a",
              },
            },
            axisLine: {
              lineStyle: {
                width: 14,
              },
            },
            data: [{ value: 72, name: "서비스 지수" }],
          },
        ],
      },
      code: `const option = {
  series: [
    {
      type: "gauge",
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 5,
      pointer: { itemStyle: { color: "#0f172a" } },
      axisLine: { lineStyle: { width: 14 } },
      data: [{ value: 72, name: "서비스 지수" }],
    },
  ],
};`,
    },
    custom: {
      label: "커스텀",
      description: "임계치 구간별 색상과 상세 텍스트를 적용한 커스텀 게이지",
      option: {
        series: [
          {
            type: "gauge",
            center: ["50%", "60%"],
            startAngle: 210,
            endAngle: -30,
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {
              lineStyle: {
                width: 16,
                color: [
                  [0.3, "#34d399"],
                  [0.6, "#facc15"],
                  [1, "#f43f5e"],
                ],
              },
            },
            axisTick: { distance: -20, length: 6 },
            splitLine: { distance: -20, length: 8 },
            pointer: {
              length: "60%",
              width: 6,
            },
            detail: {
              formatter: (value) => value + "점",
              offsetCenter: [0, "65%"],
              color: "#0f172a",
              fontSize: 18,
              fontWeight: "700",
            },
            data: [{ value: 67, name: "SLA 달성도" }],
          },
        ],
      },
      code: `const option = {
  series: [
    {
      type: "gauge",
      center: ["50%", "60%"],
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      splitNumber: 10,
      axisLine: {
        lineStyle: {
          width: 16,
          color: [[0.3, "#34d399"], [0.6, "#facc15"], [1, "#f43f5e"]],
        },
      },
      axisTick: { distance: -20, length: 6 },
      splitLine: { distance: -20, length: 8 },
      pointer: { length: "60%", width: 6 },
      detail: { formatter: (value) => value + "점", offsetCenter: [0, "65%"], color: "#0f172a", fontSize: 18, fontWeight: "700" },
      data: [{ value: 67, name: "SLA 달성도" }],
    },
  ],
};`,
    },
  },
];

export function EchartsPlotSamples() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold tracking-wide text-sky-700">ECharts.for-react Samples</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          차트 종류별 샘플 (ECharts)
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          chart.js와 분리해서, echarts-for-react 기준으로 차트를 타입별로 정리했습니다.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {plotSamples.map((entry) => {
          const variants = [entry.basic, entry.custom];

          return (
            <article
              key={entry.typeName}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h2 className="text-lg font-bold text-slate-900">
                [{entry.typeName}] {entry.summary}
              </h2>

              <div className="mt-4 grid gap-5">
                {variants.map((variant) => (
                  <div
                    key={`${entry.typeName}-${variant.label}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <p className="text-xs font-semibold text-slate-600">
                      {variant.label} 차트
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{variant.description}</p>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2">
                      <EChartsShell option={variant.option} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">샘플 코드</p>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-100">
                      <code>{variant.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
