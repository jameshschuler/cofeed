import { createFileRoute } from "@tanstack/react-router";
import { ResetPassword } from "../components/ResetPassword";
import { AuthFormProvider, toAuthFormValue } from "../components/auth-form-context";
import { RouteShell } from "../components/RouteShell";
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
