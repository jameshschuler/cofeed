import { getAccessToken } from "../lib/auth-token";
import { formatZonedDateTime, getDeviceTimezone } from "../lib/timezone";
import { exportActivityCsv } from "../server/functions";

export function useDataExport({
  userId,
  setErrorMessage,
  setSuccessMessage,
}: {
  userId: string | null;
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
}) {
  async function exportData() {
    if (!userId) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const csv = await exportActivityCsv({
        data: { accessToken: await getAccessToken(), timezone: getDeviceTimezone() },
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const localDate = formatZonedDateTime(
        new Date(),
        getDeviceTimezone() ?? "UTC",
      ).slice(0, 10);
      link.download = `cofeed-export-${localDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccessMessage("Activity exported.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to export activity.",
      );
    }
  }

  return { exportData };
}
