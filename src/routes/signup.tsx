import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { RouteShell } from "../components/RouteShell";
import { Signup } from "../components/Signup";
import { useRouteScreen } from "../hooks/useRouteScreen";

function SignupPage() {
  const {
    isAuthReady,
    email,
    password,
    confirmPassword,
    isSubmitting,
    errorMessage,
    successMessage,
    setEmail,
    setPassword,
    setConfirmPassword,
    goTo,
    handleSignup,
  } = useRouteScreen("signup");

  if (!isAuthReady) {
    return <AuthLoading />;
  }

  return (
    <RouteShell>
      <Signup
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={(e) => {
          void handleSignup(e);
        }}
        onGoToLogin={() => goTo("login")}
        onGoToHome={() => goTo("home")}
      />
    </RouteShell>
  );
}

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});
