import { useEffect, useState } from "react";
import { useSettings, LANGS } from "@/lib/i18n";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, setLang, sound, setSound, devMode, setDevMode, resetAll, t } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const langs = LANGS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 pt-10 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="paint-box paint-tall paint-solid w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">{t("settings.title")}</h2>
          <button
            onClick={onClose}
            aria-label={t("settings.close")}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground/70 transition active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Sound */}
        <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("settings.sound")}</span>
            <button
              onClick={() => setSound(!sound)}
              className={`relative h-7 w-12 rounded-full transition ${sound ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
              aria-pressed={sound}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${sound ? "left-6" : "left-1"}`}
              />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {sound ? t("settings.on") : t("settings.off")}
          </p>
        </div>

        {/* Language */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-card p-4">
          <span className="text-sm font-semibold">{t("settings.language")}</span>
          <div className="mt-3 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1">
            {langs.map((l) => {
              const active = lang === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-95 ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] bg-card text-foreground/80"
                  }`}
                >
                  <span className="text-lg">{l.flag}</span>
                  <span className="truncate">{l.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Developer Mode */}
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("settings.dev")}</span>
            <button
              onClick={() => setDevMode(!devMode)}
              className={`relative h-7 w-12 rounded-full transition ${devMode ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`}
              aria-pressed={devMode}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${devMode ? "left-6" : "left-1"}`}
              />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("settings.devHint")}</p>

          {devMode && (
            <div className="mt-3">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full rounded-xl border border-[oklch(0.65_0.18_25)]/40 bg-[oklch(0.97_0.04_25)] px-3 py-2 text-sm font-semibold text-[oklch(0.45_0.15_25)] transition active:scale-95"
                >
                  {t("settings.reset")}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-foreground/80">{t("settings.resetConfirm")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="rounded-xl border border-[var(--color-border)] bg-card px-3 py-2 text-sm font-semibold active:scale-95"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => {
                        resetAll();
                        setConfirmReset(false);
                        onClose();
                      }}
                      className="rounded-xl bg-[oklch(0.55_0.18_25)] px-3 py-2 text-sm font-semibold text-white active:scale-95"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
