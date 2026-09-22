import { createFileRoute } from "@tanstack/react-router";
import { ResetPassword } from "../components/ResetPassword";
import { RouteShell } from "../components/RouteShell";
import { useRouteScreen } from "../hooks/useRouteScreen";

function ResetPasswordPage() {
  const {
    session,
    email,
    password,
    confirmPassword,
    isSubmitting,
    errorMessage,
    successMessage,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleRequestPasswordReset,
    handleUpdatePassword,
    goTo,
  } = useRouteScreen("reset-password");

  return (
    <RouteShell>
      <ResetPassword
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        successMessage={successMessage}
        isRecoverySession={session !== null}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onRequestReset={(event) => void handleRequestPasswordReset(event)}
        onUpdatePassword={(event) => void handleUpdatePassword(event)}
        onGoToLogin={() => goTo("login")}
      />
    </RouteShell>
  );
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});
