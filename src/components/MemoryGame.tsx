import { useEffect, useRef, useState, type RefObject } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { memText } from "@/lib/memory-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import {
  MEMORY_LEVELS,
  buildDeck,
  computeMemoryStars,
  findScene,
  loadMemoryProgress,
  saveMemoryResult,
  type MemoryCard,
  type MemoryLevel,
} from "@/lib/memory";

import memoryBg from "@/assets/memory-bedtime.webp";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import { BackButton, ScreenFade } from "@/components/GameShell";
import { TOKEN_HEX, TOKEN_ORDER, Token } from "@/components/Token";
import { useBackButton } from "@/lib/back-button";
import cardBack from "@/assets/ui/card-back.webp";
import arrowArt from "@/assets/ui/arrow.webp";

// Up to four players share the board, each with the colour of their round
// token for the turn marker, the scoreboard and the pairs they find.
const PLAYER_COLORS = TOKEN_ORDER.map((c) => TOKEN_HEX[c]);
const PLAYERS_KEY = "memory-players";

const loadPlayers = (): number => {
  try {
    const n = Number(localStorage.getItem(PLAYERS_KEY));
    return n >= 1 && n <= 4 ? n : 1;
  } catch {
    return 1;
  }
};

const formatTime = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

// Static class names so Tailwind generates them. The width class is shared
// by the pinned header and the board so both line up.
const WIDE_LAYOUT: Record<MemoryLevel["wideCols"], { cols: string; width: string }> = {
  3: { cols: "sm:grid-cols-3", width: "sm:max-w-xl" },
  4: { cols: "sm:grid-cols-4", width: "sm:max-w-2xl" },
  6: { cols: "sm:grid-cols-6", width: "sm:max-w-4xl" },
};

// The face-down side of every card: terracotta paper with a soft dot
// pattern and a cream cross.
function CardBack({ className = "" }: { className?: string }) {
  return (
    <img
      src={cardBack}
      alt=""
      draggable={false}
      className={`select-none drop-shadow-[0_3px_4px_oklch(0.3_0.06_50/0.35)] ${className}`}
    />
  );
}

// A face-up card: the painting set inside the same painted frame as the back.
function CardFace({ src, className = "" }: { src: string; className?: string }) {
  return (
    <span className={`drop-shadow-[0_3px_4px_oklch(0.3_0.06_50/0.35)] ${className}`}>
      <img src={cardBack} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-x-[7.5%] inset-y-[5.2%] h-[89.6%] w-[85%] select-none rounded-[10%/6.5%] object-cover"
      />
    </span>
  );
}

