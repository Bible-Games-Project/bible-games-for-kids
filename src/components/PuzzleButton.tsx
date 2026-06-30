import type { ReactNode } from "react";

/**
 * Stylized jigsaw-piece buttons for the Home screen.
 * Each edge can be flat, a tab (outward bump) or a socket (inward bump).
 * Shapes are slightly irregular to feel hand-cut rather than geometric.
 */

type EdgeKind = "flat" | "tab" | "socket";
interface EdgeSpec {
  kind: EdgeKind;
  /** position of the bump center along the edge, 0..1 */
  pos?: number;
  /** bump width as a fraction of the edge length */
  widthFrac?: number;
  /** depth in svg units */
  depth?: number;
  /** subtle asymmetry: shift control points along the edge */
  skew?: number;
}

interface Edges {
  top: EdgeSpec;
  right: EdgeSpec;
  bottom: EdgeSpec | EdgeSpec[]; // bottom can hold two tabs (Play piece)
  left: EdgeSpec;
}

interface Shape {
  /** body rectangle inner size, in svg units */
  w: number;
  h: number;
  /** outer margin around the body to accommodate tabs */
  m: number;
  edges: Edges;
}

interface Pt { x: number; y: number; }

function buildEdgePath(
  from: Pt,
  to: Pt,
  edge: EdgeSpec | EdgeSpec[],
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const L = Math.hypot(dx, dy);
  const vx = dx / L, vy = dy / L;
  // outward normal for a clockwise traversal: rotate v by -90deg
  const nx = vy, ny = -vx;

  const bumps = Array.isArray(edge) ? edge : [edge];
  const active = bumps.filter((e) => e.kind !== "flat");
  if (active.length === 0) {
    return `L ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  }

  // sort by position
  active.sort((a, b) => (a.pos ?? 0.5) - (b.pos ?? 0.5));

  const pt = (along: number, perp: number): Pt => ({
    x: from.x + vx * along + nx * perp,
    y: from.y + vy * along + ny * perp,
  });

  let out = "";
  let cursor = 0; // position along edge already drawn

  for (const e of active) {
    const pos = e.pos ?? 0.5;
    const widthFrac = e.widthFrac ?? 0.34;
    const depth = e.depth ?? 22;
    const skew = e.skew ?? 0;
    const sign = e.kind === "tab" ? 1 : -1;

    const w = widthFrac * L;
    const center = pos * L;
    const baseL = center - w / 2;
    const baseR = center + w / 2;
    const overshoot = w * 0.42;

    // walk straight to start of bump
    const P1 = pt(baseL, 0);
    out += `L ${P1.x.toFixed(2)} ${P1.y.toFixed(2)} `;

    // small neck inward step for a slightly pinched look
    const neckIn = depth * 0.08;
    const Nstart = pt(baseL + w * 0.04, -sign * neckIn * 0.4);
    out += `L ${Nstart.x.toFixed(2)} ${Nstart.y.toFixed(2)} `;

    // single cubic bezier with controls outside the neck → bulbous knob
    const C1 = pt(baseL - overshoot + skew * w * 0.1, sign * depth * 1.18);
    const C2 = pt(baseR + overshoot + skew * w * 0.1, sign * depth * 1.18);
    const Nend = pt(baseR - w * 0.04, -sign * neckIn * 0.4);
    out += `C ${C1.x.toFixed(2)} ${C1.y.toFixed(2)} ${C2.x.toFixed(2)} ${C2.y.toFixed(2)} ${Nend.x.toFixed(2)} ${Nend.y.toFixed(2)} `;

    const P4 = pt(baseR, 0);
    out += `L ${P4.x.toFixed(2)} ${P4.y.toFixed(2)} `;

    cursor = baseR;
  }
  void cursor;

  out += `L ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  return out;
}

function buildPiecePath(shape: Shape): string {
  const { w, h, m, edges } = shape;
  const tl: Pt = { x: m, y: m };
  const tr: Pt = { x: m + w, y: m };
  const br: Pt = { x: m + w, y: m + h };
  const bl: Pt = { x: m, y: m + h };

  return [
    `M ${tl.x} ${tl.y}`,
    buildEdgePath(tl, tr, edges.top),
    buildEdgePath(tr, br, edges.right),
    buildEdgePath(br, bl, edges.bottom),
    buildEdgePath(bl, tl, edges.left),
    "Z",
  ].join(" ");
}

interface ButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  ariaLabel?: string;
  /** css variable name or color */
  fill: string;
  textColor?: string;
  variant: "play" | "premium" | "more";
}

