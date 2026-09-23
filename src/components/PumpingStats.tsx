import { useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { BarChart3, LineChart } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import { Button } from "./ui/button";
import type { PumpingLogItem, VolumeUnit } from "../types/route-types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
);

const ML_PER_OZ = 29.5735;

function toMl(value: number, unit: VolumeUnit) {
  return unit === "ml" ? value : value * ML_PER_OZ;
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });
  const totals = days.map((date) => {
    const key = dayKey(date);
    return sessions
      .filter((session) => dayKey(new Date(session.started_at)) === key)
      .reduce((sum, session) => sum + toMl(session.volume, session.unit), 0);
  });
  const format = (value: number) =>
    displayVolumeUnit === "ml"
      ? Math.round(value)
      : Number((value / ML_PER_OZ).toFixed(1));
  const primary = "oklch(0.48 0.12 155)";
  const data = {
    labels: days.map((date) => date.toLocaleDateString([], { weekday: "short" })),
    datasets: [
      {
        label: "Pumped",
        data: totals.map(format),
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
    <section className="rounded-lg border bg-muted/30 px-3 py-3">
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
        <p className="mt-3 text-xs text-muted-foreground">Loading pumping stats...</p>
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
