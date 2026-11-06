import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/i18n";
import { useAudio } from "@/lib/audio";
import { gameText } from "@/lib/games-i18n";
import { localizeSceneTitle } from "@/lib/scenes-i18n";
import { STORIES, type Story } from "@/lib/stories";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Any story painting, for a quiz that doesn't come with its own.
export const randomStory = (): Story => STORIES[Math.floor(Math.random() * STORIES.length)];

// A quick question for an extra roll: a story's painting and three titles,
// only one of them right. After an answer the right title glows (and a wrong
// pick fades) for a moment, so children see the answer, then `onAnswer`.
// `reward` says what a right answer wins (by default, another roll).
export function StoryQuiz({
  story,
  reward,
  onAnswer,
}: {
  story: Story;
  reward?: string;
  onAnswer: (right: boolean) => void;
}) {
  const { lang } = useSettings();
  const audio = useAudio();
  const qt = (k: string) => gameText(lang, k);
  const options = useMemo(() => {
    const others = shuffle(STORIES.filter((s) => s.title !== story.title)).filter(
      (s, i, all) => all.findIndex((o) => o.title === s.title) === i,
    );
    return shuffle([story, ...others.slice(0, 2)]);
  }, [story]);
  const [picked, setPicked] = useState<Story | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current);
    };
  }, []);

  const choose = (s: Story) => {
    if (picked) return;
    setPicked(s);
    const right = s.slug === story.slug;
    audio.play(right ? "quiz-right" : "quiz-wrong");
    timer.current = window.setTimeout(() => onAnswer(right), right ? 1000 : 1700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="paint-box paint-tall paint-solid w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-display text-2xl text-foreground">{qt("quiz.title")}</h2>
        <p className="text-sm text-muted-foreground">{reward ?? qt("quiz.reward")}</p>
        <img
          src={story.thumb}
          alt=""
          draggable={false}
          className="mx-auto mt-3 aspect-[7/9] w-36 select-none rounded-xl object-cover shadow-md"
        />
        <div className="mt-4 grid gap-2">
          {options.map((s) => {
            const right = s.slug === story.slug;
            const state = !picked
              ? "text-foreground"
              : right
                ? "paint-picked text-[oklch(0.45_0.13_150)]"
                : s === picked
                  ? "text-[oklch(0.55_0.17_25)] opacity-70"
                  : "opacity-50";
            return (
              <button
                key={s.slug}
                onClick={() => choose(s)}
                disabled={picked !== null}
                className={`paint-box paint-long paint-flat paint-thin px-4 py-3 text-base font-semibold transition active:scale-[0.98] ${state}`}
              >
                {picked && right ? "✓ " : picked === s && !right ? "✗ " : ""}
                {localizeSceneTitle(s.slug, lang)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
