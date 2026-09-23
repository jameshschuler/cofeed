import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppProfile } from "./useAppProfile";
import { useClipboard } from "./useClipboard";
import { useFeeds } from "./useFeeds";
import { useHouseholds } from "./useHouseholds";
import { useRouteAuth } from "./useRouteAuth";
import { useTheme } from "./useTheme";
import { useVolumePreferences } from "./useVolumePreferences";
import type { Screen } from "../types/route-types";

const SCREEN_TO_PATH: Record<Screen, string> = {
  home: "/",
  login: "/login",
  signup: "/signup",
  "reset-password": "/reset-password",
  dashboard: "/dashboard",
  feeds: "/feeds",
  households: "/households",
  account: "/account",
};

export function useRouteScreen(screen: Screen) {
  const navigate = useNavigate();
  const navigateTo = useCallback(
    (nextScreen: Screen, options?: { replace?: boolean }) => {
      void navigate({
        to: SCREEN_TO_PATH[nextScreen],
        replace: options?.replace ?? false,
      });
    },
    [navigate],
  );

  const auth = useRouteAuth({ screen, navigateTo });
  const userId = auth.session?.user?.id ?? null;
  const theme = useTheme();
  const preferences = useVolumePreferences({
    userId,
    setErrorMessage: auth.setErrorMessage,
    setSuccessMessage: auth.setSuccessMessage,
  });
  const profile = useAppProfile({
    userId,
    enabled: screen === "dashboard" || screen === "households" || screen === "account",
    includeJoinCode: screen === "households",
    setErrorMessage: auth.setErrorMessage,
    setSuccessMessage: auth.setSuccessMessage,
  });
  const households = useHouseholds({
    userId,
    setErrorMessage: auth.setErrorMessage,
    setSuccessMessage: auth.setSuccessMessage,
  });
  const clipboard = useClipboard({
    setErrorMessage: auth.setErrorMessage,
    setSuccessMessage: auth.setSuccessMessage,
  });
  const feeds = useFeeds({
    screen,
    session: auth.session,
    preferredDisplayVolumeUnit: preferences.displayVolumeUnit,
    setErrorMessage: auth.setErrorMessage,
    setSuccessMessage: auth.setSuccessMessage,
  });

  return {
    ...auth,
    ...feeds,
    ...households,
    displayVolumeUnit: preferences.displayVolumeUnit,
    isPreferencesReady: preferences.isPreferencesReady,
    isSavingPreferences: preferences.isSavingPreferences,
    handleDisplayVolumeUnitChange: preferences.updateDisplayVolumeUnit,
    householdJoinCode: profile.householdJoinCode,
    householdRole: profile.householdRole,
    profileName: profile.profileName,
    isSavingProfileName: profile.isSavingProfileName,
    handleSaveProfileName: profile.saveProfileName,
    isDarkMode: theme.isDarkMode,
    handleToggleDarkMode: theme.toggleTheme,
    handleCopyHouseholdCode: () => {
      if (profile.householdJoinCode) {
        clipboard.copy(profile.householdJoinCode, "Household code copied.");
      }
    },
  };
}
