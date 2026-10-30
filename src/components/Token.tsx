// The round player tokens shared by the board games (painted by
// scripts/make-tokens.py): one per player colour, optionally numbered.
import blue from "@/assets/tokens/blue.webp";
import red from "@/assets/tokens/red.webp";
import yellow from "@/assets/tokens/yellow.webp";
import green from "@/assets/tokens/green.webp";
import purple from "@/assets/tokens/purple.webp";
import orange from "@/assets/tokens/orange.webp";

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
