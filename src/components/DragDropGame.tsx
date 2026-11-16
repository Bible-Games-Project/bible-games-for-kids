import { useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio, useSoundTheme } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle, localizeVerse } from "@/lib/scenes-i18n";
import {
  DRAG_STORIES,
  PAINTING_RATIO,
  loadDoneStories,
  markStoryDone,
  pieceBackground,
  pieceCountFor,
  piecesFor,
  shapesFor,
  type DragStory,
} from "@/lib/dragdrop";
import type { StoryShape } from "@/lib/story-shapes";
import type { DifficultyId } from "@/lib/puzzles";
import type { Story } from "@/lib/stories";
import { useBackButton } from "@/lib/back-button";
import {
  BackButton,
  MenuScreen,
  ResultCard,
  StoryPicker,
  ScreenFade,
} from "@/components/GameShell";

import dragdropBg from "@/assets/dragdrop-bg.webp";
import { StarIcon } from "@/components/Icons";

export function DragDropGame({ onBack }: { onBack: () => void }) {
  useSoundTheme("dragdrop");
  const { lang, t } = useSettings();
  const [level, setLevel] = useState<DifficultyId>("easy");
  const [story, setStory] = useState<Story | null>(null);
  const [done, setDone] = useState(() => loadDoneStories());
  const dt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);

  useBackButton(story !== null, () => setStory(null));

  if (story) {
    return (
      <DragDropBoard
        key={`${level}:${story.slug}`}
        item={{ story, pieces: piecesFor(story, level) }}
        shapes={shapesFor(story, level)}
        onExit={() => setStory(null)}
        onComplete={() => setDone(markStoryDone(level, story.slug))}
      />
    );
  }

  return (
    <MenuScreen
      title={t("game.dragdrop")}
      subtitle={dt("dd.instruction")}
      background={dragdropBg}
      onBack={onBack}
      backLabel={t("select.back")}
      wide
    >
      <StoryPicker
        level={level}
        onLevel={setLevel}
        describe={(id) => dt("dd.piecesCount", { n: pieceCountFor(id) })}
        stories={DRAG_STORIES}
        badge={(s) =>
          done[level]?.includes(s.slug) ? (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-card text-base text-[var(--color-gold)] shadow">
              <StarIcon />
            </span>
          ) : null
        }
        onPick={setStory}
      />
    </MenuScreen>
  );
}

