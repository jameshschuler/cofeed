import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { House, LayoutDashboard, Milk, User } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import type { PrivateScreen } from "../types/route-types";

const SCREEN_TITLES: Record<PrivateScreen, string> = {
  dashboard: "Dashboard",
  feeds: "Feeds",
  households: "Households",
  account: "Account",
};

const SCREEN_SUBTITLES: Record<PrivateScreen, string> = {
  dashboard: "Today at a glance.",
  feeds: "Your feed history.",
  households: "Manage your shared households.",
  account: "Manage your account settings.",
};

const PRIVATE_PATH_TO_SCREEN: Partial<Record<string, PrivateScreen>> = {
  "/dashboard": "dashboard",
  "/feeds": "feeds",
  "/households": "households",
  "/account": "account",
};

const ACTIVE_TAB_CLASS =
  "h-14 sm:h-12 rounded-xl border border-primary/30 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90";

const INACTIVE_TAB_CLASS =
  "h-14 sm:h-12 rounded-xl text-muted-foreground hover:bg-background hover:text-foreground";

export function PrivateLayout({
  screen,
  errorMessage,
  successMessage,
  headerAction,
  onNavigate,
  children,
}: {
  screen: PrivateScreen;
  errorMessage: string | null;
  successMessage: string | null;
  headerAction?: ReactNode;
  onNavigate: (screen: PrivateScreen) => void;
  children: ReactNode;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const activeScreen = PRIVATE_PATH_TO_SCREEN[pathname] ?? screen;

  function getTabClass(nextScreen: PrivateScreen) {
    return activeScreen === nextScreen ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS;
  }

  return (
    <Card className="flex min-h-0 w-full flex-1 flex-col rounded-none border-0 bg-transparent shadow-none">
      <CardHeader className="flex-row items-start justify-between px-0 py-3 sm:py-4">
        <div>
          <CardTitle className="text-xl">{SCREEN_TITLES[activeScreen]}</CardTitle>
          <CardDescription>{SCREEN_SUBTITLES[activeScreen]}</CardDescription>
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-0 pb-3 pt-0 sm:pb-4">
        {children}
        {successMessage ? (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto border-t px-0 py-2">
        <div className="grid w-full grid-cols-4 gap-2 rounded-2xl bg-muted p-1">
          <Button
            type="button"
            variant="ghost"
            className={getTabClass("dashboard")}
            aria-current={activeScreen === "dashboard" ? "page" : undefined}
            aria-label="Dashboard"
            onClick={() => onNavigate("dashboard")}
          >
            <LayoutDashboard className="size-6 sm:size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={getTabClass("feeds")}
            aria-current={activeScreen === "feeds" ? "page" : undefined}
            aria-label="Feeds"
            onClick={() => onNavigate("feeds")}
          >
            <Milk className="size-6 sm:size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={getTabClass("households")}
            aria-current={activeScreen === "households" ? "page" : undefined}
            aria-label="Households"
            onClick={() => onNavigate("households")}
          >
            <House className="size-6 sm:size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={getTabClass("account")}
            aria-current={activeScreen === "account" ? "page" : undefined}
            aria-label="Account"
            onClick={() => onNavigate("account")}
          >
            <User className="size-6 sm:size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
