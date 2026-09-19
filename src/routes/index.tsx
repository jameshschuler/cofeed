import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { Home } from "../components/Home";
import { RouteShell } from "../components/RouteShell";
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
