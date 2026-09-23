import { getAccessToken } from "../lib/auth-token";
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
        data: { accessToken: await getAccessToken() },
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cofeed-export-${new Date().toISOString().slice(0, 10)}.csv`;
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
