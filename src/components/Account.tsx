import { useEffect, useState } from "react";
import { Check, Download, FileDown, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAccountContext } from "./account-context";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

export function Account() {
  const { state, actions } = useAccountContext();
  const [profileName, setProfileName] = useState(state.profileName);
  const { canInstall, showIosInstructions, isInstalled, promptInstall } =
    useInstallPrompt();

  useEffect(() => {
    setProfileName(state.profileName);
  }, [state.profileName]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-2 sm:gap-8 sm:py-3">
        <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
          <p className="text-sm font-medium text-foreground">Preferences</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void actions.onSaveProfileName(profileName);
            }}
          >
            <Label htmlFor="profile-name">Profile name</Label>
            <div className="flex gap-2">
              <Input
                id="profile-name"
                maxLength={80}
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
              <Button
                type="submit"
                disabled={
                  state.isSavingProfileName ||
                  profileName.trim().length === 0 ||
                  profileName.trim() === state.profileName
                }
              >
                {state.isSavingProfileName ? "Saving" : "Save"}
              </Button>
            </div>
          </form>
          <div className="mt-5 space-y-3">
            <Label>Display volume unit</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className={
                  state.isPreferencesReady && state.displayVolumeUnit === "oz"
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "bg-background"
                }
                aria-pressed={
                  state.isPreferencesReady && state.displayVolumeUnit === "oz"
                }
                disabled={!state.isPreferencesReady || state.isSavingPreferences}
                onClick={() => actions.onDisplayVolumeUnitChange("oz")}
              >
                <span>oz</span>
                {state.isPreferencesReady && state.displayVolumeUnit === "oz" ? (
                  <>
                    <Check className="size-4" />
                    <span className="sr-only">Selected</span>
                  </>
                ) : null}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={
                  state.isPreferencesReady && state.displayVolumeUnit === "ml"
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "bg-background"
                }
                aria-pressed={
                  state.isPreferencesReady && state.displayVolumeUnit === "ml"
                }
                disabled={!state.isPreferencesReady || state.isSavingPreferences}
                onClick={() => actions.onDisplayVolumeUnitChange("ml")}
              >
                <span>ml</span>
                {state.isPreferencesReady && state.displayVolumeUnit === "ml" ? (
                  <>
                    <Check className="size-4" />
                    <span className="sr-only">Selected</span>
                  </>
                ) : null}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border/70 bg-muted/30 p-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={actions.onToggleDarkMode}
            aria-pressed={state.isDarkMode}
          >
            {state.isDarkMode ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            {state.isDarkMode ? "Use light mode" : "Use dark mode"}
          </Button>
        </section>

        <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
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
        </section>

        {!isInstalled && (canInstall || showIosInstructions) ? (
          <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
            <p className="text-sm font-medium text-foreground">Install CoFeed</p>
            {canInstall ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => void promptInstall()}
              >
                <Download className="size-4" />
                Add to home screen
              </Button>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Tap the Share icon in Safari, then "Add to Home Screen" to install
                CoFeed.
              </p>
            )}
          </section>
        ) : null}
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
    </div>
  );
}
