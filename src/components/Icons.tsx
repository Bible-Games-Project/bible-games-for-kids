import type { ReactNode } from "react";
import type { Kind } from "@/lib/chess";

// Small drawn signs for the symbols the game's two fonts (Baloo 2 for titles,
// Nunito for text) don't have, so no other typeface ever shows: stars,
// ticks, crosses, arrows, chess pieces and music notes. Each is 1em, sits on
// the text line and takes the colour of the text around it.

function Icon({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block h-[1em] w-[1em] shrink-0 align-[-0.125em] ${className}`}
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

const STAR = "M12 2.2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

export function StarIcon({ filled = true, className }: { filled?: boolean; className?: string }) {
  return (
    <Icon className={className}>
      <path
        d={STAR}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 1 : 1.8}
        strokeLinejoin="round"
      />
    </Icon>
  );
}

// A row of three stars, the earned ones gold.
export function StarRow({
  value,
  className = "",
  empty = "text-foreground/20",
}: {
  value: number;
  className?: string;
  empty?: string;
}) {
  return (
    <span className={`inline-flex gap-[0.08em] ${className}`} aria-label={`${value} / 3`}>
      {[0, 1, 2].map((i) => (
        <StarIcon key={i} className={i < value ? "text-[var(--color-gold)]" : empty} />
      ))}
    </span>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path
        d="M4.5 12.5l4.8 4.8L19.5 6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function CrossIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Icon>
  );
}

// Arrows point forward (right, or left in right-to-left languages).
export function ArrowIcon({
  back = false,
  className = "",
}: {
  back?: boolean;
  className?: string;
}) {
  return (
    <Icon className={`${back ? "-scale-x-100 rtl:scale-x-100" : "rtl:-scale-x-100"} ${className}`}>
      <path
        d="M4 12h15M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function UndoIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path
        d="M9 6L4.5 10.5 9 15M5 10.5h9a5 5 0 0 1 0 10h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function RestartIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path
        d="M5.5 9A7.5 7.5 0 1 1 4.6 14M5 3.8V9h5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

// Chess pieces as plain silhouettes, standing on one base.
const BASE = "M6.5 17h11l1 3.5h-13z";
const PIECES: Record<Kind, string> = {
  p: "M12 3.5a3.2 3.2 0 0 1 2 5.7l1.6 6.3H8.4L10 9.2a3.2 3.2 0 0 1 2-5.7z",
  r: "M6.5 3.5h2.6v2.2h1.6V3.5h2.6v2.2h1.6V3.5h2.6V9l-2 1.6v4.9H8.5v-4.9L6.5 9z",
  b: "M12 1.5a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM12 4.6c2.8 2 4.3 4.3 4.3 6.6 0 1.8-.9 3.2-2 4.3H9.7c-1.1-1.1-2-2.5-2-4.3 0-2.3 1.5-4.6 4.3-6.6z",
  n: "M8 15.5c-.3-2.6 1.2-4 3.2-5.3-1.7.1-3.1.8-4 1.7L5.4 9.8 8.6 6l.4-2.5 1.9 1.7c3.8.3 6.5 3.2 6.5 7.1v3.2z",
  q: "M4.5 6.5a1.4 1.4 0 1 1 2 1.3L8.4 12 10.6 5a1.4 1.4 0 1 1 2.8 0l2.2 7 1.9-4.2a1.4 1.4 0 1 1 2 -1.3L18 15.5H6z",
  k: "M11 1.5h2v2h2v2h-2v2c2.6.6 4.5 2.6 4.5 5v3h-11v-3c0-2.4 1.9-4.4 4.5-5v-2H9v-2h2z",
};

export function ChessIcon({ kind, className }: { kind: Kind; className?: string }) {
  return (
    <Icon className={className}>
      <path d={PIECES[kind]} />
      <path d={BASE} />
    </Icon>
  );
}

// Music notes: one note, or two joined by a beam.
export function NoteIcon({ beamed = false, className }: { beamed?: boolean; className?: string }) {
  return (
    <Icon className={className}>
      {beamed ? (
        <>
          <path d="M8.6 6.2L20 3.4v4L8.6 10.2z" />
          <rect x="8.6" y="7" width="2" height="11" />
          <rect x="18" y="4.5" width="2" height="11" />
          <ellipse cx="7.2" cy="18.3" rx="3" ry="2.3" transform="rotate(-20 7.2 18.3)" />
          <ellipse cx="16.6" cy="15.8" rx="3" ry="2.3" transform="rotate(-20 16.6 15.8)" />
        </>
      ) : (
        <>
          <rect x="12.6" y="3" width="2" height="15" />
          <path d="M14.6 3c1.4 2.4 5.6 3.5 4.8 8.2-.4-2.6-2.6-3.8-4.8-4z" />
          <ellipse cx="11.2" cy="18.3" rx="3.4" ry="2.5" transform="rotate(-20 11.2 18.3)" />
        </>
      )}
    </Icon>
  );
}
