import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "es";

const LANG_KEY = "sp.lang";
const SOUND_KEY = "sp.sound";
const ONBOARD_KEY = "sp.onboarded";
const DEV_KEY = "sp.devMode";

type Dict = Record<string, string>;

const STRINGS: Record<Lang, Dict> = {
  en: {
    "app.title": "Bible Puzzles",
    "app.tagline": "Storybook Puzzles",
    "app.subtitle": "Piece together gentle paintings of stories from the New Testament.",
    "home.unlockHint": "Finish a puzzle with at least ⭐ to unlock the next story in this difficulty.",
    "home.play": "Play",
    "home.premium": "Premium",
    "home.moreGames": "More Games",
    "home.pieces": "pieces",
    "home.resume": "Resume",
    "home.welcome": "Welcome to a peaceful place to play.",
    "select.title": "Choose a Story",
    "select.back": "Home",
    "puzzle.label": "Puzzle",
    "settings.title": "Settings",
    "settings.sound": "Sound",
    "settings.on": "On",
    "settings.off": "Off",
    "settings.language": "Language",
    "settings.close": "Close",
    "onboard.welcome": "Welcome",
    "onboard.choose": "Choose your language",
    "onboard.continue": "Continue",
    "more.title": "More Games",
    "more.subtitle": "Other stories from the Bible Games Project",
    "more.back": "Back",
    "more.play": "Play",
    "premium.title": "Premium",
    "premium.subtitle": "Coming soon",
    "premium.body": "Premium features are on the way. Thank you for your patience and support!",
    "premium.back": "Back",
    "diff.easy": "Easy",
    "diff.easy-medium": "Easy – Medium",
    "diff.medium": "Medium",
    "diff.medium-hard": "Medium – Hard",
    "diff.hard": "Hard",
    "diff.easy.short": "Easy",
    "diff.easy-medium.short": "E-Med",
    "diff.medium.short": "Med",
    "diff.medium-hard.short": "M-Hard",
    "diff.hard.short": "Hard",
    "diff.easy.desc": "Gentle first puzzles",
    "diff.easy-medium.desc": "A little more to piece together",
    "diff.medium.desc": "For curious little builders",
    "diff.medium-hard.desc": "A satisfying challenge",
    "diff.hard.desc": "For patient hearts and hands",
    "settings.dev": "Game Developer Mode",
    "settings.devHint": "Unlocks all puzzles for testing. Your real progress is kept safe.",
    "settings.reset": "Reset Game Data",
    "settings.resetConfirm": "This will permanently delete all progress, saved puzzles, and onboarding. Continue?",
    "settings.resetDone": "Game data has been reset.",
  },
  es: {
    "app.title": "Puzles Bíblicos",
    "app.tagline": "Puzles del Libro de Cuentos",
    "app.subtitle": "Arma con calma pinturas suaves de historias del Nuevo Testamento.",
    "home.unlockHint": "Termina un puzle con al menos ⭐ para desbloquear la siguiente historia en esta dificultad.",
    "home.play": "Jugar",
    "home.premium": "Premium",
    "home.moreGames": "Más Juegos",
    "home.pieces": "piezas",
    "home.resume": "Continuar",
    "home.welcome": "Bienvenido a un lugar tranquilo para jugar.",
    "select.title": "Elige una Historia",
    "select.back": "Inicio",
    "puzzle.label": "Puzle",
    "settings.title": "Ajustes",
    "settings.sound": "Sonido",
    "settings.on": "Activado",
    "settings.off": "Apagado",
    "settings.language": "Idioma",
    "settings.close": "Cerrar",
    "onboard.welcome": "Bienvenido",
    "onboard.choose": "Elige tu idioma",
    "onboard.continue": "Continuar",
    "more.title": "Más Juegos",
    "more.subtitle": "Otras historias de Bible Games Project",
    "more.back": "Volver",
    "more.play": "Jugar",
    "premium.title": "Premium",
    "premium.subtitle": "Próximamente",
    "premium.body": "Las funciones Premium están en camino. ¡Gracias por tu paciencia y apoyo!",
    "premium.back": "Volver",
    "diff.easy": "Fácil",
    "diff.easy-medium": "Fácil – Medio",
    "diff.medium": "Medio",
    "diff.medium-hard": "Medio – Difícil",
    "diff.hard": "Difícil",
    "diff.easy.short": "Fácil",
    "diff.easy-medium.short": "F-Med",
    "diff.medium.short": "Medio",
    "diff.medium-hard.short": "M-Dif",
    "diff.hard.short": "Difícil",
    "diff.easy.desc": "Puzles suaves para empezar",
    "diff.easy-medium.desc": "Un poco más para armar",
    "diff.medium.desc": "Para pequeños curiosos",
    "diff.medium-hard.desc": "Un reto agradable",
    "diff.hard.desc": "Para corazones y manos pacientes",
    "settings.dev": "Modo Desarrollador",
    "settings.devHint": "Desbloquea todos los puzles para pruebas. Tu progreso real se conserva.",
    "settings.reset": "Borrar Datos del Juego",
    "settings.resetConfirm": "Esto borrará permanentemente todo el progreso, puzles guardados y la introducción. ¿Continuar?",
    "settings.resetDone": "Los datos del juego se han borrado.",
  },
};

interface SettingsContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  sound: boolean;
  setSound: (s: boolean) => void;
  onboarded: boolean;
  completeOnboarding: (l: Lang) => void;
  devMode: boolean;
  setDevMode: (v: boolean) => void;
  resetAll: () => void;
  t: (key: string) => string;
}

const Ctx = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [sound, setSoundState] = useState<boolean>(true);
  const [onboarded, setOnboarded] = useState<boolean>(true);
  const [devMode, setDevModeState] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const l = localStorage.getItem(LANG_KEY) as Lang | null;
      const s = localStorage.getItem(SOUND_KEY);
      const o = localStorage.getItem(ONBOARD_KEY);
      const d = localStorage.getItem(DEV_KEY);
      if (l === "en" || l === "es") setLangState(l);
      if (s !== null) setSoundState(s === "1");
      setOnboarded(o === "1");
      setDevModeState(d === "1");
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
  const resetAll = () => {
    try {
      // Clear all known app keys + any starting with our prefix.
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (
          k.startsWith("sp.") ||
          k.startsWith("jesus-puzzles-")
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    setLangState("en");
    setSoundState(true);
    setOnboarded(false);
    setDevModeState(false);
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
