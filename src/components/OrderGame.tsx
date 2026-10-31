import { useEffect, useId, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import type { DifficultyId } from "@/lib/puzzles";
import type { Story } from "@/lib/stories";
import {
  JOURNEY,
  JOURNEY_STOPS,
  MAP_IMAGE,
  MAP_VIEW,
  ORDER_OPTIONS,
  ORDER_ROUNDS,
  ROUTE_PATH,
  addToJourney,
  claimJourney,
  loadJourney,
  resetJourney,
  orderStars,
  pickRound,
} from "@/lib/order";
import { useBackButton } from "@/lib/back-button";
import { BedtimeBackdrop } from "@/components/BedtimeBackdrop";
import {
  BackButton,
  ConfirmCard,
  LevelList,
  MenuScreen,
  ResultCard,
  loadBest,
  saveBest,
  starText,
  ScreenFade,
} from "@/components/GameShell";
import { STORIES } from "@/lib/stories";

import { useImageReady } from "@/lib/use-image-ready";

import orderMap from "@/assets/order-map.webp";

const BEST_KEY = "order-best-v1";

export function OrderGame({ onBack }: { onBack: () => void }) {
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId | null>(null);
  const [best, setBest] = useState(() => loadBest(BEST_KEY));
  const [journey, setJourney] = useState(() => loadJourney());
  // A question waiting for an answer: change to this level, or reset the map.
  const [asking, setAsking] = useState<DifficultyId | "reset" | null>(null);
  const ot = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);

  useBackButton(level !== null, () => {
    setJourney(loadJourney());
    setLevel(null);
  });

  const play = (id: DifficultyId) => {
    setJourney(claimJourney(id));
    setLevel(id);
  };

  // Another level's walk would mix up the map, so ask before wiping it.
  const pick = (id: DifficultyId) => {
    if (journey.found.size > 0 && journey.level && journey.level !== id) setAsking(id);
    else play(id);
  };

  if (level) {
    return (
      <OrderBoard
        key={level}
        level={level}
        onExit={() => {
          setJourney(loadJourney());
          setLevel(null);
        }}
        onComplete={(stars) => setBest(saveBest(BEST_KEY, level, stars))}
      />
    );
  }

  return (
    <MenuScreen
      title={t("game.order")}
      subtitle={ot("order.instruction")}
      background={orderMap}
      blur
      position="center top"
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <div className="paint-box paint-long paint-thin mb-5 px-4 py-3">
        <p className="text-center text-sm font-semibold text-foreground/80">
          🗺️ {ot("order.journey", { n: journey.found.size, total: JOURNEY.length })}
        </p>
        {journey.level && journey.found.size > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {ot("order.mapLevel", { level: t(`diff.${journey.level}`) })}
          </p>
        )}
        <div className="relative mx-auto mt-2 h-[56dvh] max-h-[36rem] min-h-[18rem]">
          <JourneyMap found={journey.found} />
        </div>
        {journey.found.size > 0 && (
          <button
            onClick={() => setAsking("reset")}
            className="mx-auto mt-3 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm transition active:scale-95"
          >
            <span aria-hidden>↺</span>
            {ot("order.resetMap")}
          </button>
        )}
      </div>
      <LevelList
        describe={(id) => ot("order.optionsCount", { n: ORDER_OPTIONS[id] })}
        picture={(id) => {
          // A little fan of as many paintings as the level shows.
          const n = ORDER_OPTIONS[id];
          return (
            <span className="absolute inset-0 bg-[oklch(0.93_0.04_62)]">
              {STORIES.slice(0, n).map((s, i) => (
                <img
                  key={s.slug}
                  src={s.thumb}
                  alt=""
                  className="absolute top-3 h-[72%] w-auto rounded-md border-2 border-white shadow"
                  style={{
                    left: `${8 + (i * 56) / Math.max(1, n - 1)}%`,
                    transform: `rotate(${(i - (n - 1) / 2) * 7}deg)`,
                  }}
                />
              ))}
            </span>
          );
        }}
        best={(id) => best[id] ?? 0}
        onPick={pick}
      />
      {asking && (
        <ConfirmCard
          icon="🗺️"
          text={asking === "reset" ? ot("order.resetConfirm") : ot("order.levelChange")}
          confirmLabel={asking === "reset" ? ot("order.reset") : ot("order.changeLevel")}
          cancelLabel={ot("order.cancel")}
          onConfirm={() => {
            if (asking === "reset") {
              setJourney(resetJourney(journey.level));
            } else {
              resetJourney(asking);
              play(asking);
            }
            setAsking(null);
          }}
          onCancel={() => setAsking(null)}
        />
      )}
    </MenuScreen>
  );
}

