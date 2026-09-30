import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/layout/AuthLoading";
import { RouteShell } from "../components/layout/RouteShell";
import { Signup } from "../components/auth/Signup";
import { AuthFormProvider, toAuthFormValue } from "../contexts/auth-form-context";
import { useRouteScreen } from "../hooks/useRouteScreen";

function SignupPage() {
  const auth = useRouteScreen("signup");

  if (!auth.isAuthReady) {
    return <AuthLoading />;
  }

  return (
    <RouteShell>
      <AuthFormProvider value={toAuthFormValue(auth)}>
        <Signup />
      </AuthFormProvider>
    </RouteShell>
  );
}

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});
