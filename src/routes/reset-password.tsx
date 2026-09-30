import { createFileRoute } from "@tanstack/react-router";
import { ResetPassword } from "../components/auth/ResetPassword";
import { AuthFormProvider, toAuthFormValue } from "../contexts/auth-form-context";
import { RouteShell } from "../components/layout/RouteShell";
import { useRouteScreen } from "../hooks/useRouteScreen";

function ResetPasswordPage() {
  const auth = useRouteScreen("reset-password");

  return (
    <RouteShell>
      <AuthFormProvider value={toAuthFormValue(auth)}>
        <ResetPassword />
      </AuthFormProvider>
    </RouteShell>
  );
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});
