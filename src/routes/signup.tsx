import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { RouteShell } from "../components/RouteShell";
import { Signup } from "../components/Signup";
import { AuthFormProvider, toAuthFormValue } from "../components/auth-form-context";
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
