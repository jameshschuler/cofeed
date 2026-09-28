export type VolumeUnit = "oz" | "ml";

export type ActivitySource = "cofeed" | "nara";

export type FeedLogItem = {
  id: string;
  started_at: string;
  created_at: string;
  formula_portion_volume: number | null;
  formula_portion_unit: VolumeUnit | null;
  breast_milk_portion_volume: number | null;
  breast_milk_portion_unit: VolumeUnit | null;
  source: ActivitySource;
  household_name: string;
  logger_name: string | null;
};

export type FeedFilter = "today" | "yesterday" | "date";

export type TextLogEntry = {
  kind: "feed" | "pumping";
  id: string;
  startedAt: string;
  summary: string;
};

export type TextLogResult = {
  created: TextLogEntry[];
  notUnderstood: string | null;
};

export type PumpingLogItem = {
  id: string;
  started_at: string;
  created_at: string;
  volume: number;
  unit: VolumeUnit;
  source: ActivitySource;
  household_name: string;
  logger_name: string | null;
};

export type Screen =
  | "home"
  | "login"
  | "signup"
  | "reset-password"
  | "dashboard"
  | "chat"
  | "feeds"
  | "pumping"
  | "households"
  | "account";

export type PrivateScreen =
  "dashboard" | "chat" | "feeds" | "pumping" | "households" | "account";

export function isPrivateScreen(screen: Screen): screen is PrivateScreen {
  return (
    screen === "dashboard" ||
    screen === "chat" ||
    screen === "feeds" ||
    screen === "pumping" ||
    screen === "households" ||
    screen === "account"
  );
}
