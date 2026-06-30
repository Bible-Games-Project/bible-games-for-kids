import { useState } from "react";
import { useSettings, type Lang } from "@/lib/i18n";

export function OnboardingLanguage() {
  const { completeOnboarding } = useSettings();
  const [choice, setChoice] = useState<Lang>("en");

  const options: { id: Lang; label: string; flag: string }[] = [
    { id: "en", label: "English", flag: "🇬🇧" },
    { id: "es", label: "Español", flag: "🇪🇸" },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center px-5 py-10">
      <div className="paper-card w-full max-w-sm p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {choice === "es" ? "Bienvenido" : "Welcome"}
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground">
          {choice === "es" ? "Elige tu idioma" : "Choose your language"}
        </h1>

        <div className="mt-6 space-y-3">
          {options.map((o) => {
            const active = choice === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setChoice(o.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base font-semibold transition active:scale-[0.98] ${
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
          {choice === "es" ? "Continuar" : "Continue"}
        </button>
      </div>
    </div>
  );
}
