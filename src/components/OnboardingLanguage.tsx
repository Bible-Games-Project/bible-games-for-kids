import { useState } from "react";
import { useSettings, LANGS, type Lang } from "@/lib/i18n";
import { STRINGS } from "@/lib/translations";

export function OnboardingLanguage() {
  const { completeOnboarding } = useSettings();
  const [choice, setChoice] = useState<Lang>("en");

  const dict = STRINGS[choice];
  const isRtl = choice === "ar";

  return (
    <div
      className="flex min-h-[100dvh] w-full items-center justify-center px-5 py-10"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="paint-box paint-tall paint-solid w-full max-w-sm p-7 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {dict["onboard.welcome"]}
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground">
          {dict["onboard.choose"]}
        </h1>

        <div className="mt-6 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {LANGS.map((o) => {
            const active = choice === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setChoice(o.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-start text-base font-semibold transition active:scale-[0.98] ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-foreground"
                    : "border-[var(--color-border)] bg-card text-foreground/80"
                }`}
              >
                <span className="text-2xl">{o.flag}</span>
                <span className="flex-1">{o.label}</span>
                <span
                  className={`h-5 w-5 rounded-full border-2 ${
                    active ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-[var(--color-border)]"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => completeOnboarding(choice)}
          className="mt-6 w-full rounded-full bg-[var(--color-primary)] px-5 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-sm transition active:scale-95"
        >
          {dict["onboard.continue"]}
        </button>
      </div>
    </div>
  );
}
