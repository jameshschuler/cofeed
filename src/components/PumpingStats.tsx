import {
  CategoryScale,
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { PumpingLogItem, VolumeUnit } from "../types/route-types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

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
}: {
  sessions: PumpingLogItem[];
  displayVolumeUnit: VolumeUnit;
}) {
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
      },
    ],
  };
  const options: ChartOptions<"line"> = {
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
      <p className="text-xs text-muted-foreground">Pumping history · last 7 days</p>
      <div className="mt-3 h-32">
        <Line data={data} options={options} />
      </div>
    </section>
  );
}
