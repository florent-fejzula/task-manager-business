import { useEffect, useRef, useState } from "react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 30 * 1000;
const BUNDLE_RE = /\/static\/js\/main\.[\w-]+\.js/;

// The hashed main bundle this page was loaded with (null on the dev server,
// where there is nothing to compare against).
function runningBundle() {
  const el = document.querySelector('script[src*="/static/js/main."]');
  const match = el && el.getAttribute("src").match(BUNDLE_RE);
  return match ? match[0] : null;
}

// Shows "new version available" when the deployed index.html points at a
// different bundle than the one running. There is no service worker to signal
// a deploy, so comparing bundle hashes is how it is detected. Checked on load,
// on a timer, and whenever the installed app comes back to the foreground.
function UpdateBanner() {
  const running = useRef(runningBundle());
  const lastCheck = useRef(0);
  const [latest, setLatest] = useState(null);
  const [dismissedFor, setDismissedFor] = useState(null);

  useEffect(() => {
    if (!running.current) return undefined;

    const check = async () => {
      const now = Date.now();
      if (now - lastCheck.current < MIN_GAP_MS) return;
      lastCheck.current = now;

      try {
        const res = await fetch("/index.html", { cache: "no-store" });
        if (!res.ok) return;
        const match = (await res.text()).match(BUNDLE_RE);
        if (match && match[0] !== running.current) setLatest(match[0]);
      } catch (_) {
        // offline - try again on the next trigger
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", check);
    };
  }, []);

  if (!latest || latest === dismissedFor) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl bg-primary py-2 pl-4 pr-2 text-white shadow-lg">
        <span className="flex-grow text-sm">A new version is available.</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-primary"
        >
          Update
        </button>
        <button
          type="button"
          onClick={() => setDismissedFor(latest)}
          aria-label="Dismiss"
          className="px-2 text-lg text-white/60 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default UpdateBanner;
