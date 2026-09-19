import { useCallback } from "react";

export function useClipboard({
  setErrorMessage,
  setSuccessMessage,
}: {
  setErrorMessage: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
}) {
  const copy = useCallback(
    async (value: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setErrorMessage(null);
        setSuccessMessage(successMessage);
      } catch {
        setErrorMessage("Unable to copy to clipboard.");
      }
    },
    [setErrorMessage, setSuccessMessage],
  );

  return { copy };
}
