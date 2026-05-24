"use client";

import { useEffect } from "react";

/**
 * Mounted only for signed-in learners. Sends POST /api/heartbeat every 60s
 * while the tab is visible. Skipped in background tabs so we don't double-
 * count "active" time when the user alt-tabs away.
 */
export function HeartbeatPing() {
  useEffect(() => {
    let cancelled = false;

    async function ping() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        await fetch("/api/heartbeat", { method: "POST" });
      } catch {
        /* swallow */
      }
    }

    // Fire immediately, then every 60s.
    void ping();
    const interval = window.setInterval(() => void ping(), 60_000);

    function onVisible() {
      if (document.visibilityState === "visible") void ping();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
