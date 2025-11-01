'use client';

import { useEffect } from "react";

const SW_PATH = "/sw.js";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const isSecureContext =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost";
    if (!isSecureContext) return;

    let activeRegistration: ServiceWorkerRegistration | null = null;

    const sendSkipWaiting = () => {
      if (activeRegistration?.waiting) {
        activeRegistration.waiting.postMessage("SKIP_WAITING");
      }
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });
        activeRegistration = registration;

        if (registration.waiting) {
          sendSkipWaiting();
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              sendSkipWaiting();
            }
          });
        });
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    register();

    return () => {
      activeRegistration = null;
    };
  }, []);

  return null;
}
