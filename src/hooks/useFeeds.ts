import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAccessToken } from "../lib/auth-token";
import {
  createFeed,
  deleteFeed,
  getProfile,
  listFeeds,
  updateFeed,
} from "../server/functions";
import type { FeedFilter, FeedLogItem, Screen, VolumeUnit } from "../types/route-types";
import type { FeedsActions, FeedsState } from "../components/Feeds";

const ML_PER_OZ = 29.5735;

function getLocalDateTimeValue(date = new Date()) {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function getLocalDayStartIso(date = new Date()) {
  const localDayStart = new Date(date);
  localDayStart.setHours(0, 0, 0, 0);
  return localDayStart.toISOString();
}

type UseFeedsOptions = {
  screen: Screen;
  session: Session | null;
  preferredDisplayVolumeUnit: VolumeUnit | null;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
};

function convertToMl(volume: number, unit: VolumeUnit) {
  if (unit === "oz") {
    return volume * ML_PER_OZ;
  }

  return volume;
}

export function useFeeds({
  screen,
  session,
  preferredDisplayVolumeUnit,
  setErrorMessage,
  setSuccessMessage,
}: UseFeedsOptions) {
  const [feedLogs, setFeedLogs] = useState<FeedLogItem[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [isSavingFeed, setIsSavingFeed] = useState(false);
  const [feedsLoadError, setFeedsLoadError] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("today");
  const [composeVolumeUnit, setComposeVolumeUnit] = useState<VolumeUnit | null>(null);
  const [feedFormulaPortionVolume, setFeedFormulaPortionVolume] = useState("");
  const [feedBreastMilkPortionVolume, setFeedBreastMilkPortionVolume] = useState("");
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editFeedStartedAt, setEditFeedStartedAt] = useState("");
  const [editFeedVolumeUnit, setEditFeedVolumeUnit] = useState<VolumeUnit>(
    preferredDisplayVolumeUnit ?? "oz",
  );
  const [editFeedFormulaVolume, setEditFeedFormulaVolume] = useState("");
  const [editFeedBreastMilkVolume, setEditFeedBreastMilkVolume] = useState("");
  const [isUpdatingFeed, setIsUpdatingFeed] = useState(false);
  const [deletingFeedId, setDeletingFeedId] = useState<string | null>(null);

  useEffect(() => {
    if (preferredDisplayVolumeUnit) {
      setComposeVolumeUnit(preferredDisplayVolumeUnit);
    }
  }, [preferredDisplayVolumeUnit]);

  async function refreshFeedLogs(babyId: string, filter: FeedFilter = feedFilter) {
    try {
      const feedData = await listFeeds({
        data: {
          accessToken: await getAccessToken(),
          babyId,
          since: filter === "today" ? getLocalDayStartIso() : null,
          limit: 50,
        },
      });
      setFeedLogs(feedData);
    } catch (error) {
      setFeedsLoadError(
        error instanceof Error ? error.message : "Unable to load feed logs.",
      );
    }
  }

  useEffect(() => {
    if ((screen !== "feeds" && screen !== "dashboard") || !session) {
      return;
    }

    async function loadFeeds() {
      setIsLoadingFeeds(true);
      setFeedsLoadError(null);

      let babyId: string;

      try {
        ({ babyId } = await getProfile({
          data: { accessToken: await getAccessToken() },
        }));
      } catch (error: unknown) {
        setIsLoadingFeeds(false);
        setFeedsLoadError(
          error instanceof Error ? error.message : "Unable to load baby profile.",
        );
        return;
      }

      setActiveBabyId(babyId);
      setIsLoadingFeeds(false);
      await refreshFeedLogs(babyId, screen === "dashboard" ? "today" : feedFilter);
    }

    void loadFeeds();
  }, [screen, session, feedFilter]);

  async function handleAddFeed(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!session?.user?.id) {
      setErrorMessage("Sign in required.");
      return;
    }

    if (!activeBabyId) {
      setErrorMessage("No baby found. Add a baby profile first.");
      return;
    }

    const formulaPortionVolume = feedFormulaPortionVolume.trim()
      ? Number(feedFormulaPortionVolume)
      : 0;
    const breastMilkPortionVolume = feedBreastMilkPortionVolume.trim()
      ? Number(feedBreastMilkPortionVolume)
      : 0;

    if (
      !Number.isFinite(formulaPortionVolume) ||
      !Number.isFinite(breastMilkPortionVolume) ||
      formulaPortionVolume < 0 ||
      breastMilkPortionVolume < 0
    ) {
      setErrorMessage("Enter valid feed volumes for formula and breast milk.");
      return;
    }

    const formulaVolumeMl = convertToMl(
      formulaPortionVolume,
      composeVolumeUnit ?? "oz",
    );
    const breastMilkVolumeMl = convertToMl(
      breastMilkPortionVolume,
      composeVolumeUnit ?? "oz",
    );

    const volumeMl = Number((formulaVolumeMl + breastMilkVolumeMl).toFixed(1));

    if (volumeMl <= 0) {
      setErrorMessage(
        "Enter a volume for formula, breast milk, or both before saving.",
      );
      return;
    }

    setIsSavingFeed(true);

    try {
      await createFeed({
        data: {
          accessToken: await getAccessToken(),
          babyId: activeBabyId,
          startedAt: new Date().toISOString(),
          formulaPortionVolume: formulaPortionVolume > 0 ? formulaPortionVolume : null,
          formulaPortionUnit: formulaPortionVolume > 0 ? composeVolumeUnit : null,
          breastMilkPortionVolume:
            breastMilkPortionVolume > 0 ? breastMilkPortionVolume : null,
          breastMilkPortionUnit: breastMilkPortionVolume > 0 ? composeVolumeUnit : null,
          idempotencyKey: crypto.randomUUID(),
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save feed log.",
      );
      setIsSavingFeed(false);
      return;
    }

    setIsSavingFeed(false);

    setSuccessMessage("Feed saved.");
    setFeedFormulaPortionVolume("");
    setFeedBreastMilkPortionVolume("");

    await refreshFeedLogs(activeBabyId);
  }

  function handleStartEditFeed(feed: FeedLogItem) {
    const editUnit =
      feed.formula_portion_unit ??
      feed.breast_milk_portion_unit ??
      preferredDisplayVolumeUnit ??
      "oz";

    setEditingFeedId(feed.id);
    setEditFeedStartedAt(getLocalDateTimeValue(new Date(feed.started_at)));
    setEditFeedVolumeUnit(editUnit);
    setEditFeedFormulaVolume(
      feed.formula_portion_volume ? String(feed.formula_portion_volume) : "",
    );
    setEditFeedBreastMilkVolume(
      feed.breast_milk_portion_volume ? String(feed.breast_milk_portion_volume) : "",
    );
  }

  async function handleUpdateFeed(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!activeBabyId || !editingFeedId) {
      return;
    }

    const startedAt = new Date(editFeedStartedAt);
    const formulaVolume = editFeedFormulaVolume.trim()
      ? Number(editFeedFormulaVolume)
      : 0;
    const breastMilkVolume = editFeedBreastMilkVolume.trim()
      ? Number(editFeedBreastMilkVolume)
      : 0;

    if (
      Number.isNaN(startedAt.getTime()) ||
      !Number.isFinite(formulaVolume) ||
      !Number.isFinite(breastMilkVolume) ||
      formulaVolume < 0 ||
      breastMilkVolume < 0 ||
      formulaVolume + breastMilkVolume <= 0
    ) {
      setErrorMessage("Enter a valid time and at least one bottle amount.");
      return;
    }

    setIsUpdatingFeed(true);

    try {
      await updateFeed({
        data: {
          accessToken: await getAccessToken(),
          feedId: editingFeedId,
          startedAt: startedAt.toISOString(),
          formulaPortionVolume: formulaVolume > 0 ? formulaVolume : null,
          formulaPortionUnit: formulaVolume > 0 ? editFeedVolumeUnit : null,
          breastMilkPortionVolume: breastMilkVolume > 0 ? breastMilkVolume : null,
          breastMilkPortionUnit: breastMilkVolume > 0 ? editFeedVolumeUnit : null,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update feed log.",
      );
      setIsUpdatingFeed(false);
      return;
    }

    setIsUpdatingFeed(false);

    setEditingFeedId(null);
    setSuccessMessage("Feed updated.");
    await refreshFeedLogs(activeBabyId);
  }

  async function handleDeleteFeed(feedId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!activeBabyId || !globalThis.confirm("Delete this bottle log?")) {
      return;
    }

    setDeletingFeedId(feedId);

    try {
      await deleteFeed({
        data: { accessToken: await getAccessToken(), feedId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete feed log.",
      );
      setDeletingFeedId(null);
      return;
    }

    setDeletingFeedId(null);

    setEditingFeedId(null);
    setSuccessMessage("Feed deleted.");
    await refreshFeedLogs(activeBabyId);
  }

  const feedsRouteState: FeedsState = {
    compose: {
      volumeUnit: composeVolumeUnit,
      formulaPortionVolume: feedFormulaPortionVolume,
      breastMilkPortionVolume: feedBreastMilkPortionVolume,
      isSaving: isSavingFeed,
    },
    list: {
      filter: feedFilter,
      isLoading: isLoadingFeeds,
      logs: feedLogs,
      loadError: feedsLoadError,
    },
    edit: {
      editingFeedId,
      startedAt: editFeedStartedAt,
      volumeUnit: editFeedVolumeUnit,
      formulaVolume: editFeedFormulaVolume,
      breastMilkVolume: editFeedBreastMilkVolume,
      isUpdating: isUpdatingFeed,
      deletingFeedId,
    },
  };

  const feedsRouteActions: FeedsActions = {
    onComposeVolumeUnitChange: setComposeVolumeUnit,
    onComposeFormulaPortionVolumeChange: setFeedFormulaPortionVolume,
    onComposeBreastMilkPortionVolumeChange: setFeedBreastMilkPortionVolume,
    onSubmitNewFeed: (e) => {
      void handleAddFeed(e);
    },
    onFeedFilterChange: setFeedFilter,
    onStartEditFeed: handleStartEditFeed,
    onDeleteFeed: (feedId) => {
      void handleDeleteFeed(feedId);
    },
    onEditStartedAtChange: setEditFeedStartedAt,
    onEditVolumeUnitChange: setEditFeedVolumeUnit,
    onEditFormulaVolumeChange: setEditFeedFormulaVolume,
    onEditBreastMilkVolumeChange: setEditFeedBreastMilkVolume,
    onSubmitFeedUpdate: (e) => {
      void handleUpdateFeed(e);
    },
    onCancelFeedEdit: () => setEditingFeedId(null),
  };

  return {
    feedsRouteState,
    feedsRouteActions,
  };
}
