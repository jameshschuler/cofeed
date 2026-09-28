import { useEffect, useState } from "react";
import { clearLastBabyId } from "../lib/activity-cache";
import { getAccessToken } from "../lib/auth-token";
import { pickBabyProfileBabyId } from "../lib/preferred-household";
import { getDeviceTimezone } from "../lib/timezone";
import { getBabyProfile, updateBabyProfile } from "../server/babies";
import {
  joinHousehold as joinHouseholdOnServer,
  leaveHousehold as leaveHouseholdOnServer,
  listHouseholdMembers,
  listHouseholds,
  removeHouseholdMember,
  setPreferredHousehold as setPreferredHouseholdOnServer,
} from "../server/households";
import { getProfile } from "../server/profile";

export type HouseholdMembership = {
  household_id: string;
  household_name: string;
  join_code: string;
  member_role: "owner" | "caregiver" | "viewer";
  is_preferred: boolean;
  baby_id: string | null;
};

export type PreferredHouseholdPrompt = {
  householdId: string;
  householdName: string;
};

export type HouseholdMember = {
  user_id: string;
  member_role: "owner" | "caregiver" | "viewer";
  email: string | null;
  profile_name: string | null;
};

export type BabyProfile = {
  id: string;
  name: string;
  dateOfBirth: string;
  householdId: string;
  memberRole: "owner" | "caregiver" | "viewer";
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
  const [membersByHousehold, setMembersByHousehold] = useState<
    Record<string, HouseholdMember[]>
  >({});
  const [removingMemberKey, setRemovingMemberKey] = useState<string | null>(null);
  const [babyProfile, setBabyProfile] = useState<BabyProfile | null>(null);
  const [isSavingBabyProfile, setIsSavingBabyProfile] = useState(false);
  const [preferredPrompt, setPreferredPrompt] =
    useState<PreferredHouseholdPrompt | null>(null);
  const [settingPreferredId, setSettingPreferredId] = useState<string | null>(null);

  async function loadHouseholds() {
    if (!userId) {
      setHouseholds([]);
      return;
    }

    setIsLoadingHouseholds(true);
    try {
      const accessToken = await getAccessToken();
      const nextHouseholds = await listHouseholds({ data: { accessToken } });
      setHouseholds(nextHouseholds);
      const profile = await getProfile({
        data: { accessToken, timezone: getDeviceTimezone() },
      });
      const babyId = pickBabyProfileBabyId(nextHouseholds, profile.babyId);
      if (babyId) {
        const profile = await getBabyProfile({
          data: { accessToken, babyId },
        });
        setBabyProfile(profile);
      }
      const ownedHouseholds = Array.from(
        new Map(
          nextHouseholds
            .filter((household) => household.member_role === "owner")
            .map((household) => [household.household_id, household]),
        ).values(),
      );
      const memberEntries = await Promise.all(
        ownedHouseholds.map(
          async (household) =>
            [
              household.household_id,
              await listHouseholdMembers({
                data: { accessToken, householdId: household.household_id },
              }),
            ] as const,
        ),
      );
      setMembersByHousehold(Object.fromEntries(memberEntries));
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

    let joined: Awaited<ReturnType<typeof joinHouseholdOnServer>>;
    try {
      joined = await joinHouseholdOnServer({
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
    if (!joined.isPreferred) {
      setPreferredPrompt({
        householdId: joined.householdId,
        householdName: joined.householdName,
      });
    }
  }

  async function setPreferredHousehold(householdId: string) {
    if (!userId) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setSettingPreferredId(householdId);
    try {
      await setPreferredHouseholdOnServer({
        data: { accessToken: await getAccessToken(), householdId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to change preferred household.",
      );
      return;
    } finally {
      setSettingPreferredId(null);
      setPreferredPrompt(null);
    }

    clearLastBabyId(userId);
    await loadHouseholds();
    setSuccessMessage("Preferred household updated.");
  }

  async function leaveHousehold(householdId: string) {
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

    if (userId) {
      clearLastBabyId(userId);
    }
    await loadHouseholds();
    setSuccessMessage("Left household.");
  }

  async function removeMember(householdId: string, memberUserId: string) {
    const key = `${householdId}:${memberUserId}`;
    setErrorMessage(null);
    setSuccessMessage(null);
    setRemovingMemberKey(key);
    try {
      await removeHouseholdMember({
        data: { accessToken: await getAccessToken(), householdId, memberUserId },
      });
      await loadHouseholds();
      setSuccessMessage("Household member removed.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to remove member.",
      );
    } finally {
      setRemovingMemberKey(null);
    }
  }

  async function saveBabyProfile(name: string, dateOfBirth: string) {
    if (!babyProfile) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingBabyProfile(true);
    try {
      const updated = await updateBabyProfile({
        data: {
          accessToken: await getAccessToken(),
          babyId: babyProfile.id,
          name,
          dateOfBirth,
          timezone: getDeviceTimezone(),
        },
      });
      setBabyProfile({ ...babyProfile, ...updated });
      setSuccessMessage("Baby profile saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save baby profile.",
      );
    } finally {
      setIsSavingBabyProfile(false);
    }
  }

  return {
    joinCode,
    setJoinCode,
    households,
    isLoadingHouseholds,
    isJoiningHousehold,
    leavingHouseholdId,
    membersByHousehold,
    removingMemberKey,
    joinHousehold,
    leaveHousehold,
    removeMember,
    babyProfile,
    isSavingBabyProfile,
    saveBabyProfile,
    preferredPrompt,
    settingPreferredId,
    setPreferredHousehold,
    dismissPreferredPrompt: () => setPreferredPrompt(null),
  };
}
