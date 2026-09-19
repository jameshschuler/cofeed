import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { Login } from "../components/Login";
import { RouteShell } from "../components/RouteShell";
import { useRouteScreen } from "../hooks/useRouteScreen";

function LoginPage() {
  const {
    isAuthReady,
    email,
    password,
    isSubmitting,
    errorMessage,
    successMessage,
    setEmail,
    setPassword,
    goTo,
    handleLogin,
  } = useRouteScreen("login");

  if (!isAuthReady) {
    return <AuthLoading />;
  }

  return (
    <RouteShell>
      <Login
        email={email}
        password={password}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={(e) => {
          void handleLogin(e);
        }}
        onGoToSignup={() => goTo("signup")}
        onGoToHome={() => goTo("home")}
      />
    </RouteShell>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
