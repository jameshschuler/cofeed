import { useState } from "react";
import type { ChartOptions } from "chart.js";
import { BarChart3, LineChart } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import { Button } from "../ui/button";
import {
  getLocalDayKey,
  getRecentDays,
  groupByLocalDay,
  sumFeedVolumesMl,
  toDisplayVolume,
} from "../../lib/activity-format";
import { getCssVar } from "../../lib/chart";
import type { FeedLogItem, VolumeUnit } from "../../types/route-types";

type Metric = "total" | "formula" | "breastMilk";
type ChartType = "line" | "bar";

const METRIC_LABELS: Record<Metric, string> = {
  total: "Total",
  formula: "Formula",
  breastMilk: "Breast milk",
};

export function WeeklyStats({
  feeds,
  displayVolumeUnit,
  isLoading = false,
  errorMessage = null,
}: {
  feeds: FeedLogItem[];
  displayVolumeUnit: VolumeUnit;
  isLoading?: boolean;
  errorMessage?: string | null;
}) {
  const [metric, setMetric] = useState<Metric>("total");
  const [chartType, setChartType] = useState<ChartType>("line");

  const feedsByDay = new Map(
    groupByLocalDay(feeds).map(({ dayKey, items }) => [
      dayKey,
      sumFeedVolumesMl(items),
    ]),
  );
  const dailyTotals = getRecentDays(7).map((date) => {
    const volumes = feedsByDay.get(getLocalDayKey(date));
    return {
      label: date.toLocaleDateString([], { weekday: "short" }),
      total: volumes?.totalMl ?? 0,
      formula: volumes?.formulaMl ?? 0,
      breastMilk: volumes?.breastMilkMl ?? 0,
    };
  });

  const primaryColor = getCssVar("--primary") || "oklch(0.48 0.12 155)";
  const mutedForegroundColor = getCssVar("--muted-foreground") || "oklch(0.556 0 0)";
  const borderColor = getCssVar("--border") || "oklch(0.922 0 0)";

  const data = {
    labels: dailyTotals.map((day) => day.label),
    datasets: [
      {
        label: METRIC_LABELS[metric],
        data: dailyTotals.map((day) => toDisplayVolume(day[metric], displayVolumeUnit)),
        borderColor: primaryColor,
        backgroundColor: chartType === "bar" ? `${primaryColor}` : primaryColor,
        pointBackgroundColor: primaryColor,
        pointRadius: 3,
        tension: 0.3,
        fill: false,
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
        callbacks: {
          label: (context) => `${context.parsed.y} ${displayVolumeUnit}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: mutedForegroundColor, font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: borderColor },
        ticks: { color: mutedForegroundColor, font: { size: 10 } },
      },
    },
  };

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-3 shadow-sm">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading feed stats...</p>
      ) : errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Feeds · last 7 days</p>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-lg bg-muted">
            {(Object.keys(METRIC_LABELS) as Metric[]).map((key) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={metric === key ? "default" : "ghost"}
                className="h-8 rounded-none px-2 text-xs"
                onClick={() => setMetric(key)}
              >
                {METRIC_LABELS[key]}
              </Button>
            ))}
          </div>
          <div className="mt-3 h-40">
            {chartType === "line" ? (
              <Line data={data} options={options as ChartOptions<"line">} />
            ) : (
              <Bar data={data} options={options as ChartOptions<"bar">} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
