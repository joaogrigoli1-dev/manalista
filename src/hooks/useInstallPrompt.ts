"use client";
import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export type InstallOutcome = "accepted" | "dismissed" | "not-available";

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) return "not-available";

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);

    return choice.outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsInstallable(false);
    try {
      localStorage.setItem("manalista-install-dismissed", Date.now().toString());
    } catch { /* SSR safe */ }
  }, []);

  const wasDismissedRecently = useCallback((): boolean => {
    try {
      const ts = localStorage.getItem("manalista-install-dismissed");
      if (!ts) return false;
      const days7 = 7 * 24 * 60 * 60 * 1000;
      return Date.now() - parseInt(ts) < days7;
    } catch { return false; }
  }, []);

  return {
    isInstallable: isInstallable && !wasDismissedRecently(),
    isInstalled,
    isIOS,
    promptInstall,
    dismiss,
  };
}
