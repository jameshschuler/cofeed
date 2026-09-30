import { useState } from "react";
import type { ChartOptions } from "chart.js";
import { BarChart3, LineChart } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import { Button } from "../ui/button";
import { ChartSkeleton } from "./ChartSkeleton";
import {
  getLocalDayKey,
  getRecentDays,
  groupByLocalDay,
  toDisplayVolume,
  toMl,
} from "../../lib/activity-format";
import "../../lib/chart";
import type { PumpingLogItem, VolumeUnit } from "../../types/route-types";

export function PumpingStats({
  sessions,
  displayVolumeUnit,
  isLoading = false,
  errorMessage = null,
}: {
  sessions: PumpingLogItem[];
  displayVolumeUnit: VolumeUnit;
  isLoading?: boolean;
  errorMessage?: string | null;
}) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const days = getRecentDays(7);
  const totalsByDay = new Map(
    groupByLocalDay(sessions).map(({ dayKey, items }) => [
      dayKey,
      items.reduce((sum, session) => sum + toMl(session.volume, session.unit), 0),
    ]),
  );
  const totals = days.map((date) => totalsByDay.get(getLocalDayKey(date)) ?? 0);
  const primary = "oklch(0.48 0.12 155)";
  const data = {
    labels: days.map((date) => date.toLocaleDateString([], { weekday: "short" })),
    datasets: [
      {
        label: "Pumped",
        data: totals.map((value) => toDisplayVolume(value, displayVolumeUnit)),
        borderColor: primary,
        backgroundColor: primary,
        pointRadius: 3,
        tension: 0.3,
        borderRadius: chartType === "bar" ? 4 : undefined,
      },
    ],
  };
  const options: ChartOptions<"line" | "bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (context) => `${context.parsed.y} ${displayVolumeUnit}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { beginAtZero: true, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <section className="rounded-lg border bg-muted/30 px-3 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Pumps · last 7 days</p>
        {!isLoading && !errorMessage ? (
          <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-muted">
            <Button
              type="button"
              size="icon-sm"
              variant={chartType === "line" ? "default" : "ghost"}
              className="rounded-none"
              title="Line chart"
              aria-label="Line chart"
              onClick={() => setChartType("line")}
            >
              <LineChart className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={chartType === "bar" ? "default" : "ghost"}
              className="rounded-none"
              title="Bar chart"
              aria-label="Bar chart"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
      {isLoading ? (
        <ChartSkeleton label="Loading pumping stats…" chartHeightClass="h-32" />
      ) : errorMessage ? (
        <p className="mt-3 text-xs text-destructive">{errorMessage}</p>
      ) : (
        <>
          <div className="mt-3 h-32">
            {chartType === "line" ? (
              <Line data={data} options={options as ChartOptions<"line">} />
            ) : (
              <Bar data={data} options={options as ChartOptions<"bar">} />
            )}
          </div>
        </>
      )}
    </section>
  );
}
