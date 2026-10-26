import { useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
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
  type DragStory,
} from "@/lib/dragdrop";
import type { DifficultyId } from "@/lib/puzzles";
import type { Story } from "@/lib/stories";
import { useBackButton } from "@/lib/back-button";
import { BackButton, MenuScreen, ResultCard, StoryPicker } from "@/components/GameShell";

import homeBg from "@/assets/home-bedtime.webp";

export function DragDropGame({ onBack }: { onBack: () => void }) {
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
        onExit={() => setStory(null)}
        onComplete={() => setDone(markStoryDone(level, story.slug))}
      />
    );
  }

  return (
    <MenuScreen
      title={t("game.dragdrop")}
      subtitle={dt("dd.instruction")}
      background={homeBg}
      onBack={onBack}
      backLabel={t("select.back")}
    >
      <StoryPicker
        level={level}
        onLevel={setLevel}
        describe={(id) => dt("dd.piecesCount", { n: pieceCountFor(id) })}
        stories={DRAG_STORIES}
        badge={(s) =>
          done[level]?.includes(s.slug) ? (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-card text-base text-[var(--color-gold)] shadow">
              ★
            </span>
          ) : null
        }
        onPick={setStory}
      />
    </MenuScreen>
  );
}

// ---------- The board: drag the round pieces back into the painting ----------
function DragDropBoard({
  item,
  onExit,
  onComplete,
}: {
  item: DragStory;
  onExit: () => void;
  onComplete: () => void;
}) {
  const { lang } = useSettings();
  const { playCorrect, playIncorrect, playWin } = useAudio();
  const dt = (k: string, v?: Record<string, string | number>) => gameText(lang, k, v);
  const { story, pieces } = item;

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
    const p = pieces[drag.i];
    if (board) {
      const rect = board.getBoundingClientRect();
      const cx = rect.left + (p.x / 100) * rect.width;
      const cy = rect.top + (p.y / 100) * rect.height;
      const radius = (p.r / 100) * rect.width;
      // Generous snap: anywhere over the socket (and a bit around it).
      if (Math.hypot(drag.x - cx, drag.y - cy) <= radius * 1.4) {
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
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 py-4">
        <header className="flex items-center gap-3 pb-2">
          <BackButton onClick={onExit} label={dt("dd.backStories")} />
          <h1 className="min-w-0 flex-1 truncate font-display text-xl">
            {localizeSceneTitle(story.slug, lang)}
          </h1>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
            {placed.size}/{pieces.length}
          </span>
        </header>
        <p className="pb-2 text-center text-sm text-muted-foreground">{dt("dd.instruction")}</p>

        <div
          ref={boardRef}
          className="relative w-full overflow-hidden rounded-3xl shadow-lg"
          style={{ aspectRatio: `1 / ${PAINTING_RATIO}` }}
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
          {pieces.map((p, i) => {
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
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${2 * p.r}%`, aspectRatio: "1" }}
              />
            );
          })}
        </div>

        {/* Tray: the pieces waiting to go back */}
        <div className="mt-auto flex flex-wrap items-center justify-center gap-3 px-2 pt-5 pb-2">
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
                className={`${trayPiece} shrink-0 touch-none select-none rounded-full border-4 border-white shadow-[0_8px_16px_oklch(0.35_0.04_60/0.3)] transition ${
                  drag?.i === i ? "opacity-25" : ""
                } ${wrong === i ? "piece-shake" : ""}`}
                style={{
                  ...pieceBackground(story.image, pieces[i]),
                  transform: `rotate(${((i * 7 + k * 5) % 13) - 6}deg)`,
                  touchAction: "none",
                }}
              />
            ))}
        </div>
      </div>

      {/* The piece being dragged, at the size of its spot on the painting */}
      {drag && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_16px_24px_oklch(0.35_0.04_60/0.4)]"
          style={{
            ...pieceBackground(story.image, pieces[drag.i]),
            left: drag.x,
            top: drag.y,
            width: Math.max(56, (2 * pieces[drag.i].r * boardWidth) / 100),
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
