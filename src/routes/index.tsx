import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/layout/AuthLoading";
import { Home } from "../components/home/Home";
import { RouteShell } from "../components/layout/RouteShell";
import { useRouteScreen } from "../hooks/useRouteScreen";

function HomePage() {
  const { isAuthReady, goTo } = useRouteScreen("home");

  if (!isAuthReady) {
    return <AuthLoading />;
  }

  return (
    <RouteShell>
      <Home onLogin={() => goTo("login")} onSignup={() => goTo("signup")} />
    </RouteShell>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
