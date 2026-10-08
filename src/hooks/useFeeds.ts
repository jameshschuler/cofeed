import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAccessToken } from "../lib/auth-token";
import { createFeed, deleteFeed, updateFeed } from "../server/feeds";
import {
  createPumpingLog,
  deletePumpingLog,
  updatePumpingLog,
} from "../server/pumping";
import type {
  FeedFilter,
  FeedLogItem,
  PumpingLogItem,
  Screen,
  VolumeUnit,
} from "../types/route-types";
import type { FeedsActions, FeedsState } from "../contexts/feeds-context";
import type { PumpingActions, PumpingState } from "../contexts/pumping-context";
import { useFeedData } from "./useFeedData";
import { getListRange } from "../lib/activity-scope";
import { toMl } from "../lib/activity-format";
import { toDateInputValue, toDateTimeInputValue } from "../lib/timezone";
import { getMaxPortionVolume } from "../lib/volume";

type UseFeedsOptions = {
  screen: Screen;
  session: Session | null;
  preferredDisplayVolumeUnit: VolumeUnit | null;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
};

export function useFeeds({
  screen,
  session,
  preferredDisplayVolumeUnit,
  setErrorMessage,
  setSuccessMessage,
}: UseFeedsOptions) {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("today");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const feedData = useFeedData({
    screen,
    session,
    feedFilter,
    selectedDate,
    setErrorMessage,
  });
  const [isSavingFeed, setIsSavingFeed] = useState(false);
  const [composeVolumeUnit, setComposeVolumeUnit] = useState<VolumeUnit | null>(null);
  const [composeStartedAt, setComposeStartedAt] = useState(() =>
    toDateTimeInputValue(),
  );
  const [feedFormulaPortionVolume, setFeedFormulaPortionVolume] = useState("");
  const [feedBreastMilkPortionVolume, setFeedBreastMilkPortionVolume] = useState("");
  const [pumpingVolume, setPumpingVolume] = useState("");
  const [isSavingPumping, setIsSavingPumping] = useState(false);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editFeedStartedAt, setEditFeedStartedAt] = useState("");
  const [editFeedVolumeUnit, setEditFeedVolumeUnit] = useState<VolumeUnit>(
    preferredDisplayVolumeUnit ?? "oz",
  );
  const [editFeedFormulaVolume, setEditFeedFormulaVolume] = useState("");
  const [editFeedBreastMilkVolume, setEditFeedBreastMilkVolume] = useState("");
  const [isUpdatingFeed, setIsUpdatingFeed] = useState(false);
  const [deletingFeedId, setDeletingFeedId] = useState<string | null>(null);
  const [editingPumpingId, setEditingPumpingId] = useState<string | null>(null);
  const [editPumpingStartedAt, setEditPumpingStartedAt] = useState("");
  const [editPumpingVolume, setEditPumpingVolume] = useState("");
  const [editPumpingUnit, setEditPumpingUnit] = useState<VolumeUnit>(
    preferredDisplayVolumeUnit ?? "oz",
  );
  const [isUpdatingPumping, setIsUpdatingPumping] = useState(false);
  const [deletingPumpingId, setDeletingPumpingId] = useState<string | null>(null);

  useEffect(() => {
    if (preferredDisplayVolumeUnit) {
      setComposeVolumeUnit(preferredDisplayVolumeUnit);
    }
  }, [preferredDisplayVolumeUnit]);

  async function handleAddFeed(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (feedData.isUsingCachedActivity) {
      setErrorMessage("Offline mode is read-only. Reconnect to log a feed.");
      return false;
    }

    if (!session?.user?.id) {
      setErrorMessage("Sign in required.");
      return false;
    }

    if (!feedData.activeBabyId) {
      setErrorMessage("No baby found. Add a baby profile first.");
      return false;
    }

    const startedAt = new Date(composeStartedAt);
    if (Number.isNaN(startedAt.getTime())) {
      setErrorMessage("Enter a valid time.");
      return false;
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
      return false;
    }

    const maxPortionVolume = getMaxPortionVolume(composeVolumeUnit ?? "oz");
    if (
      formulaPortionVolume > maxPortionVolume ||
      breastMilkPortionVolume > maxPortionVolume
    ) {
      setErrorMessage(
        `Enter a realistic bottle amount (up to ${maxPortionVolume} ${composeVolumeUnit ?? "oz"} per portion).`,
      );
      return false;
    }

    const formulaVolumeMl = toMl(formulaPortionVolume, composeVolumeUnit ?? "oz");
    const breastMilkVolumeMl = toMl(breastMilkPortionVolume, composeVolumeUnit ?? "oz");

    const volumeMl = Number((formulaVolumeMl + breastMilkVolumeMl).toFixed(1));

    if (volumeMl <= 0) {
      setErrorMessage(
        "Enter a volume for formula, breast milk, or both before saving.",
      );
      return false;
    }

    setIsSavingFeed(true);

    try {
      await createFeed({
        data: {
          accessToken: await getAccessToken(),
          babyId: feedData.activeBabyId,
          startedAt: startedAt.toISOString(),
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
      return false;
    }

    setIsSavingFeed(false);

    setSuccessMessage("Feed saved.");
    setComposeStartedAt(toDateTimeInputValue());
    setFeedFormulaPortionVolume("");
    setFeedBreastMilkPortionVolume("");

    await Promise.all([
      feedData.refreshFeedLogs(feedData.activeBabyId, getListRange(screen, feedFilter)),
      feedData.refreshWeeklyStats(feedData.activeBabyId, { showLoading: false }),
    ]);
    return true;
  }

  async function handleAddPumping(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (feedData.isUsingCachedActivity) {
      setErrorMessage("Offline mode is read-only. Reconnect to log pumping.");
      return false;
    }

    if (!feedData.activeBabyId) {
      setErrorMessage("No baby found. Add a baby profile first.");
      return false;
    }

    const volume = Number(pumpingVolume.trim());
    const unit = composeVolumeUnit ?? "oz";
    const startedAt = new Date(composeStartedAt);
    const maxVolume = getMaxPortionVolume(unit);

    if (
      !Number.isFinite(volume) ||
      volume <= 0 ||
      volume > maxVolume ||
      Number.isNaN(startedAt.getTime())
    ) {
      setErrorMessage(`Enter a valid pumping amount up to ${maxVolume} ${unit}.`);
      return false;
    }

    setIsSavingPumping(true);
    try {
      await createPumpingLog({
        data: {
          accessToken: await getAccessToken(),
          babyId: feedData.activeBabyId,
          startedAt: startedAt.toISOString(),
          volume,
          unit,
          idempotencyKey: crypto.randomUUID(),
        },
      });
      setPumpingVolume("");
      setComposeStartedAt(toDateTimeInputValue());
      setSuccessMessage("Pumping session saved.");
      await Promise.all([
        feedData.refreshPumpingLogs(
          feedData.activeBabyId,
          getListRange(screen, feedFilter),
        ),
        feedData.refreshWeeklyStats(feedData.activeBabyId, { showLoading: false }),
      ]);
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save pumping session.",
      );
      return false;
    } finally {
      setIsSavingPumping(false);
    }
  }

  async function refreshActivity(babyId: string) {
    const filter = getListRange(screen, feedFilter);
    await Promise.all([
      feedData.refreshFeedLogs(babyId, filter),
      feedData.refreshPumpingLogs(babyId, filter),
      feedData.refreshWeeklyStats(babyId, { showLoading: false }),
    ]);
  }

  function handleFilterChange(filter: FeedFilter) {
    setFeedFilter(filter);
    if (filter === "date") {
      setSelectedDate((current) => current ?? toDateInputValue());
    } else {
      setSelectedDate(null);
    }
  }

  function handleStartEditPumping(session: PumpingLogItem) {
    setEditingPumpingId(session.id);
    setEditPumpingStartedAt(toDateTimeInputValue(new Date(session.started_at)));
    setEditPumpingVolume(String(session.volume));
    setEditPumpingUnit(session.unit);
  }

  async function handleUpdatePumping(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const babyId = feedData.activeBabyId;
    if (!babyId || !editingPumpingId) {
      return;
    }

    const startedAt = new Date(editPumpingStartedAt);
    const volume = Number(editPumpingVolume);
    const maxVolume = getMaxPortionVolume(editPumpingUnit);
    if (
      Number.isNaN(startedAt.getTime()) ||
      !Number.isFinite(volume) ||
      volume <= 0 ||
      volume > maxVolume
    ) {
      setErrorMessage(
        `Enter a valid time and a pumped amount up to ${maxVolume} ${editPumpingUnit}.`,
      );
      return;
    }

    setIsUpdatingPumping(true);
    try {
      await updatePumpingLog({
        data: {
          accessToken: await getAccessToken(),
          pumpingLogId: editingPumpingId,
          startedAt: startedAt.toISOString(),
          volume,
          unit: editPumpingUnit,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update pumping session.",
      );
      return;
    } finally {
      setIsUpdatingPumping(false);
    }

    setEditingPumpingId(null);
    setSuccessMessage("Pumping session updated.");
    await refreshActivity(babyId);
  }

  async function handleDeletePumping(pumpingLogId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const babyId = feedData.activeBabyId;
    if (!babyId) {
      return;
    }

    setDeletingPumpingId(pumpingLogId);
    try {
      await deletePumpingLog({
        data: { accessToken: await getAccessToken(), pumpingLogId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete pumping session.",
      );
      return;
    } finally {
      setDeletingPumpingId(null);
    }

    setEditingPumpingId(null);
    setSuccessMessage("Pumping session deleted.");
    await refreshActivity(babyId);
  }

  function handleStartEditFeed(feed: FeedLogItem) {
    const editUnit =
      feed.formula_portion_unit ??
      feed.breast_milk_portion_unit ??
      preferredDisplayVolumeUnit ??
      "oz";

    setEditingFeedId(feed.id);
    setEditFeedStartedAt(toDateTimeInputValue(new Date(feed.started_at)));
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

    if (!feedData.activeBabyId || !editingFeedId) {
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

    const maxEditPortionVolume = getMaxPortionVolume(editFeedVolumeUnit);
    if (
      formulaVolume > maxEditPortionVolume ||
      breastMilkVolume > maxEditPortionVolume
    ) {
      setErrorMessage(
        `Enter a realistic bottle amount (up to ${maxEditPortionVolume} ${editFeedVolumeUnit} per portion).`,
      );
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
    await Promise.all([
      feedData.refreshFeedLogs(feedData.activeBabyId, getListRange(screen, feedFilter)),
      feedData.refreshWeeklyStats(feedData.activeBabyId, { showLoading: false }),
    ]);
  }

  async function handleDeleteFeed(feedId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!feedData.activeBabyId) {
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
    await Promise.all([
      feedData.refreshFeedLogs(feedData.activeBabyId, getListRange(screen, feedFilter)),
      feedData.refreshWeeklyStats(feedData.activeBabyId, { showLoading: false }),
    ]);
  }

  const feedsRouteState: FeedsState = {
    compose: {
      volumeUnit: composeVolumeUnit,
      startedAt: composeStartedAt,
      formulaPortionVolume: feedFormulaPortionVolume,
      breastMilkPortionVolume: feedBreastMilkPortionVolume,
      pumpingVolume,
      isSaving: isSavingFeed,
      isSavingPumping,
      targetHouseholdName: feedData.targetHouseholdName,
    },
    list: {
      filter: feedFilter,
      selectedDate,
      isLoading: feedData.isLoadingFeeds,
      logs: feedData.feedLogs,
      loadError: feedData.feedsLoadError,
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
    onComposeStartedAtChange: setComposeStartedAt,
    onComposeFormulaPortionVolumeChange: setFeedFormulaPortionVolume,
    onComposeBreastMilkPortionVolumeChange: setFeedBreastMilkPortionVolume,
    onComposePumpingVolumeChange: setPumpingVolume,
    onSubmitNewFeed: (e) => {
      return handleAddFeed(e);
    },
    onSubmitPumping: (e) => {
      return handleAddPumping(e);
    },
    onFeedFilterChange: handleFilterChange,
    onFeedDateChange: setSelectedDate,
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

  const pumpingRouteState: PumpingState = {
    list: {
      filter: feedFilter,
      selectedDate,
      isLoading: feedData.isLoadingFeeds,
      logs: feedData.pumpingLogs,
      loadError: feedData.feedsLoadError,
    },
    edit: {
      editingPumpingId,
      startedAt: editPumpingStartedAt,
      volume: editPumpingVolume,
      unit: editPumpingUnit,
      isUpdating: isUpdatingPumping,
      deletingPumpingId,
    },
  };

  const pumpingRouteActions: PumpingActions = {
    onFilterChange: handleFilterChange,
    onDateChange: setSelectedDate,
    onStartEdit: handleStartEditPumping,
    onDelete: (pumpingLogId) => {
      void handleDeletePumping(pumpingLogId);
    },
    onEditStartedAtChange: setEditPumpingStartedAt,
    onEditVolumeChange: setEditPumpingVolume,
    onEditUnitChange: setEditPumpingUnit,
    onSubmitEdit: (e) => {
      void handleUpdatePumping(e);
    },
    onCancelEdit: () => setEditingPumpingId(null),
  };

  async function refreshCurrentActivity() {
    if (feedData.activeBabyId) {
      await refreshActivity(feedData.activeBabyId);
    }
  }

  return {
    refreshActivity: refreshCurrentActivity,
    feedsRouteState,
    feedsRouteActions,
    pumpingRouteState,
    pumpingRouteActions,
    weeklyFeeds: feedData.weeklyFeedLogs,
    pumpingLogs: feedData.pumpingLogs,
    weeklyPumpingLogs: feedData.weeklyPumpingLogs,
    isLoadingWeeklyStats: feedData.isLoadingWeeklyStats,
    weeklyFeedError: feedData.weeklyFeedError,
    weeklyPumpingError: feedData.weeklyPumpingError,
    isUsingCachedActivity: feedData.isUsingCachedActivity,
    dashboardBabyId: feedData.viewBabyId ?? feedData.activeBabyId,
    setDashboardBabyId: feedData.setViewBabyId,
    lastSyncedAt: feedData.lastSyncedAt,
  };
}
