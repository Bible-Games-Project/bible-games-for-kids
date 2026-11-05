import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useSettings } from "@/lib/i18n";

import s1 from "@/assets/music/Song_1.mp3.asset.json";
import s2 from "@/assets/music/Song_2.mp3.asset.json";
import s3 from "@/assets/music/Song_3.mp3.asset.json";
import s4 from "@/assets/music/Song_4.mp3.asset.json";
import s6 from "@/assets/music/Song_6.mp3.asset.json";
import s7 from "@/assets/music/Song_7.mp3.asset.json";
import s8 from "@/assets/music/Song_8.mp3.asset.json";
import s9 from "@/assets/music/Song_9.mp3.asset.json";
import s10 from "@/assets/music/Song_10.mp3.asset.json";

// Scalable: add more entries here and the system picks them up automatically.
const TRACKS: string[] = [s1, s2, s3, s4, s6, s7, s8, s9, s10].map((a) => a.url);

export type MusicScope = "menu" | "puzzle";

// Sound effects: free CC0 recordings (Kenney's packs and others, see
// src/assets/sfx/README.md), one short MP3 each, named by file.
const SFX: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/sfx/*.mp3", { eager: true, import: "default" }),
  ).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, -4), url]),
);

// Each game sounds different: its own effects for the moments every game has
// (a tap or move, a right answer, a wrong one) and its own winning tune.
export type SoundTheme =
  | "puzzle"
  | "memory"
  | "dragdrop"
  | "coloring"
  | "seek"
  | "order"
  | "guesswho"
  | "goose"
  | "domino"
  | "parchis"
  | "chess";

const THEMES: Record<
  SoundTheme,
  { tap: string[]; correct: string[]; incorrect: string[]; win: string }
> = {
  puzzle: { tap: [], correct: ["puzzle-snap"], incorrect: ["puzzle-wrong"], win: "win-puzzle" },
  memory: {
    tap: ["card-flip-1", "card-flip-2", "card-flip-3"],
    correct: ["pair-found"],
    incorrect: ["card-back"],
    win: "win-memory",
  },
  dragdrop: { tap: [], correct: ["drop-right"], incorrect: ["drop-wrong"], win: "win-dragdrop" },
  coloring: { tap: ["paint"], correct: ["paint"], incorrect: ["paint-wrong"], win: "win-coloring" },
  seek: { tap: [], correct: ["seek-found"], incorrect: ["seek-miss"], win: "win-seek" },
  order: { tap: [], correct: ["order-right"], incorrect: ["order-wrong"], win: "win-order" },
  guesswho: {
    tap: ["ask"],
    correct: ["answer-yes"],
    incorrect: ["answer-no"],
    win: "win-guesswho",
  },
  goose: {
    tap: ["die-throw"],
    correct: ["goose-bonus"],
    incorrect: ["goose-prison"],
    win: "win-goose",
  },
  domino: {
    tap: ["domino-place"],
    correct: ["domino-place"],
    incorrect: ["domino-pass"],
    win: "win-domino",
  },
  parchis: {
    tap: ["dice-throw"],
    correct: ["parchis-goal"],
    incorrect: ["parchis-home"],
    win: "win-parchis",
  },
  chess: {
    tap: ["chess-move"],
    correct: ["chess-capture"],
    incorrect: ["chess-capture"],
    win: "win-chess",
  },
};

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

interface AudioApi {
  setScope: (scope: MusicScope) => void;
  // The game whose sounds play (null on menus and the home screen).
  setTheme: (theme: SoundTheme | null) => void;
  // One named effect from src/assets/sfx.
  play: (name: string, volume?: number) => void;
  playClick: () => void;
  playCorrect: () => void;
  playIncorrect: () => void;
  playWin: () => void;
}

const AudioCtx = createContext<AudioApi | null>(null);

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VOLUMES: Record<MusicScope, number> = { menu: 0.5, puzzle: 1.0 };

export function AudioProvider({ children }: { children: ReactNode }) {
  const { sound } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const scopeRef = useRef<MusicScope>("menu");
  const targetVolRef = useRef<number>(VOLUMES.menu);
  const fadeRafRef = useRef<number | null>(null);
  const sfxCtxRef = useRef<AudioContext | null>(null);
  const startedRef = useRef(false);
  const themeRef = useRef<SoundTheme | null>(null);
  const buffersRef = useRef(new Map<string, Promise<AudioBuffer | null>>());

  // Create audio element once
  useEffect(() => {
    const el = new Audio();
    el.preload = "auto";
    el.volume = 0;
    audioRef.current = el;
    playlistRef.current = shuffle(TRACKS);
    indexRef.current = 0;

    const onEnded = () => {
      indexRef.current += 1;
      if (indexRef.current >= playlistRef.current.length) {
        playlistRef.current = shuffle(TRACKS);
        indexRef.current = 0;
      }
      el.src = playlistRef.current[indexRef.current];
      el.play().catch(() => {});
    };
    const FADE_SEC = 2;
    const onTimeUpdate = () => {
      if (!audioRef.current) return;
      const dur = el.duration;
      if (!isFinite(dur) || dur <= 0) return;
      const remaining = dur - el.currentTime;
      const base = targetVolRef.current;
      if (base <= 0) return; // sound off; fadeTo(0) controls volume
      if (remaining <= FADE_SEC) {
        if (fadeRafRef.current) {
          cancelAnimationFrame(fadeRafRef.current);
          fadeRafRef.current = null;
        }
        const v = Math.max(0, base * (remaining / FADE_SEC));
        el.volume = Math.min(1, v);
      }
    };
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.src = playlistRef.current[0];

    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.pause();
      audioRef.current = null;
    };
  }, []);

  const fadeTo = (target: number) => {
    const el = audioRef.current;
    if (!el) return;
    targetVolRef.current = target;
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    const step = () => {
      if (!audioRef.current) return;
      const cur = audioRef.current.volume;
      const t = targetVolRef.current;
      const diff = t - cur;
      if (Math.abs(diff) < 0.01) {
        audioRef.current.volume = t;
        fadeRafRef.current = null;
        if (t === 0) audioRef.current.pause();
        return;
      }
      audioRef.current.volume = Math.max(0, Math.min(1, cur + diff * 0.08));
      fadeRafRef.current = requestAnimationFrame(step);
    };
    fadeRafRef.current = requestAnimationFrame(step);
  };

  // React to sound on/off
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (sound) {
      if (el.paused) el.play().catch(() => {});
      fadeTo(VOLUMES[scopeRef.current]);
    } else {
      fadeTo(0);
    }
  }, [sound]);

  // First user interaction unlock (autoplay policy)
  useEffect(() => {
    const tryStart = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const el = audioRef.current;
      if (el && sound) {
        el.play().catch(() => {});
        fadeTo(VOLUMES[scopeRef.current]);
      }
    };
    window.addEventListener("pointerdown", tryStart, { once: true });
    window.addEventListener("keydown", tryStart, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryStart);
      window.removeEventListener("keydown", tryStart);
    };
  }, [sound]);

  const getSfxCtx = () => {
    if (!sound) return null;
    if (!sfxCtxRef.current) {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        sfxCtxRef.current = new AC();
      } catch {
        return null;
      }
    }
    return sfxCtxRef.current;
  };

  const api = useMemo<AudioApi>(() => {
    const load = (ctx: AudioContext, name: string) => {
      let buf = buffersRef.current.get(name);
      if (!buf) {
        buf = fetch(SFX[name])
          .then((r) => r.arrayBuffer())
          .then((data) => ctx.decodeAudioData(data))
          .catch(() => null);
        buffersRef.current.set(name, buf);
      }
      return buf;
    };
    // Played a touch faster or slower each time, so a sound heard often
    // doesn't feel repeated.
    const play = (name: string, volume = 1) => {
      const ctx = getSfxCtx();
      if (!ctx || !SFX[name]) return;
      if (ctx.state === "suspended") void ctx.resume();
      void load(ctx, name).then((buffer) => {
        if (!buffer) return;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = 0.95 + Math.random() * 0.1;
        const g = ctx.createGain();
        g.gain.value = volume * 0.85;
        src.connect(g).connect(ctx.destination);
        src.start();
      });
    };
    const setTheme = (theme: SoundTheme | null) => {
      themeRef.current = theme;
      // decode the game's sounds now, so the first one plays at once
      const ctx = theme ? getSfxCtx() : null;
      if (ctx && theme) {
        const t = THEMES[theme];
        [...t.tap, ...t.correct, ...t.incorrect, t.win].forEach((n) => void load(ctx, n));
      }
    };
    const themed = (part: "tap" | "correct" | "incorrect") => {
      const theme = themeRef.current;
      const list = theme ? THEMES[theme][part] : [];
      if (!list.length) return false;
      play(pick(list));
      return true;
    };
    const synthClick = () => {
      const ctx = getSfxCtx();
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(620, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.12);
    };
    const playClick = () => {
      if (!themed("tap")) synthClick();
    };
    const playCorrect = () => {
      if (themed("correct")) return;
      const ctx = getSfxCtx();
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.4);
    };
    const playIncorrect = () => {
      if (themed("incorrect")) return;
      const ctx = getSfxCtx();
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(360, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.3);
    };
    const playWin = () => {
      const theme = themeRef.current;
      if (theme) return play(THEMES[theme].win);
      const ctx = getSfxCtx();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = f;
        const t0 = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
        o.connect(g).connect(ctx.destination);
        o.start(t0);
        o.stop(t0 + 0.4);
      });
    };
    const setScope = (scope: MusicScope) => {
      scopeRef.current = scope;
      if (sound) fadeTo(VOLUMES[scope]);
    };
    return { setScope, setTheme, play, playClick, playCorrect, playIncorrect, playWin };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound]);

  // Global UI click — a soft tick on every <button> press on menus. Inside a
  // game its own sounds take over.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      const btn = target.closest("button");
      if (!btn) return;
      if (btn.disabled) return;
      if (themeRef.current) return;
      api.play("ui-click", 0.8);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [api]);

  return <AudioCtx.Provider value={api}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioApi {
  const ctx = useContext(AudioCtx);
  if (!ctx) {
    // Safe no-op fallback for components rendered outside provider (shouldn't happen).
    return {
      setScope: () => {},
      setTheme: () => {},
      play: () => {},
      playClick: () => {},
      playCorrect: () => {},
      playIncorrect: () => {},
      playWin: () => {},
    };
  }
  return ctx;
}

// Gives a game its own sounds while it is on screen.
export function useSoundTheme(theme: SoundTheme) {
  const audio = useAudio();
  useEffect(() => {
    audio.setTheme(theme);
    return () => {
      audio.setTheme(null);
    };
  }, [audio, theme]);
}
