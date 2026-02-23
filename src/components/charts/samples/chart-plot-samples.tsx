"use client";

import {
  BasicBarChartPlot,
  basicBarCode,
} from "@/components/charts/samples/basic-bar-chart-plot";
import {
  CustomAreaLineChartPlot,
  areaLineCode,
} from "@/components/charts/samples/custom-area-line-chart";
import {
  CustomStackedBarChartPlot,
  stackedBarCode,
} from "@/components/charts/samples/custom-stacked-bar-chart";

const sampleItems = [
  {
    plotType: "Bar",
    category: "기본 차트",
    title: "기본 Bar 차트",
    component: <BasicBarChartPlot />,
    description: "가장 단순한 형태의 수치 막대차트입니다.",
    code: basicBarCode,
  },
  {
    plotType: "Bar",
    category: "커스텀 차트 1",
    title: "Stacked Bar 차트",
    component: <CustomStackedBarChartPlot />,
    description: "두 개의 데이터셋을 누적으로 쌓아 보여주는 그룹형 커스텀 막대차트입니다.",
    code: stackedBarCode,
  },
  {
    plotType: "Line",
    category: "커스텀 차트 2",
    title: "Area Line 차트",
    description: "실제값은 영역 채움, 목표값은 점선으로 표시한 커스텀 라인 차트입니다.",
    component: <CustomAreaLineChartPlot />,
    code: areaLineCode,
  },
] as const;

export function ChartPlotSamples() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white/85 p-6 backdrop-blur">
        <p className="text-xs font-semibold tracking-wide text-teal-700">Chart Sample Route</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          플롯별 샘플 라우트
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          1) 플롯별 구분 / 2) 기본 차트 / 3) 커스텀 차트 2개를 한 화면에서 확인합니다.
        </p>
      </header>

      <section className="grid gap-6">
        {sampleItems.map((item) => (
          <article
            key={item.title}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold text-slate-500">{item.category}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                [{item.plotType}] {item.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
            <div className="p-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                {item.component}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">샘플 코드</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                <code>{item.code}</code>
              </pre>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
