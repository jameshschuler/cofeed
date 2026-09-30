import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Droplet, LayoutDashboard, MessageCircle, Milk, Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import type { PrivateScreen } from "../../types/route-types";

const SCREEN_TITLES: Record<PrivateScreen, string> = {
  dashboard: "Dashboard",
  chat: "Log",
  feeds: "Feeds",
  pumping: "Pumping",
  households: "Households",
  account: "Account",
};

const SCREEN_SUBTITLES: Record<PrivateScreen, string> = {
  dashboard: "Today at a glance.",
  chat: "Tell CoFeed what happened.",
  feeds: "Your feed history.",
  pumping: "Your pumping history.",
  households: "Manage your shared households.",
  account: "Manage your account and households.",
};

const PRIVATE_PATH_TO_SCREEN: Partial<Record<string, PrivateScreen>> = {
  "/dashboard": "dashboard",
  "/chat": "chat",
  "/feeds": "feeds",
  "/pumping": "pumping",
  "/account": "account",
};

const ACTIVE_TAB_CLASS =
  "h-14 sm:h-12 rounded-xl border border-primary/30 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground";

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
    <>
      {successMessage || errorMessage ? (
        <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
          {successMessage ? (
            <p className="w-full max-w-sm rounded-md border border-emerald-500/40 bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-700 shadow-lg dark:bg-emerald-950 dark:text-emerald-400">
              {successMessage}
            </p>
          ) : (
            <p className="w-full max-w-sm rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive shadow-lg">
              {errorMessage}
            </p>
          )}
        </div>
      ) : null}
      <Card className="flex min-h-0 w-full flex-1 flex-col rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="flex-row items-start justify-between px-0 py-3 sm:py-4">
          <div>
            <CardTitle className="text-xl">{SCREEN_TITLES[activeScreen]}</CardTitle>
            <CardDescription>{SCREEN_SUBTITLES[activeScreen]}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <Button
              type="button"
              size="icon"
              variant={activeScreen === "account" ? "default" : "ghost"}
              className="size-9"
              aria-label="Settings"
              title="Settings"
              aria-current={activeScreen === "account" ? "page" : undefined}
              onClick={() => onNavigate("account")}
            >
              <Settings className="size-5 sm:size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-0 pb-3 pt-0 sm:pb-4">
          {children}
        </CardContent>
        <CardFooter className="mt-auto border-t px-0 pt-2 pb-0">
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
              className={getTabClass("chat")}
              aria-current={activeScreen === "chat" ? "page" : undefined}
              aria-label="Log"
              onClick={() => onNavigate("chat")}
            >
              <MessageCircle className="size-6 sm:size-4" />
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
              className={getTabClass("pumping")}
              aria-current={activeScreen === "pumping" ? "page" : undefined}
              aria-label="Pumping"
              onClick={() => onNavigate("pumping")}
            >
              <Droplet className="size-6 sm:size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
