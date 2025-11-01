'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

type PwaInstallButtonProps = {
  className?: string;
};

export function PwaInstallButton({ className }: PwaInstallButtonProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  const shouldShowHint = showIosHint && isIos;
  const shouldRenderButton = useMemo(() => {
    if (isInstalled) return false;
    if (promptEvent) return true;
    if (isIos) return true;
    return false;
  }, [isInstalled, promptEvent, isIos]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const checkInstalled = () => {
      const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const navigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
      setIsInstalled(Boolean(displayModeStandalone || navigatorStandalone));
    };

    checkInstalled();

    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setIsInstalled(event.matches);
    };
    displayModeMedia.addEventListener("change", handleDisplayModeChange);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      displayModeMedia.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!showIosHint) return;
    if (typeof window === "undefined") return;
    const timeout = window.setTimeout(() => setShowIosHint(false), 7000);
    return () => window.clearTimeout(timeout);
  }, [showIosHint]);

  const handleInstall = useCallback(async () => {
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === "accepted") {
          setIsInstalled(true);
        }
      } catch {
        // ignore prompt errors
      } finally {
        setPromptEvent(null);
      }
      return;
    }

    if (isIos) {
      setShowIosHint(true);
    }
  }, [promptEvent, isIos]);

  if (!shouldRenderButton) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-black/10 bg-emerald-100/80 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-[0_4px_0_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
          className
        )}
        aria-label="Install Brain app"
      >
        <span className="relative grid h-2.5 w-2.5 place-items-center">
          <span className="absolute h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-70 blur-[1px]" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
        </span>
        <span className="tracking-tight">Install Brain</span>
        <Download className="h-3.5 w-3.5 text-emerald-700 transition-transform duration-200 group-hover:-translate-y-0.5" aria-hidden />
      </button>
      {shouldShowHint && (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-black/10 bg-white/95 p-3 text-xs font-medium text-slate-700 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)]">
          Open Safari&rsquo;s share sheet and tap <strong>Add to Home Screen</strong> to install Brain.
        </div>
      )}
    </div>
  );
}
