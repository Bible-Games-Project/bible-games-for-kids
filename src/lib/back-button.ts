// Makes the phone / browser back button step back inside the app instead of
// leaving the page (which shows a blank screen). The app has no URL routes,
// so screens that can go "back" register a handler while they are open, and
// one extra history entry catches the back press.
import { useEffect, useRef } from "react";

const handlers: Array<() => void> = [];
let guardInHistory = false;
let listening = false;

function pushGuard() {
  if (guardInHistory || typeof window === "undefined") return;
  try {
    window.history.pushState({ faithfunBack: true }, "");
    guardInHistory = true;
  } catch {
    // Some embedded viewers block history changes; the in-app ← still works.
  }
}

function onPopState() {
  guardInHistory = false;
  const handler = handlers[handlers.length - 1];
  if (!handler) {
    // Already on the home screen: let the back press leave the app.
    window.history.back();
    return;
  }
  // The handler's screen unregisters itself when it closes; if any screen
  // stays open underneath, keep catching the next back press too.
  if (handlers.length > 1) pushGuard();
  handler();
}

function register(handler: () => void) {
  if (!listening) {
    window.addEventListener("popstate", onPopState);
    listening = true;
  }
  handlers.push(handler);
  pushGuard();
  return () => {
    const i = handlers.lastIndexOf(handler);
    if (i >= 0) handlers.splice(i, 1);
  };
}

// While `enabled`, the back button runs `onBack` (the same thing the screen's
// own ← button does). Register screens from outermost to innermost.
export function useBackButton(enabled: boolean, onBack: () => void) {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    if (!enabled) return;
    return register(() => ref.current());
  }, [enabled]);
}
