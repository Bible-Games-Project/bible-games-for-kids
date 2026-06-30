import { useSettings } from "@/lib/i18n";

export function PremiumScreen({ onBack }: { onBack: () => void }) {
  const { t, premium, setPremium } = useSettings();
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
      <main className="mx-auto max-w-md px-5 py-8 text-center">
        <div className="paper-card p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-gold)]/30 text-3xl">
            ✨
          </div>
          <h2 className="mt-4 font-display text-2xl">{t("premium.subtitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("premium.body")}</p>

          <ul className="mt-5 space-y-2 text-left text-sm">
            {["premium.feature1", "premium.feature2", "premium.feature3"].map((k) => (
              <li key={k} className="flex items-start gap-2 rounded-xl bg-secondary/50 px-3 py-2">
                <span className="mt-0.5 text-[var(--color-gold)]">★</span>
                <span className="text-foreground/85">{t(k)}</span>
              </li>
            ))}
          </ul>

          {premium ? (
            <div className="mt-6 rounded-2xl bg-[var(--color-sage-soft)] px-4 py-3 text-sm font-semibold text-[oklch(0.35_0.05_150)]">
              ✓ {t("premium.unlocked")}
            </div>
          ) : (
            <button
              onClick={() => setPremium(true)}
              className="mt-6 w-full rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[oklch(0.78_0.13_55)] px-5 py-4 text-base font-semibold text-[oklch(0.25_0.05_50)] shadow-md transition active:scale-95"
            >
              {t("premium.cta")}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
