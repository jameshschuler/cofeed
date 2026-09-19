import { useEffect, useState } from "react";
import { getAccessToken } from "../lib/auth-token";
import { getPreferences, updatePreferences } from "../server/functions";
import type { VolumeUnit } from "../types/route-types";

type UseVolumePreferencesOptions = {
  userId: string | null;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
};

export function useVolumePreferences({
  userId,
  setErrorMessage,
  setSuccessMessage,
}: UseVolumePreferencesOptions) {
  const [displayVolumeUnit, setDisplayVolumeUnit] = useState<VolumeUnit | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setDisplayVolumeUnit(null);
      setLoadedUserId(null);
      return;
    }

    let isCurrentRequest = true;
    void getAccessToken()
      .then((accessToken) => getPreferences({ data: { accessToken } }))
      .then((data) => setDisplayVolumeUnit(data.displayVolumeUnit))
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load preferences.",
        );
      })
      .finally(() => {
        if (isCurrentRequest) setLoadedUserId(userId);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, setErrorMessage]);

  async function updateDisplayVolumeUnit(nextUnit: VolumeUnit) {
    if (!userId || nextUnit === displayVolumeUnit) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingPreferences(true);
    setDisplayVolumeUnit(nextUnit);

    try {
      await updatePreferences({
        data: {
          accessToken: await getAccessToken(),
          displayVolumeUnit: nextUnit,
        },
      });
      setSuccessMessage("Volume display preference saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save preference.",
      );
    } finally {
      setIsSavingPreferences(false);
    }
  }

  return {
    displayVolumeUnit: displayVolumeUnit ?? "oz",
    isPreferencesReady:
      !userId || (loadedUserId === userId && displayVolumeUnit !== null),
    isSavingPreferences,
    updateDisplayVolumeUnit,
  };
}