// ---------- The board: drag the round pieces back into the painting ----------
// Paintings with cut-outs (story-shapes.ts) use whole things instead: the painting
// shows each one as a dark silhouette and the child drops the coloured
// cut-out onto it.
function DragDropBoard({
  item,
  shapes,
  onExit,
  onComplete,
}: {
  item: DragStory;
  shapes?: StoryShape[];
  onExit: () => void;
  onComplete: () => void;
}) {
  const { lang } = useSettings();
  const { playCorrect, playIncorrect, playWin } = useAudio();
  const dt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const { story } = item;
  const pieces = shapes ?? item.pieces;
  // Centre of piece i in % of the painting (x of its width, y of its height)
  // and its size in % of the width.
  const centre = (i: number) => {
    if (shapes) {
      const p = shapes[i];
      return { x: p.x + p.w / 2, y: p.y + p.h / 2, size: Math.max(p.w, p.h / PAINTING_RATIO) };
    }
    const p = item.pieces[i];
    return { x: p.x, y: p.y, size: 2 * p.r };
  };

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [justPlaced, setJustPlaced] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ i: number; x: number; y: number } | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);

  // Shuffled tray order, new each round.
  const tray = useMemo(() => {
    const a = pieces.map((_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, pieces]);

  const begin = (i: number, e: React.PointerEvent) => {
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    setDrag({ i, x: e.clientX, y: e.clientY });
  };

  const moveTo = (e: React.PointerEvent) => {
    if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };

  const drop = () => {
    if (!drag) return;
    const board = boardRef.current;
    const p = centre(drag.i);
    if (board) {
      const rect = board.getBoundingClientRect();
      const cx = rect.left + (p.x / 100) * rect.width;
      const cy = rect.top + (p.y / 100) * rect.height;
      const radius = (p.size / 200) * rect.width;
      // Generous snap: anywhere over the socket (and a bit around it); small
      // shapes still get a finger-sized target.
      if (Math.hypot(drag.x - cx, drag.y - cy) <= Math.max(radius * 1.4, shapes ? 36 : 0)) {
        const next = new Set(placed).add(drag.i);
        setPlaced(next);
        setJustPlaced(drag.i);
        setDrag(null);
        playCorrect();
        if (next.size === pieces.length) {
          window.setTimeout(() => {
            playWin();
            setFinished(true);
            onComplete();
          }, 500);
        }
        return;
      }
    }
    playIncorrect();
    setWrong(drag.i);
    window.setTimeout(() => setWrong(null), 450);
    setDrag(null);
  };

  const replay = () => {
    setPlaced(new Set());
    setJustPlaced(null);
    setFinished(false);
    setRound((r) => r + 1);
  };

  const boardWidth = boardRef.current?.getBoundingClientRect().width ?? 320;
  // Smaller tray pieces when there are many, so the tray stays compact.
  const trayPiece =
    pieces.length <= 5 ? "h-20 w-20" : pieces.length <= 7 ? "h-16 w-16" : "h-14 w-14";

  return (
    <div className="min-h-[100dvh] w-full bg-[oklch(0.97_0.02_75)]">
      <ScreenFade />
      {/* On a wide screen the painting fills the screen's height and the
          title, the instruction and the tray stand beside it. */}
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 py-4 wide:grid wide:h-[100dvh] wide:max-w-none wide:grid-cols-[20rem_auto] wide:grid-rows-[auto_auto_1fr] wide:justify-center wide:gap-x-8 xl:wide:grid-cols-[24rem_auto]">
        <header className="flex items-center gap-3 pb-2 wide:col-start-1 wide:row-start-1">
          <BackButton onClick={onExit} label={dt("dd.backStories")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">
            {localizeSceneTitle(story.slug, lang)}
          </h1>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
            {placed.size}/{pieces.length}
          </span>
        </header>
        <p className="pb-2 text-center text-sm text-muted-foreground wide:col-start-1 wide:row-start-2">
          {dt("dd.instruction")}
        </p>

        <div
          ref={boardRef}
          className="relative w-full overflow-hidden rounded-3xl shadow-lg wide:col-start-2 wide:row-span-3 wide:row-start-1 wide:w-[var(--fit-w)] wide:self-center"
          style={{
            aspectRatio: `1 / ${PAINTING_RATIO}`,
            ["--fit-w" as string]: `min(calc(100vw - 26rem), calc((100dvh - 2rem) / ${PAINTING_RATIO}))`,
          }}
          onPointerMove={moveTo}
          onPointerUp={drop}
          onPointerCancel={drop}
        >
          <img
            src={story.image}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
          {shapes?.map((p, i) => {
            const isPlaced = placed.has(i);
            return (
              <img
                key={i}
                src={p.src}
                alt=""
                draggable={false}
                className={`pointer-events-none absolute select-none transition-[filter,opacity] duration-500 ${
                  isPlaced
                    ? justPlaced === i
                      ? "drop-shadow-[0_0_6px_oklch(0.9_0.13_85)]"
                      : ""
                    : "opacity-85 brightness-0"
                }`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` }}
              />
            );
          })}
          {!shapes &&
            item.pieces.map((p, i) => {
              const isPlaced = placed.has(i);
              return (
                <span
                  key={i}
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ${
                    isPlaced
                      ? justPlaced === i
                        ? "ring-4 ring-[oklch(0.84_0.115_78)]"
                        : "ring-2 ring-white/70"
                      : "border-[3px] border-dashed border-white bg-white/45 shadow-[inset_0_2px_10px_oklch(0.3_0.04_60/0.35)] backdrop-blur-[3px]"
                  }`}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${2 * p.r}%`,
                    aspectRatio: "1",
                  }}
                />
              );
            })}
        </div>

        {/* Tray: the pieces waiting to go back */}
        <div className="mt-auto flex flex-wrap items-center justify-center gap-3 px-2 pt-5 pb-2 wide:col-start-1 wide:row-start-3 wide:mt-0 wide:content-center">
          {tray
            .filter((i) => !placed.has(i))
            .map((i, k) => (
              <button
                key={i}
                aria-label={dt("dd.piece", { n: i + 1 })}
                onPointerDown={(e) => begin(i, e)}
                onPointerMove={moveTo}
                onPointerUp={drop}
                onPointerCancel={drop}
                onDragStart={(e) => e.preventDefault()}
                className={`${trayPiece} shrink-0 touch-none wide:h-24 wide:w-24 select-none transition ${
                  shapes
                    ? "relative rounded-2xl bg-white/70 shadow-[0_6px_14px_oklch(0.35_0.04_60/0.25)]"
                    : "rounded-full border-4 border-white shadow-[0_8px_16px_oklch(0.35_0.04_60/0.3)]"
                } ${drag?.i === i ? "opacity-25" : ""} ${wrong === i ? "piece-shake" : ""}`}
                style={{
                  ...(shapes ? {} : pieceBackground(story.image, item.pieces[i])),
                  transform: `rotate(${((i * 7 + k * 5) % 13) - 6}deg)`,
                  touchAction: "none",
                }}
              >
                {shapes && (
                  <img
                    src={shapes[i].src}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain p-1.5 drop-shadow-[0_3px_3px_oklch(0.3_0.04_60/0.45)]"
                  />
                )}
              </button>
            ))}
        </div>
      </div>

      {/* The piece being dragged, at the size of its spot on the painting */}
      {drag && shapes && (
        <img
          src={shapes[drag.i].src}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-[0_12px_14px_oklch(0.35_0.04_60/0.45)]"
          style={{
            left: drag.x,
            top: drag.y,
            width: Math.max(56, (shapes[drag.i].w * boardWidth) / 100),
          }}
        />
      )}
      {drag && !shapes && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_16px_24px_oklch(0.35_0.04_60/0.4)]"
          style={{
            ...pieceBackground(story.image, item.pieces[drag.i]),
            left: drag.x,
            top: drag.y,
            width: Math.max(56, (2 * item.pieces[drag.i].r * boardWidth) / 100),
            aspectRatio: "1",
          }}
        />
      )}

      {finished && (
        <ResultCard
          top="🎉"
          title={dt("dd.complete")}
          detail={<span className="italic">{localizeVerse(story.verse, lang)}</span>}
          replayLabel={dt("dd.replay")}
          onReplay={replay}
          backLabel={dt("dd.backStories")}
          onBack={onExit}
        />
      )}
    </div>
  );
}