// ---------- The parchment map with every story's stop on the path ----------
const STOP_R = 30; // a found story's picture, in map pixels
const DOT_R = 11; // a stop still waiting for its story

function JourneyMap({ found, fresh = null }: { found: Set<string>; fresh?: string | null }) {
  const { lang } = useSettings();
  const ids = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [label, setLabel] = useState<{ story: Story; x: number; y: number } | null>(null);
  const ready = useImageReady(orderMap);
  const last = JOURNEY.length - 1;

  const show = (story: Story, e: React.MouseEvent<SVGGElement>) => {
    const wrap = wrapRef.current?.getBoundingClientRect();
    const stop = e.currentTarget.getBoundingClientRect();
    if (!wrap) return;
    const x = stop.left + stop.width / 2 - wrap.left;
    setLabel({
      story,
      // Keep the bubble inside the map horizontally.
      x: Math.min(Math.max(x, 70), wrap.width - 70),
      y: stop.top - wrap.top,
    });
  };

  return (
    <div ref={wrapRef} className="absolute inset-0" onClick={() => setLabel(null)}>
      <svg
        viewBox={`${MAP_VIEW.x} ${MAP_VIEW.y} ${MAP_VIEW.w} ${MAP_VIEW.h}`}
        preserveAspectRatio="xMidYMid meet"
        className={`h-full w-full drop-shadow-[0_10px_18px_oklch(0.3_0.05_50/0.35)] transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <defs>
          <clipPath id={`${ids}-frame`}>
            <rect x={MAP_VIEW.x} y={MAP_VIEW.y} width={MAP_VIEW.w} height={MAP_VIEW.h} rx="40" />
          </clipPath>
          <clipPath id={`${ids}-round`} clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${ids}-frame)`}>
          <image href={orderMap} width={MAP_IMAGE.w} height={MAP_IMAGE.h} />
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="oklch(0.52 0.1 45 / 0.7)"
            strokeWidth="8"
            strokeDasharray="22 18"
            strokeLinecap="round"
          />
          {JOURNEY.map((s, i) => {
            const [x, y] = JOURNEY_STOPS[i];
            const isFound = found.has(s.slug);
            return (
              <g key={s.slug} transform={`translate(${x} ${y})`}>
                <g
                  data-stop={s.slug}
                  className={isFound ? "cursor-pointer" : ""}
                  onClick={(e) => {
                    if (!isFound) return;
                    e.stopPropagation();
                    show(s, e);
                  }}
                >
                  {/* Generous, invisible tap target */}
                  <circle r={STOP_R} fill="transparent" />
                  {isFound ? (
                    <g
                      className={fresh === s.slug ? "animate-in zoom-in-50 duration-500" : ""}
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    >
                      <circle
                        r={STOP_R + 4}
                        fill={fresh === s.slug ? "oklch(0.84 0.13 80)" : "white"}
                      />
                      <image
                        href={s.thumb}
                        x={-STOP_R}
                        y={-STOP_R}
                        width={2 * STOP_R}
                        height={2 * STOP_R}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#${ids}-round)`}
                      />
                    </g>
                  ) : i === last ? null : (
                    // The last stop is the X itself.
                    <circle
                      r={DOT_R}
                      fill="oklch(0.56 0.09 50)"
                      stroke="oklch(0.96 0.03 80)"
                      strokeWidth="4"
                    />
                  )}
                </g>
              </g>
            );
          })}
          {fresh && found.has(fresh) && (
            <circle
              key={fresh}
              cx={JOURNEY_STOPS[JOURNEY.findIndex((s) => s.slug === fresh)][0]}
              cy={JOURNEY_STOPS[JOURNEY.findIndex((s) => s.slug === fresh)][1]}
              r={STOP_R + 6}
              fill="none"
              stroke="oklch(0.84 0.13 80)"
              strokeWidth="6"
              className="pointer-events-none animate-ping"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animationIterationCount: 2,
              }}
            />
          )}
        </g>
      </svg>

      {label && (
        <div
          className="pointer-events-none absolute z-10 w-36 -translate-x-1/2 -translate-y-full pb-2 animate-in fade-in zoom-in-95 duration-200"
          style={{ left: label.x, top: label.y }}
        >
          <div className="paint-box paint-square paint-solid paint-thin flex flex-col items-center gap-1 p-3 text-center">
            <img src={label.story.thumb} alt="" className="h-20 w-16 rounded-lg object-cover" />
            <span className="text-xs font-semibold leading-tight text-foreground">
              {localizeSceneTitle(label.story.slug, lang)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- One game: 10 rounds of "which came first?" ----------
function OrderBoard({
  level,
  onExit,
  onComplete,
}: {
  level: DifficultyId;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const { lang, t } = useSettings();
  const audio = useAudio();
  const ot = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const count = ORDER_OPTIONS[level];

  const seen = useRef(new Set<string>());
  const newRound = () => {
    const r = pickRound(count, seen.current);
    r.forEach((s) => seen.current.add(s.slug));
    return r;
  };

  const [round, setRound] = useState(1);
  const [cards, setCards] = useState<Story[]>(newRound);
  const [answer, setAnswer] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);
  const [found, setFound] = useState(() => loadJourney().found);
  const [fresh, setFresh] = useState<string | null>(null);
  // The picked painting flying from its card to its stop on the map.
  const [flight, setFlight] = useState<{
    image: string;
    from: DOMRect;
    to: { x: number; y: number; size: number };
    go: boolean;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const cardImages = useRef(new Map<string, HTMLElement>());
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const earliest = cards.reduce((a, b) => (b.era < a.era ? b : a), cards[0]);
  // 1, 2, 3... in Bible order, shown once the child has answered.
  const rank = (s: Story) => [...cards].sort((a, b) => a.era - b.era).indexOf(s) + 1;

  const nextRound = (total: number) => {
    if (round === ORDER_ROUNDS) {
      audio.playWin();
      setFinished(true);
      onComplete(orderStars(total));
      return;
    }
    setRound((r) => r + 1);
    setCards(newRound());
    setAnswer(null);
  };

  // Send the right painting to its place on the path.
  const flyToMap = (s: Story, total: number) => {
    const card = cardImages.current.get(s.slug);
    const stop = mapRef.current?.querySelector(`[data-stop="${s.slug}"]`);
    const svg = mapRef.current?.querySelector("svg");
    const place = () => {
      setFound(addToJourney(level, s.slug).found);
      setFresh(s.slug);
      setFlight(null);
      later(() => nextRound(total), 1100);
    };
    if (!card || !stop || !svg) {
      place();
      return;
    }
    const box = svg.getBoundingClientRect();
    const scale = Math.min(box.width / MAP_VIEW.w, box.height / MAP_VIEW.h);
    const r = stop.getBoundingClientRect();
    setFlight({
      image: s.thumb,
      from: card.getBoundingClientRect(),
      to: { x: r.left + r.width / 2, y: r.top + r.height / 2, size: 2 * (STOP_R + 4) * scale },
      go: false,
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setFlight((f) => (f ? { ...f, go: true } : f))),
    );
    later(place, 850);
  };

  const choose = (s: Story) => {
    if (answer) return;
    setAnswer(s.slug);
    setFresh(null);
    const ok = s === earliest;
    const total = right + (ok ? 1 : 0);
    if (ok) {
      setRight(total);
      audio.playCorrect();
      later(() => flyToMap(s, total), 550);
    } else {
      audio.playIncorrect();
      later(() => nextRound(total), 2600);
    }
  };

  const replay = () => {
    seen.current = new Set();
    setRound(1);
    setRight(0);
    setCards(newRound());
    setAnswer(null);
    setFresh(null);
    setFinished(false);
  };

  const wasRight = answer !== null && answer === earliest.slug;
  const cols = count <= 4 ? count : 3;
  const tall = count <= 3;

  return (
    <div className="theme-bedtime relative min-h-[100dvh] w-full">
      <ScreenFade />
      <BedtimeBackdrop image={orderMap} position="center top" fadeEnd={0} blur />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 py-3 md:py-5">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={ot("order.levels")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl text-[oklch(0.98_0.02_85)] [text-shadow:0_1px_6px_oklch(0.3_0.06_50/0.6)]">
            {t("game.order")} · {t(`diff.${level}`)}
          </h1>
          <span className="shrink-0 rounded-full bg-card/90 px-3 py-1 text-sm font-semibold tabular-nums text-foreground/80 shadow-sm">
            ✓ {right}
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-6">
          <div className="flex min-h-[36dvh] flex-1 flex-col">
            <p className="mx-auto mb-1.5 rounded-full bg-card/85 px-3 py-0.5 text-xs font-semibold text-foreground/80 shadow-sm">
              🗺️ {ot("order.journey", { n: found.size, total: JOURNEY.length })}
            </p>
            <div ref={mapRef} className="relative min-h-0 flex-1">
              <JourneyMap found={found} fresh={fresh} />
            </div>
          </div>

          <div className="shrink-0 md:flex md:w-[26rem] md:flex-col md:justify-center">
            <div className="paint-box paint-wide px-4 pb-4 pt-3">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {ot("order.round", { n: round, total: ORDER_ROUNDS })}
              </p>
              <p
                className={`min-h-[1.5rem] pb-2 text-center text-base font-semibold ${
                  answer
                    ? wasRight
                      ? "text-[oklch(0.5_0.13_150)]"
                      : "text-[oklch(0.55_0.17_25)]"
                    : "text-foreground"
                }`}
              >
                {answer
                  ? wasRight
                    ? ot("order.correct")
                    : ot("order.wrong")
                  : ot("order.instruction")}
              </p>

              <div
                className={`mx-auto grid gap-2 ${count === 2 ? "max-w-[19rem]" : count === 3 ? "max-w-[24rem]" : ""}`}
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {cards.map((s) => {
                  const isEarliest = s === earliest;
                  const isChosen = answer === s.slug;
                  return (
                    <button
                      key={s.slug}
                      onClick={() => choose(s)}
                      disabled={answer !== null}
                      className={`flex flex-col overflow-hidden rounded-2xl bg-card p-1 text-left shadow-md transition active:scale-[0.97] ${
                        answer && isEarliest ? "ring-4 ring-[oklch(0.6_0.14_150)]" : ""
                      } ${answer && isChosen && !isEarliest ? "piece-shake ring-4 ring-[oklch(0.62_0.18_25)]" : ""} ${
                        answer && !isEarliest && !isChosen ? "opacity-75" : ""
                      }`}
                    >
                      <span
                        ref={(el) => {
                          if (el) cardImages.current.set(s.slug, el);
                          else cardImages.current.delete(s.slug);
                        }}
                        className={`relative w-full overflow-hidden rounded-xl ${tall ? "aspect-[7/9]" : "aspect-square"}`}
                      >
                        <img
                          src={s.thumb}
                          alt=""
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                        {answer && (
                          <span
                            className={`absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full text-sm font-bold text-white shadow animate-in zoom-in-50 ${
                              isEarliest
                                ? "bg-[oklch(0.55_0.13_150)]"
                                : "bg-[oklch(0.31_0.08_262/0.85)]"
                            }`}
                          >
                            {rank(s)}
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 px-0.5 pt-1 text-center text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                        {localizeSceneTitle(s.slug, lang)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {flight && (
        <img
          src={flight.image}
          alt=""
          aria-hidden
          className="pointer-events-none fixed z-50 object-cover shadow-xl transition-all duration-700 ease-in-out motion-reduce:transition-none"
          style={
            flight.go
              ? {
                  left: flight.to.x - flight.to.size / 2,
                  top: flight.to.y - flight.to.size / 2,
                  width: flight.to.size,
                  height: flight.to.size,
                  borderRadius: "50%",
                  border: "3px solid white",
                }
              : {
                  left: flight.from.left,
                  top: flight.from.top,
                  width: flight.from.width,
                  height: flight.from.height,
                  borderRadius: 12,
                  border: "3px solid white",
                }
          }
        />
      )}

      {finished && (
        <ResultCard
          top={starText(orderStars(right))}
          title={ot("order.result", { n: right, total: ORDER_ROUNDS })}
          detail={`🗺️ ${ot("order.journey", { n: found.size, total: JOURNEY.length })}`}
          replayLabel={ot("order.replay")}
          onReplay={replay}
          backLabel={ot("order.levels")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
