import { useMemo } from "react";
import { useSettings } from "@/lib/i18n";
import { detectPlatform, pickLink, type GameLinks } from "@/lib/platform";
import didacticIcon from "@/assets/game-didactic-jesus.png";
import lostSheepIcon from "@/assets/game-lost-sheep.png";
import bibleUnlockedIcon from "@/assets/game-bible-unlocked.png";
import trueChristIcon from "@/assets/game-true-christ.png";
import { ArrowIcon } from "@/components/Icons";

interface Game {
  id: string;
  icon: string;
  links: GameLinks;
}

const GAMES: Game[] = [
  {
    id: "didactic-jesus",
    icon: didacticIcon,
    links: {
      android: "https://play.google.com/store/apps/details?id=com.biblegamesproject.pro&hl=es_419",
      ios: "https://apps.apple.com/es/app/didactic-jesus-game-bible/id6740145520",
      pc: "https://store.steampowered.com/app/2138140/Didactic_Jesus_Game/",
    },
  },
  {
    id: "lost-sheep",
    icon: lostSheepIcon,
    links: {
      android: "https://www.biblegamesproject.com/the-lost-sheep",
      ios: "https://apps.apple.com/es/app/the-lost-sheep-bible-game/id6740145333",
      pc: "https://store.steampowered.com/app/2298350/The_Lost_Sheep/",
    },
  },
  {
    id: "bible-unlocked",
    icon: bibleUnlockedIcon,
    links: {
      android: "https://play.google.com/store/apps/details?id=com.biblegames.eden&pcampaignid=web_share",
      ios: "https://apps.apple.com/es/app/bible-unlocked-100-historias/id6775889176?l=ca",
      pc: "https://www.biblegamesproject.com/bible-unlocked",
    },
  },
  {
    id: "true-christ",
    icon: trueChristIcon,
    links: {
      android: "https://www.biblegamesproject.com/true-christ",
      ios: "https://www.biblegamesproject.com/true-christ",
      pc: "https://store.steampowered.com/app/4244150/True_Christ/",
    },
  },
];


export function MoreGamesScreen({ onBack }: { onBack: () => void }) {
  const { t } = useSettings();
  const platform = useMemo(() => detectPlatform(), []);

  return (
    <div className="min-h-[100dvh] w-full">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
        <button
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
          aria-label={t("more.back")}
        >
          <ArrowIcon back />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl sm:text-3xl">{t("more.title")}</h1>
          <p className="truncate text-xs text-muted-foreground">{t("more.subtitle")}</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
        {GAMES.map((g) => {
          const url = pickLink(g.links, platform);
          const name = t(`more.game.${g.id}.name`);
          const desc = t(`more.game.${g.id}.desc`);
          return (
            <a
              key={g.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="paint-box paint-long paint-solid group grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 p-4 transition active:scale-[0.99]"
            >
              <img
                src={g.icon}
                alt={name}
                className="h-20 w-20 rounded-2xl object-cover shadow-sm"
              />
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg leading-snug">{name}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                  {desc}
                </p>
              </div>

              <span className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-foreground)]">
                {t("more.play")}
              </span>
            </a>
          );
        })}
      </main>
    </div>
  );
}