const SHAPES: Record<ButtonProps["variant"], Shape> = {
  play: {
    w: 320, h: 110, m: 28,
    edges: {
      top: { kind: "flat" },
      right: { kind: "flat" },
      bottom: [
        { kind: "tab", pos: 0.27, widthFrac: 0.22, depth: 24, skew: -0.4 },
        { kind: "tab", pos: 0.73, widthFrac: 0.22, depth: 26, skew: 0.5 },
      ],
      left: { kind: "flat" },
    },
  },
  premium: {
    w: 160, h: 150, m: 28,
    edges: {
      top: { kind: "tab", pos: 0.5, widthFrac: 0.42, depth: 24, skew: 0.3 },
      right: { kind: "tab", pos: 0.5, widthFrac: 0.42, depth: 24, skew: -0.4 },
      bottom: { kind: "flat" },
      left: { kind: "flat" },
    },
  },
  more: {
    w: 160, h: 150, m: 28,
    edges: {
      top: { kind: "tab", pos: 0.5, widthFrac: 0.42, depth: 24, skew: -0.2 },
      right: { kind: "flat" },
      bottom: { kind: "flat" },
      left: { kind: "socket", pos: 0.5, widthFrac: 0.42, depth: 24, skew: 0.4 },
    },
  },
};

export function PuzzleButton({ onClick, icon, label, ariaLabel, fill, textColor, variant }: ButtonProps) {
  const shape = SHAPES[variant];
  const vbW = shape.w + shape.m * 2;
  const vbH = shape.h + shape.m * 2;
  const d = buildPiecePath(shape);
  const gradId = `pb-grad-${variant}`;

  // content padding so text stays inside the body rectangle, not over a tab
  const padTop = (shape.m / vbH) * 100;
  const padBottom = (shape.m / vbH) * 100;
  const padLeft = (shape.m / vbW) * 100;
  const padRight = (shape.m / vbW) * 100;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="relative block w-full select-none transition active:scale-[0.97] focus:outline-none"
      style={{ aspectRatio: `${vbW} / ${vbH}` }}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="absolute inset-0 h-full w-full"
        style={{ filter: "drop-shadow(0 6px 10px oklch(0.3 0.05 60 / 0.18))" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="1" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id={`${gradId}-hl`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="55%" stopColor="white" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#${gradId})`} stroke="oklch(0.32 0.05 55 / 0.35)" strokeWidth={1.5} strokeLinejoin="round" />
        {/* soft top highlight */}
        <path d={d} fill={`url(#${gradId}-hl)`} />
        {/* inner stroke for cardboard feel */}
        <path d={d} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth={1} style={{ transform: "translate(0.6px, 0.6px)" }} />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center text-center"
        style={{
          paddingTop: `${padTop}%`,
          paddingBottom: `${padBottom}%`,
          paddingLeft: `${padLeft}%`,
          paddingRight: `${padRight}%`,
          color: textColor ?? "inherit",
        }}
      >
        <span className="flex flex-col items-center gap-1 leading-tight">
          <span aria-hidden className="text-2xl sm:text-3xl">{icon}</span>
          <span className="font-display text-base font-semibold sm:text-lg">{label}</span>
        </span>
      </span>
    </button>
  );
}