export function MemoryGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<MemoryLevel | null>(null);
  const [players, setPlayers] = useState<number | null>(null);
  const [progress, setProgress] = useState(() => loadMemoryProgress());

  const mt = (k: string) => memText(lang, k);

  // Open at the top even if the home screen was scrolled to reach the tile.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const backToLevels = () => {
    window.scrollTo(0, 0);
    setPlayers(null);
    setLevel(null);
  };
  useBackButton(level !== null, backToLevels);

  if (level && players === null) {
    return (
      <PlayerPicker
        level={level}
        onBack={backToLevels}
        onPick={(n) => {
          try {
            localStorage.setItem(PLAYERS_KEY, String(n));
          } catch {
            /* ignore */
          }
          setPlayers(n);
        }}
      />
    );
  }

  if (level && players !== null) {
    return (
      <MemoryBoard
        level={level}
        players={players}
        onExit={backToLevels}
        onComplete={(stars) => setProgress(saveMemoryResult(level.id, stars))}
      />
    );
  }

  // ---------- Level select ----------
  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <ScreenFade />
      <BedtimeBackdrop image={memoryBg} position="center 30%" fadeEnd={30} />
      <div className="relative z-10 min-h-[100dvh] w-full">
        <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
          <BackButton onClick={onBack} label={t("select.back")} />
          <h1 className="font-display text-2xl sm:text-3xl">{mt("mem.chooseLevel")}</h1>
        </header>
        <p className="mx-auto max-w-3xl px-6 pt-1 text-sm italic text-muted-foreground">
          {mt("mem.instruction")}
        </p>
        <main className="mx-auto grid max-w-3xl gap-4 px-4 pb-12 pt-4">
          {MEMORY_LEVELS.map((lv) => {
            const best = progress[lv.id] ?? 0;
            const cover = findScene(lv.cover);
            return (
              <button
                key={lv.id}
                onClick={() => {
                  window.scrollTo(0, 0);
                  setLevel(lv);
                }}
                className="paint-box paint-wide group flex w-full items-center gap-4 overflow-hidden p-4 text-left transition active:scale-[0.99]"
              >
                {/* A small fan of game cards: one still face down and a
                    matched pair showing this level's painting. */}
                <span className="relative h-28 w-36 shrink-0" aria-hidden>
                  <CardBack className="absolute left-0 top-4 aspect-[13/20] w-14 -rotate-12" />
                  {cover &&
                    [
                      "left-[38px] top-1 -rotate-2",
                      "left-[74px] top-4 rotate-[11deg] transition-transform group-hover:rotate-[15deg]",
                    ].map((pos) => (
                      <CardFace key={pos} src={cover.thumb} className={`absolute aspect-[13/20] w-14 ${pos}`} />
                    ))}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl leading-snug">{t(`diff.${lv.id}`)}</h2>
                  <p className="text-[11px] font-semibold text-muted-foreground/90">{t(`diff.${lv.id}.age`)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {mt("mem.pairsCount").replace("{n}", String(lv.pairs))}
                  </p>
                  <span className="mt-1.5 block text-base tracking-wider" aria-label={`${best} of 3 stars`}>
                    <span className="text-[var(--color-gold)]">{"★".repeat(best)}</span>
                    <span className="text-foreground/20">{"★".repeat(3 - best)}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </main>
      </div>
    </div>
  );
}

// Players are shown by the round tokens shared with the board games.
function PlayerDot({ index, size = 28 }: { index: number; size?: number }) {
  return <Token color={TOKEN_ORDER[index]} size={size} label={index + 1} />;
}

// ---------- How many players? ----------
function PlayerPicker({
  level,
  onBack,
  onPick,
}: {
  level: MemoryLevel;
  onBack: () => void;
  onPick: (players: number) => void;
}) {
  const { lang, t } = useSettings();
  const mt = (k: string) => memText(lang, k);
  const last = loadPlayers();

  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <ScreenFade />
      <BedtimeBackdrop image={memoryBg} position="center 30%" fadeEnd={30} />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pt-6 pb-10">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onBack} label={mt("mem.levels")} />
          <h1 className="font-display text-2xl">
            {t("game.memory")} · {t(`diff.${level.id}`)}
          </h1>
        </header>
        <h2 className="mt-6 text-center font-display text-3xl">{mt("mem.howManyPlayers")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => onPick(n)}
              className={`paint-box paint-square flex aspect-square flex-col items-center justify-center gap-3 p-4 transition active:scale-[0.97] ${
                n === last ? "paint-picked" : ""
              }`}
            >
              <span className="flex flex-wrap justify-center gap-1.5">
                {Array.from({ length: n }, (_, i) => (
                  <PlayerDot key={i} index={i} size={40} />
                ))}
              </span>
              <span className="text-lg font-semibold">
                {n === 1 ? mt("mem.playersOne") : mt("mem.playersMany").replace("{n}", String(n))}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Big round arrow for children: scrolls down to the next cards while there
// are more below, and back to the top once the bottom is reached. Touch
// swipes, the mouse wheel and the keyboard arrows scroll the page as usual.
function ScrollArrow({
  watch,
  downLabel,
  upLabel,
}: {
  watch: RefObject<HTMLElement | null>;
  downLabel: string;
  upLabel: string;
}) {
  const [dir, setDir] = useState<"down" | "up" | null>(null);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max < 24) return setDir(null);
      setDir(window.scrollY >= max - 24 ? "up" : "down");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Card images load after the first paint and grow the board.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (ro && watch.current) ro.observe(watch.current);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [watch]);

  if (!dir) return null;

  const go = () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (dir === "up") window.scrollTo({ top: 0, behavior });
    else window.scrollBy({ top: Math.round(window.innerHeight * 0.6), behavior });
  };

  return (
    <button
      onClick={go}
      aria-label={dir === "down" ? downLabel : upLabel}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-30 grid h-16 w-16 place-items-center transition active:scale-90"
    >
      <img
        src={arrowArt}
        alt=""
        draggable={false}
        className={`h-full w-full select-none drop-shadow-[0_4px_6px_oklch(0.3_0.06_50/0.4)] ${
          dir === "up" ? "-rotate-90" : "rotate-90"
        }`}
      />
    </button>
  );
}

// ---------- The matching-pairs board ----------
function MemoryBoard({
  level,
  players,
  onExit,
  onComplete,
}: {
  level: MemoryLevel;
  players: number;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const mt = (k: string) => memText(lang, k);

  const [deck, setDeck] = useState<MemoryCard[]>(() => buildDeck(level.pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  // Pairs found so far: story slug -> index of the player who found it.
  const [matched, setMatched] = useState<Map<string, number>>(new Map());
  const [turn, setTurn] = useState(0);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const busyRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const wide = WIDE_LAYOUT[level.wideCols];

  // Boost music volume while playing; restore menu volume on exit.
  useEffect(() => {
    audio.setScope("puzzle");
    return () => audio.setScope("menu");
  }, [audio]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (startedAt === null || done) return;
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [startedAt, done]);

  const later = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  };

  const multi = players > 1;
  const playerName = (i: number) => mt("mem.player").replace("{n}", String(i + 1));
  const scores = Array.from({ length: players }, (_, i) =>
    [...matched.values()].filter((p) => p === i).length,
  );
  const best = Math.max(...scores);
  const winners = scores.map((sc, i) => (sc === best ? i : -1)).filter((i) => i >= 0);

  const flip = (index: number) => {
    const card = deck[index];
    if (busyRef.current || done || matched.has(card.scene.slug) || flipped.includes(index)) return;
    audio.playClick();
    if (startedAt === null) setStartedAt(Date.now());

    if (flipped.length === 0) {
      setFlipped([index]);
      return;
    }

    const first = deck[flipped[0]];
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (first.scene.slug === card.scene.slug) {
      // A pair: the same player keeps the turn.
      const next = new Map(matched);
      next.set(card.scene.slug, turn);
      setMatched(next);
      setFlipped([]);
      setLastFound(card.scene.slug);
      audio.playCorrect();
      if (next.size === level.pairs) {
        busyRef.current = true;
        const earned = computeMemoryStars(level.pairs, nextMoves);
        later(() => {
          setElapsed(Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000));
          setStars(earned);
          setDone(true);
          busyRef.current = false;
          audio.playWin();
          if (!multi) onComplete(earned);
        }, 600);
      }
      return;
    }

    // Not a pair — let the child see both paintings, then turn them back.
    setFlipped([flipped[0], index]);
    busyRef.current = true;
    later(() => audio.playIncorrect(), 450);
    later(() => {
      setFlipped([]);
      setTurn((p) => (p + 1) % players);
      busyRef.current = false;
    }, 1100);
  };

  const restart = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
    busyRef.current = false;
    setDeck(buildDeck(level.pairs));
    setFlipped([]);
    setMatched(new Map());
    setTurn(0);
    setLastFound(null);
    setMoves(0);
    setStartedAt(null);
    setElapsed(0);
    setStars(0);
    setDone(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <ScreenFade />
      {/* Header stays pinned while the board scrolls underneath it. */}
      <div className="sticky top-[env(safe-area-inset-top,0px)] z-20 px-2 pb-1 pt-2">
        <div className={`paint-box paint-long mx-auto w-full max-w-lg px-5 pt-4 ${wide.width}`}>
          <header className="flex items-center gap-3 pb-2">
            <BackButton onClick={onExit} label={mt("mem.levels")} />
            <h1 className="min-w-0 flex-1 truncate font-display text-xl">
              {t("game.memory")} · {t(`diff.${level.id}`)}
            </h1>
            {!multi && (
              <div className="flex shrink-0 gap-3 text-right text-xs text-muted-foreground tabular-nums">
                <span>
                  {mt("mem.moves")}
                  <span className="block text-base font-bold text-foreground">{moves}</span>
                </span>
                <span>
                  {mt("mem.time")}
                  <span className="block text-base font-bold text-foreground">{formatTime(elapsed)}</span>
                </span>
              </div>
            )}
          </header>

          {multi && (
            <div className="flex flex-wrap justify-center gap-2 pb-2">
              {scores.map((sc, i) => {
                const active = i === turn && !done;
                return (
                  <span
                    key={i}
                    className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-sm font-semibold shadow-sm transition ${
                      active ? "scale-105 text-white" : "bg-card text-foreground/70"
                    }`}
                    style={active ? { backgroundColor: PLAYER_COLORS[i] } : undefined}
                    aria-current={active ? "true" : undefined}
                  >
                    <PlayerDot index={i} />
                    <span className="tabular-nums">{sc}</span>
                  </span>
                );
              })}
            </div>
          )}

          <p className="flex min-h-[1.5rem] flex-wrap items-center justify-center gap-x-3 pb-3 text-center text-sm text-muted-foreground">
            {lastFound && (
              <span key={lastFound} className="inline-block animate-in fade-in font-semibold text-[oklch(0.45_0.12_70)]">
                ✓ {localizeSceneTitle(lastFound, lang)}
              </span>
            )}
            {multi && !done ? (
              <span className="font-semibold" style={{ color: PLAYER_COLORS[turn] }}>
                {mt("mem.turn").replace("{name}", playerName(turn))}
              </span>
            ) : (
              !lastFound && mt("mem.instruction")
            )}
          </p>
        </div>
      </div>

      {/* Large cards in 3 columns on phones; the page scrolls when they
          don't all fit, so cards never shrink to fit the screen. */}
      <div
        ref={gridRef}
        className={`mx-auto grid w-full max-w-lg grid-cols-3 gap-3 px-4 pb-28 pt-1 sm:gap-4 ${wide.cols} ${wide.width}`}
      >
        {deck.map((card, i) => {
          const finder = matched.get(card.scene.slug);
          const isMatched = finder !== undefined;
          const faceUp = isMatched || flipped.includes(i);
          const title = localizeSceneTitle(card.scene.slug, lang);
          return (
            <button
              key={card.key}
              onClick={() => flip(i)}
              disabled={isMatched}
              aria-label={faceUp ? title : mt("mem.hidden")}
              className="relative aspect-[13/20] w-full [perspective:800px]"
            >
              <span
                className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none"
                style={{ transform: faceUp ? "rotateY(180deg)" : "none" }}
              >
                <CardBack className="absolute inset-0 h-full w-full [backface-visibility:hidden]" />
                <span
                  className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  style={
                    isMatched
                      ? {
                          filter: `drop-shadow(0 0 3px ${multi ? PLAYER_COLORS[finder] : "var(--color-gold)"}) drop-shadow(0 0 7px ${multi ? PLAYER_COLORS[finder] : "var(--color-gold)"})`,
                        }
                      : undefined
                  }
                >
                  <CardFace src={card.scene.thumb} className="absolute inset-0" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!done && (
        <ScrollArrow
          watch={gridRef}
          downLabel={mt("mem.scrollDown")}
          upLabel={mt("mem.scrollUp")}
        />
      )}

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="paint-box paint-square paint-solid w-full max-w-sm p-7 text-center">
            {multi ? (
              <>
                <div className="text-5xl" aria-hidden>
                  🏆
                </div>
                <h2 className="mt-3 font-display text-2xl text-foreground">
                  {winners.length === 1
                    ? mt("mem.wins").replace("{name}", playerName(winners[0]))
                    : mt("mem.tie")}
                </h2>
                <ol className="mt-4 space-y-2 text-left">
                  {scores
                    .map((sc, i) => ({ sc, i }))
                    .sort((a, b) => b.sc - a.sc)
                    .map(({ sc, i }) => (
                      <li key={i} className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2">
                        <PlayerDot index={i} />
                        <span className="flex-1 font-semibold">{playerName(i)}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {sc === 1 ? mt("mem.pairOne") : mt("mem.pairsCount").replace("{n}", String(sc))}
                        </span>
                        <span className="w-5 text-center" aria-hidden>
                          {winners.includes(i) ? "👑" : ""}
                        </span>
                      </li>
                    ))}
                </ol>
              </>
            ) : (
              <>
                <div className="text-5xl">
                  {"⭐".repeat(stars)}
                  {"☆".repeat(3 - stars)}
                </div>
                <h2 className="mt-3 font-display text-2xl text-foreground">{mt("mem.complete")}</h2>
                <p className="mt-2 text-base text-muted-foreground tabular-nums">
                  {mt("mem.moves")}: {moves} · {mt("mem.time")}: {formatTime(elapsed)}
                </p>
              </>
            )}
            <button
              onClick={restart}
              className="mt-5 w-full rounded-2xl bg-card px-5 py-3 text-base font-semibold text-foreground/80 shadow-sm transition active:scale-95"
            >
              {mt("mem.replay")}
            </button>
            <button
              onClick={onExit}
              className="mt-2 w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition active:scale-95"
            >
              {mt("mem.levels")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
