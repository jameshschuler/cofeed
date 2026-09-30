import { Droplet, Milk } from "lucide-react";

export const ACTIVITY_STYLES = {
  feed: {
    label: "Feed",
    Icon: Milk,
    card: "border-l-4 border-l-primary",
    icon: "bg-primary/10 text-primary",
    chip: "border-primary/30 bg-primary/10 text-primary",
  },
  pumping: {
    label: "Pump",
    Icon: Droplet,
    card: "border-l-4 border-l-sky-500 bg-sky-50/60 dark:bg-sky-950/20",
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
} as const;
