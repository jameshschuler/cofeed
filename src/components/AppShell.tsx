import type { PropsWithChildren } from "react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="flex h-svh min-h-svh flex-col overflow-hidden bg-muted/40 px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
      <header className="mx-auto w-full max-w-7xl">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          CoFeed
        </p>
      </header>
      <main className="mx-auto mt-2 flex min-h-0 w-full max-w-7xl flex-1">
        {children}
      </main>
    </div>
  );
}
