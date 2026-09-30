import { Download, FileDown, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useAccountContext } from "../../contexts/account-context";

export function AccountActionsSection() {
  const { state, actions } = useAccountContext();

  return (
    <div className="flex flex-col gap-6 py-2 sm:gap-8 sm:py-3">
      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6 shadow-sm">
        <p className="text-sm font-medium text-foreground">Your data</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={actions.onExportData}
        >
          <FileDown className="size-4" />
          Export activity
        </Button>
        <input
          id="nara-import-input"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={actions.onImportFileChange}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full"
          disabled={state.isImporting}
          onClick={actions.onOpenImport}
        >
          <Download className="size-4" />
          {state.isImporting
            ? state.importProgress
              ? `Importing ${state.importProgress.processed}/${state.importProgress.total}`
              : "Importing"
            : "Import Nara Data"}
        </Button>
        {!state.isImporting && state.importResultMessage ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {state.importResultMessage}
          </p>
        ) : null}
      </section>

      <section className="p-0">
        <Button
          type="button"
          className="w-full"
          variant="outline"
          onClick={actions.onSignOut}
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </section>
    </div>
  );
}
