import { Loader2 } from "lucide-react";
import { AppShell } from "./AppShell";

export function AuthLoading() {
  return (
    <AppShell>
      <div className="flex min-h-full flex-1 items-center justify-center rounded-2xl border bg-card text-card-foreground shadow-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    </AppShell>
  );
}
