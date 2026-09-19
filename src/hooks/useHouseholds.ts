import { useEffect, useState } from "react";
import { getAccessToken } from "../lib/auth-token";
import {
  joinHousehold as joinHouseholdOnServer,
  leaveHousehold as leaveHouseholdOnServer,
  listHouseholds,
} from "../server/functions";

export type HouseholdMembership = {
  household_id: string;
  household_name: string;
  join_code: string;
  member_role: "owner" | "caregiver" | "viewer";
};

type UseHouseholdsOptions = {
  userId: string | null;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
};

export function useHouseholds({
  userId,
  setErrorMessage,
  setSuccessMessage,
}: UseHouseholdsOptions) {
  const [joinCode, setJoinCode] = useState("");
  const [households, setHouseholds] = useState<HouseholdMembership[]>([]);
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(false);
  const [isJoiningHousehold, setIsJoiningHousehold] = useState(false);
  const [leavingHouseholdId, setLeavingHouseholdId] = useState<string | null>(null);

  async function loadHouseholds() {
    if (!userId) {
      setHouseholds([]);
      return;
    }

    setIsLoadingHouseholds(true);
    try {
      setHouseholds(
        await listHouseholds({ data: { accessToken: await getAccessToken() } }),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load households.",
      );
    } finally {
      setIsLoadingHouseholds(false);
    }
  }

  useEffect(() => {
    void loadHouseholds();
  }, [userId]);

  async function joinHousehold() {
    if (!userId || joinCode.trim().length !== 6) {
      setErrorMessage("Enter a household code.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsJoiningHousehold(true);

    try {
      await joinHouseholdOnServer({
        data: {
          accessToken: await getAccessToken(),
          joinCode: joinCode.trim().toUpperCase(),
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to join household.",
      );
      setIsJoiningHousehold(false);
      return;
    }

    setIsJoiningHousehold(false);

    setJoinCode("");
    await loadHouseholds();
    setSuccessMessage("Joined household.");
  }

  async function leaveHousehold(householdId: string) {
    if (!globalThis.confirm("Leave this household?")) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLeavingHouseholdId(householdId);

    try {
      await leaveHouseholdOnServer({
        data: { accessToken: await getAccessToken(), householdId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to leave household.",
      );
      setLeavingHouseholdId(null);
      return;
    }

    setLeavingHouseholdId(null);

    await loadHouseholds();
    setSuccessMessage("Left household.");
  }

  return {
    joinCode,
    setJoinCode,
    households,
    isLoadingHouseholds,
    isJoiningHousehold,
    leavingHouseholdId,
    joinHousehold,
    leaveHousehold,
  };
}
