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
  | "feeds"
  | "households"
  | "account";

export type PrivateScreen = "dashboard" | "feeds" | "households" | "account";

export function isPrivateScreen(screen: Screen): screen is PrivateScreen {
  return (
    screen === "dashboard" ||
    screen === "feeds" ||
    screen === "households" ||
    screen === "account"
  );
}
