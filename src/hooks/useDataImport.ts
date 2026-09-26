import { useState } from "react";
import { getAccessToken } from "../lib/auth-token";
import { getDeviceTimezone } from "../lib/timezone";
import {
  deterministicUuid,
  parseCsv,
  planImportRow,
  type ImportRow,
} from "../lib/nara-import";
import { getProfile, createFeed, createPumpingLog } from "../server/functions";

export function useDataImport({
  userId,
  setErrorMessage,
  setSuccessMessage,
}: {
  userId: string | null;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
}) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    processed: number;
    total: number;
  } | null>(null);
  const [importResultMessage, setImportResultMessage] = useState<string | null>(null);

  async function importFile(file: File) {
    if (!userId) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportResultMessage(null);
    setIsImporting(true);

    try {
      const rows = parseCsv(await file.text());
      const accessToken = await getAccessToken();
      const { babyId, profileName } = await getProfile({
        data: { accessToken, timezone: getDeviceTimezone() },
      });
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      setImportProgress({ processed: 0, total: rows.length });

      for (const [rowIndex, row] of (rows as ImportRow[]).entries()) {
        const plan = planImportRow(row);

        if (plan.kind === "skip") {
          skipped += 1;
          setImportProgress({ processed: rowIndex + 1, total: rows.length });
          continue;
        }

        try {
          if (plan.kind === "feed") {
            await createFeed({
              data: {
                accessToken,
                babyId,
                startedAt: plan.startedAt,
                formulaPortionVolume: plan.formulaPortionVolume,
                formulaPortionUnit: plan.formulaPortionUnit,
                breastMilkPortionVolume: plan.breastMilkPortionVolume,
                breastMilkPortionUnit: plan.breastMilkPortionUnit,
                source: "nara",
                idempotencyKey: await deterministicUuid(`feed:${plan.activityKey}`),
              },
            });
          } else {
            await createPumpingLog({
              data: {
                accessToken,
                babyId,
                startedAt: plan.startedAt,
                volume: plan.volume,
                unit: plan.unit,
                source: "nara",
                idempotencyKey: await deterministicUuid(`pump:${plan.activityKey}`),
              },
            });
          }
          imported += 1;
        } catch {
          failed += 1;
        }

        setImportProgress({ processed: rowIndex + 1, total: rows.length });
      }

      const summary =
        `Imported ${imported} activities from Nara as ${profileName}` +
        `${skipped ? `; skipped ${skipped}` : ""}` +
        `${failed ? `; ${failed} failed` : ""}.`;
      setSuccessMessage(summary);
      setImportResultMessage(summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to import CSV data.";
      setErrorMessage(message);
      setImportResultMessage(message);
    } finally {
      setImportProgress(null);
      setIsImporting(false);
    }
  }

  function openFilePicker() {
    setImportResultMessage(null);
    document.getElementById("nara-import-input")?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importFile(file);
  }

  return {
    isImporting,
    importProgress,
    importResultMessage,
    openFilePicker,
    handleFileChange,
  };
}
