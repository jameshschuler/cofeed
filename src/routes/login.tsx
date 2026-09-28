import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { Login } from "../components/Login";
import { AuthFormProvider, toAuthFormValue } from "../components/auth-form-context";
import { RouteShell } from "../components/RouteShell";
import { useRouteScreen } from "../hooks/useRouteScreen";

function LoginPage() {
  const auth = useRouteScreen("login");

  if (!auth.isAuthReady) {
    return <AuthLoading />;
  }

  return (
    <RouteShell>
      <AuthFormProvider value={toAuthFormValue(auth)}>
        <Login />
      </AuthFormProvider>
    </RouteShell>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
