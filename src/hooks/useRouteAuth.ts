import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { isPrivateScreen, type Screen } from "../types/route-types";

type NavigateTo = (nextScreen: Screen, options?: { replace?: boolean }) => void;

type UseRouteAuthOptions = {
  screen: Screen;
  navigateTo: NavigateTo;
};

export function useRouteAuth({ screen, navigateTo }: UseRouteAuthOptions) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function guardedNavigate(nextScreen: Screen, options?: { replace?: boolean }) {
    clearMessages();
    navigateTo(nextScreen, options);
  }

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = setTimeout(() => setSuccessMessage(null), 2000);
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);

      if (data.session) {
        if (screen === "home" || screen === "login" || screen === "signup") {
          guardedNavigate("dashboard", { replace: true });
        }
      } else if (isPrivateScreen(screen)) {
        guardedNavigate("home", { replace: true });
      }

      setIsAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        if (screen === "home" || screen === "login" || screen === "signup") {
          guardedNavigate("dashboard", { replace: true });
        }
      } else if (isPrivateScreen(screen)) {
        guardedNavigate("home", { replace: true });
      }

      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [screen, navigateTo]);

  function goTo(nextScreen: Screen) {
    const requiresAuth = isPrivateScreen(nextScreen);

    if (requiresAuth && !session) {
      guardedNavigate("home");
      return;
    }

    guardedNavigate(nextScreen);
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message || "Unable to sign in.");
      return;
    }

    setSession(data.session);
    setSuccessMessage(`Signed in as ${data.user?.email ?? email}`);
    guardedNavigate("dashboard");
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message || "Unable to sign up.");
      return;
    }

    if (data.session) {
      setSession(data.session);
      setSuccessMessage(`Account created and signed in as ${email}`);
      guardedNavigate("dashboard");
      return;
    }

    setSuccessMessage("Account created. Check your email to confirm sign up.");
  }

  async function handleSignOut() {
    clearMessages();

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message || "Unable to sign out.");
      return;
    }

    setSession(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    guardedNavigate("home");
  }

  return {
    session,
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
    setErrorMessage,
    setSuccessMessage,
    goTo,
    handleLogin,
    handleSignup,
    handleSignOut,
  };
}
