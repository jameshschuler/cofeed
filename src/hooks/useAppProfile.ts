import { useEffect, useState } from "react";
import { getAccessToken } from "../lib/auth-token";
import { getDeviceTimezone } from "../lib/timezone";
import { getProfile, updateProfileName } from "../server/functions";

type UseAppProfileOptions = {
  userId: string | null;
  enabled: boolean;
  includeJoinCode: boolean;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
};

export function useAppProfile({
  userId,
  enabled,
  includeJoinCode,
  setErrorMessage,
  setSuccessMessage,
}: UseAppProfileOptions) {
  const [householdJoinCode, setHouseholdJoinCode] = useState<string | null>(null);
  const [householdRole, setHouseholdRole] = useState<
    "owner" | "caregiver" | "viewer" | null
  >(null);
  const [profileName, setProfileName] = useState("");
  const [isSavingProfileName, setIsSavingProfileName] = useState(false);

  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }

    void getAccessToken()
      .then((accessToken) =>
        getProfile({ data: { accessToken, timezone: getDeviceTimezone() } }),
      )
      .then(({ joinCode, memberRole, profileName: nextProfileName }) => {
        setHouseholdJoinCode(includeJoinCode ? (joinCode ?? null) : null);
        setHouseholdRole(memberRole);
        setProfileName(nextProfileName);
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to prepare your profile.",
        );
      });
  }, [userId, enabled, includeJoinCode, setErrorMessage]);

  useEffect(() => {
    if (!userId) {
      setHouseholdJoinCode(null);
      setHouseholdRole(null);
      setProfileName("");
    }
  }, [userId]);

  async function saveProfileName(nextProfileName: string) {
    const trimmedName = nextProfileName.trim();
    if (!userId || !trimmedName || trimmedName === profileName) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingProfileName(true);

    try {
      const updatedProfileName = await updateProfileName({
        data: {
          accessToken: await getAccessToken(),
          profileName: trimmedName,
        },
      });
      setProfileName(updatedProfileName);
      setSuccessMessage("Profile name saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save profile name.",
      );
    } finally {
      setIsSavingProfileName(false);
    }
  }

  return {
    householdJoinCode,
    householdRole,
    profileName,
    isSavingProfileName,
    saveProfileName,
  };
}
