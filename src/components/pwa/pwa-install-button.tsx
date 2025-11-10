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
          "group inline-flex items-center gap-2 rounded-full border-[4px] border-black bg-[#6BCF7F] px-6 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none focus-visible:outline-none",
          className
        )}
        aria-label="Install Brain app"
      >
        <Download className="h-5 w-5" aria-hidden />
        <span>Install</span>
      </button>
      {shouldShowHint && (
        <div className="absolute right-0 z-30 mt-3 w-64 rounded-2xl border-[4px] border-black bg-white p-4 text-sm font-bold text-black shadow-[6px_6px_0_rgba(0,0,0,1)]">
          <p className="mb-2 font-black uppercase text-[#00D1FF]">📱 iOS Instructions</p>
          Open Safari&rsquo;s share sheet and tap <strong className="text-[#6BCF7F]">Add to Home Screen</strong> to install Brain.
        </div>
      )}
    </div>
  );
}
