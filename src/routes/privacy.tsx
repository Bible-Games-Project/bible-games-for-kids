import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettings, LANGS } from "@/lib/i18n";
import { POLICY, UPDATED, type PolicyLang } from "@/lib/privacy-i18n";

// Privacy policy, linked from Settings and used as the privacy URL in the
// App Store and Google Play listings (https://<site>/privacy). The text is in
// src/lib/privacy-i18n.ts.
// Keep it true to the code: the game collects nothing, has no ads, no
// analytics, no accounts and no purchases, and makes no network requests.
// If any of that changes (in-app purchases, analytics...), update the text.

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Bibledoo · Privacy policy" }] }),
  component: PrivacyPage,
});

// Game languages in the game's order, then Catalan (policy only).
const POLICY_LANGS: PolicyLang[] = [...LANGS.map((l) => l.id), "ca"];

function PrivacyPage() {
  const { lang } = useSettings();
  // Shows the game's language until another one is picked here.
  const [picked, setPicked] = useState<PolicyLang | null>(null);
  const shown = picked ?? lang;
  const p = POLICY[shown];
  const rtl = shown === "ar";

  return (
    <main
      className="theme-bedtime min-h-[100dvh] bg-[oklch(0.95_0.04_82)] text-foreground"
      lang={shown === "zh" ? "zh-Hans" : shown}
      dir={rtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground/80 transition active:scale-95"
          >
            {/* Inline, not ArrowIcon: that one follows the game's direction, this the page's. */}
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${rtl ? "-scale-x-100" : ""}`}
              aria-hidden="true"
            >
              <path
                d="M20 12H5M11 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {p.back}
          </Link>
          <select
            value={shown}
            onChange={(e) => setPicked(e.target.value as PolicyLang)}
            aria-label="Language"
            className="rounded-full border border-[var(--color-border)] bg-card px-3 py-2 text-sm font-semibold text-foreground/80"
          >
            {POLICY_LANGS.map((id) => (
              <option key={id} value={id}>
                {POLICY[id].name}
              </option>
            ))}
          </select>
        </div>

        <article className="paint-box paint-tall paint-solid p-6 sm:p-8">
          <h1 className="font-display text-3xl">Bibledoo · {p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.updated}: {UPDATED}
          </p>
          {p.sections.map(([heading, body]) => (
            <section key={heading} className="mt-6">
              <h2 className="font-display text-xl">{heading}</h2>
              <p className="mt-1 leading-relaxed">{body}</p>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
