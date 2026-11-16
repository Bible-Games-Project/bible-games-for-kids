// The round player tokens shared by the board games (painted by
// scripts/make-tokens.py): one per player colour, optionally numbered.
import blue from "@/assets/tokens/blue.webp";
import red from "@/assets/tokens/red.webp";
import yellow from "@/assets/tokens/yellow.webp";
import green from "@/assets/tokens/green.webp";
import purple from "@/assets/tokens/purple.webp";
import orange from "@/assets/tokens/orange.webp";
import bluePawn from "@/assets/tokens/pawn-blue.webp";
import greenPawn from "@/assets/tokens/pawn-green.webp";
import yellowPawn from "@/assets/tokens/pawn-yellow.webp";
import redPawn from "@/assets/tokens/pawn-red.webp";
import purplePawn from "@/assets/tokens/pawn-purple.webp";
import orangePawn from "@/assets/tokens/pawn-orange.webp";
import robotPawn from "@/assets/tokens/pawn-robot.webp";

export type TokenColor = "blue" | "red" | "yellow" | "green" | "purple" | "orange";

const IMAGES: Record<TokenColor, string> = { blue, red, yellow, green, purple, orange };

// Player 1, 2, 3... always get the same colours, in this order.
export const TOKEN_ORDER: TokenColor[] = ["blue", "red", "yellow", "green", "purple", "orange"];

// The colours themselves, for things drawn to match a player's token.
export const TOKEN_HEX: Record<TokenColor, string> = {
  blue: "#3f6fb5",
  red: "#c94a4a",
  yellow: "#e8b83c",
  green: "#4f9a5e",
  purple: "#7a55a8",
  orange: "#e07f3a",
};

// Recolouring the brown painted panels (.paint-tint) in a player's colour,
// keeping the paint texture: an SVG duotone filter per colour (dark paint
// becomes a deep shade, the light parchment a pale one). CSS hue-rotate gave
// muddy oranges instead of red. <PaintTintFilters /> is in the root layout.
export const PLAYER_TINT: Record<TokenColor, string> = {
  blue: "url(#paint-tint-blue)",
  red: "url(#paint-tint-red)",
  yellow: "url(#paint-tint-yellow)",
  green: "url(#paint-tint-green)",
  purple: "url(#paint-tint-purple)",
  orange: "url(#paint-tint-orange)",
};

export function PaintTintFilters() {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      {(Object.keys(TOKEN_HEX) as TokenColor[]).map((c) => {
        const [r, g, b] = rgb(TOKEN_HEX[c]);
        // gray 0 → a deep shade, gray 0.5 → the colour, gray 1 → a pale tint
        const ramp = (v: number) => [v * 0.35, v, v + (1 - v) * 0.82].map((x) => x.toFixed(3)).join(" ");
        return (
          <filter key={c} id={`paint-tint-${c}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={ramp(r)} />
              <feFuncG type="table" tableValues={ramp(g)} />
              <feFuncB type="table" tableValues={ramp(b)} />
            </feComponentTransfer>
          </filter>
        );
      })}
    </svg>
  );
}

// Height / width of the token pictures, and where the face's centre sits.
export const TOKEN_RATIO = 0.96;
export const TOKEN_FACE_Y = 0.43;

export function Token({
  color,
  size,
  label,
  className = "",
}: {
  color: TokenColor;
  // Width in px; without it the token fills its box's width.
  size?: number;
  label?: string | number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block shrink-0 align-middle ${size ? "" : "w-full"} ${className}`}
      style={
        size ? { width: size, height: size * TOKEN_RATIO } : { aspectRatio: `1 / ${TOKEN_RATIO}` }
      }
      aria-hidden
    >
      <img
        src={IMAGES[color]}
        alt=""
        draggable={false}
        className="block h-full w-full select-none"
      />
      {label !== undefined && (
        <span
          className="absolute inset-x-0 -translate-y-1/2 text-center font-bold leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]"
          style={{ top: `${TOKEN_FACE_Y * 100}%`, fontSize: size ? size * 0.36 : "0.9em" }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

// The standing pawns of the Goose and Parchís (supplied pictures); the robot
// stands for the computer when playing against it.
export type PawnKind = TokenColor | "robot";
const PAWNS: Record<PawnKind, string> = {
  robot: robotPawn,
  blue: bluePawn,
  red: redPawn,
  yellow: yellowPawn,
  green: greenPawn,
  purple: purplePawn,
  orange: orangePawn,
};

// Height / width of a pawn's box; the pawn stands on the box's bottom edge
// and the middle of its head is PAWN_HEAD_Y down from the top.
export const PAWN_RATIO = 1.45;
export const PAWN_HEAD_Y = 0.19;

export function PlayerPawn({
  color,
  size,
  label,
  className = "",
}: {
  color: PawnKind;
  // Width in px; without it the pawn fills its box's width.
  size?: number;
  label?: string | number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-end align-bottom ${size ? "" : "w-full"} ${className}`}
      style={
        size ? { width: size, height: size * PAWN_RATIO } : { aspectRatio: `1 / ${PAWN_RATIO}` }
      }
      aria-hidden
    >
      <img
        src={PAWNS[color]}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-contain object-bottom drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]"
      />
      {label !== undefined && (
        <span
          className="absolute inset-x-0 -translate-y-1/2 text-center font-bold leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
          style={{ top: `${PAWN_HEAD_Y * 100}%`, fontSize: size ? size * 0.36 : "0.9em" }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

// "How many players?" for the games with turns: small painted boxes showing
// just the pawns. Choice 0 is one player against the computer (a pawn and
// the robot); n > 0 is n players on the same device.
export function PlayerChoice({
  choices,
  picked,
  onPick,
  label,
  columns = 3,
  pawns = (n) => TOKEN_ORDER.slice(0, n),
}: {
  choices: number[];
  picked?: number | null;
  onPick: (choice: number) => void;
  label: (choice: number) => string;
  columns?: number;
  // The pawns for n players, when a game's seats have other colours.
  pawns?: (players: number) => PawnKind[];
}) {
  return (
    <div
      className={`mx-auto mt-4 grid w-fit ${columns > 3 ? "gap-2" : "gap-3"}`}
      style={{ gridTemplateColumns: `repeat(${Math.min(columns, choices.length)}, auto)` }}
    >
      {choices.map((n) => (
        <button
          key={n}
          onClick={() => onPick(n)}
          aria-label={label(n)}
          title={label(n)}
          className={`paint-box paint-square paint-thin grid place-items-center p-3 transition ${
            columns > 3 ? "h-20 w-20" : "h-24 w-24"
          } active:scale-[0.95] ${
            n === picked ? "paint-picked" : ""
          }`}
        >
          <span className="flex max-w-[4.2rem] flex-wrap items-end justify-center gap-1">
            {n === 0 ? (
              <>
                <PlayerPawn color={pawns(1)[0]} size={20} />
                <PlayerPawn color="robot" size={20} />
              </>
            ) : (
              pawns(n).map((c, i) => <PlayerPawn key={i} color={c} size={n > 4 ? 16 : 18} />)
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
