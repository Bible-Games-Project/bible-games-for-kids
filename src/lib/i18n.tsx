import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { STRINGS, LANGS, RTL_LANGS, type Lang } from "./translations";

export type { Lang } from "./translations";
export { LANGS, RTL_LANGS } from "./translations";

const LANG_KEY = "sp.lang";
const SOUND_KEY = "sp.sound";
const ONBOARD_KEY = "sp.onboarded";
const DEV_KEY = "sp.devMode";
const PREMIUM_KEY = "sp.premium";

const SUPPORTED_LANGS = new Set<Lang>(LANGS.map((l) => l.id));

function isLang(v: unknown): v is Lang {
  return typeof v === "string" && SUPPORTED_LANGS.has(v as Lang);
}

function applyHtmlLangDir(lang: Lang) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = lang;
  root.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

interface SettingsContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  sound: boolean;
  setSound: (s: boolean) => void;
  onboarded: boolean;
  completeOnboarding: (l: Lang) => void;
  devMode: boolean;
  setDevMode: (v: boolean) => void;
  premium: boolean;
  setPremium: (v: boolean) => void;
  resetAll: () => void;
  t: (key: string) => string;
}

const Ctx = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [sound, setSoundState] = useState<boolean>(true);
  const [onboarded, setOnboarded] = useState<boolean>(true);
  const [devMode, setDevModeState] = useState<boolean>(false);
  const [premium, setPremiumState] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const l = localStorage.getItem(LANG_KEY) as Lang | null;
      const s = localStorage.getItem(SOUND_KEY);
      const o = localStorage.getItem(ONBOARD_KEY);
      const d = localStorage.getItem(DEV_KEY);
      const p = localStorage.getItem(PREMIUM_KEY);
      if (l === "en" || l === "es") setLangState(l);
      if (s !== null) setSoundState(s === "1");
      setOnboarded(o === "1");
      setDevModeState(d === "1");
      setPremiumState(p === "1");
    } catch {}
    setHydrated(true);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  };
  const setSound = (s: boolean) => {
    setSoundState(s);
    try { localStorage.setItem(SOUND_KEY, s ? "1" : "0"); } catch {}
  };
  const completeOnboarding = (l: Lang) => {
    setLang(l);
    setOnboarded(true);
    try { localStorage.setItem(ONBOARD_KEY, "1"); } catch {}
  };
  const setDevMode = (v: boolean) => {
    setDevModeState(v);
    try { localStorage.setItem(DEV_KEY, v ? "1" : "0"); } catch {}
  };
  const setPremium = (v: boolean) => {
    setPremiumState(v);
    try { localStorage.setItem(PREMIUM_KEY, v ? "1" : "0"); } catch {}
  };
  const resetAll = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("sp.") || k.startsWith("jesus-puzzles-")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    setLangState("en");
    setSoundState(true);
    setOnboarded(false);
    setDevModeState(false);
    setPremiumState(false);
  };

  const t = useMemo(() => {
    const dict = STRINGS[lang];
    return (key: string) => dict[key] ?? STRINGS.en[key] ?? key;
  }, [lang]);

  const value: SettingsContextValue = {
    lang,
    setLang,
    sound,
    setSound,
    onboarded: hydrated ? onboarded : true,
    completeOnboarding,
    devMode: hydrated ? devMode : false,
    setDevMode,
    premium: hydrated ? premium : false,
    setPremium,
    resetAll,
    t,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
