import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { buttonVariants } from "../components/ui/button";
import "../styles.css";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "CoFeed" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  useEffect(() => {
    if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) void registration.unregister();
    });
    if ("caches" in window) {
      void window.caches.keys().then((names) => {
        for (const name of names) void window.caches.delete(name);
      });
    }
  }, []);

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return (
    <AppShell>
      <Card className="m-auto flex w-full max-w-xl flex-col rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This CoFeed page does not exist.
          </p>
        </CardContent>
        <CardFooter>
          <Link to="/" className={buttonVariants({ className: "w-full sm:w-auto" })}>
            <Home className="size-4" />
            Go home
          </Link>
        </CardFooter>
      </Card>
    </AppShell>
  );
}
