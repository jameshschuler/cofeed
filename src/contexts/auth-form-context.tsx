import { createContext, useContext, type FormEvent, type ReactNode } from "react";
import type { useRouteScreen } from "../hooks/useRouteScreen";
import type { Screen } from "../types/route-types";

export type AuthFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  isRecoverySession: boolean;
};

export type AuthFormActions = {
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onSignup: (event: FormEvent<HTMLFormElement>) => void;
  onRequestReset: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
  onNavigate: (screen: Screen) => void;
};

type AuthFormContextValue = { state: AuthFormState; actions: AuthFormActions };

const AuthFormContext = createContext<AuthFormContextValue | null>(null);

export function toAuthFormValue(
  auth: ReturnType<typeof useRouteScreen>,
): AuthFormContextValue {
  return {
    state: {
      email: auth.email,
      password: auth.password,
      confirmPassword: auth.confirmPassword,
      isSubmitting: auth.isSubmitting,
      errorMessage: auth.errorMessage,
      successMessage: auth.successMessage,
      isRecoverySession: auth.session !== null,
    },
    actions: {
      onEmailChange: auth.setEmail,
      onPasswordChange: auth.setPassword,
      onConfirmPasswordChange: auth.setConfirmPassword,
      onLogin: (event) => void auth.handleLogin(event),
      onSignup: (event) => void auth.handleSignup(event),
      onRequestReset: (event) => void auth.handleRequestPasswordReset(event),
      onUpdatePassword: (event) => void auth.handleUpdatePassword(event),
      onNavigate: auth.goTo,
    },
  };
}

export function AuthFormProvider({
  value,
  children,
}: {
  value: AuthFormContextValue;
  children: ReactNode;
}) {
  return <AuthFormContext.Provider value={value}>{children}</AuthFormContext.Provider>;
}

export function useAuthFormContext() {
  const context = useContext(AuthFormContext);
  if (!context) {
    throw new Error("useAuthFormContext must be used within AuthFormProvider.");
  }
  return context;
}
