import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay() {
  const isDisplayModeStandalone =
    typeof window !== "undefined" &&
    window.matchMedia?.("(display-mode: standalone)").matches;
  const isIosStandalone =
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(isDisplayModeStandalone || isIosStandalone);
}

function isIosDevice() {
  return (
    typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent)
  );
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }

  return {
    canInstall: deferredPrompt !== null && !isInstalled,
    showIosInstructions: isIosDevice() && !isInstalled && deferredPrompt === null,
    isInstalled,
    promptInstall,
  };
}
