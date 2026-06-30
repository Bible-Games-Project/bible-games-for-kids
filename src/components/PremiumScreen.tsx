import { useSettings } from "@/lib/i18n";

export function PremiumScreen({ onBack }: { onBack: () => void }) {
  const { t } = useSettings();
  return (
    <div className="min-h-[100dvh] w-full">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-6 pb-2">
        <button
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground/80 shadow-sm transition active:scale-95"
          aria-label={t("premium.back")}
        >
          ←
        </button>
        <h1 className="font-display text-2xl sm:text-3xl">{t("premium.title")}</h1>
      </header>
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <div className="paper-card p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-gold)]/30 text-3xl">
            ✨
          </div>
          <h2 className="mt-4 font-display text-2xl">{t("premium.subtitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("premium.body")}</p>
        </div>
      </main>
    </div>
  );
}
