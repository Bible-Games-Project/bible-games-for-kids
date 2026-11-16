// Made by scripts/make-dragdrop-shapes.cjs — do not edit by hand.
// Drag & Drop levels played with cut-out shapes instead of round pieces.
// x, y = top-left corner and w, h = size, all in % of the painting (x and w
// of its width, y and h of its height).
import type { DifficultyId } from "./puzzles";
import annunciation_dove from "@/assets/dragdrop-shapes/annunciation-dove.webp";
import annunciation_bird from "@/assets/dragdrop-shapes/annunciation-bird.webp";
import annunciation_vase from "@/assets/dragdrop-shapes/annunciation-vase.webp";

export interface ShapePiece {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DD_SHAPES: Record<string, Partial<Record<DifficultyId, ShapePiece[]>>> = {
  "annunciation": {
    "easy": [
      { src: annunciation_dove, x: 14.73, y: 6.08, w: 12.17, h: 11.63 },
      { src: annunciation_bird, x: 82.81, y: 43.58, w: 6.7, h: 5.21 },
      { src: annunciation_vase, x: 1.12, y: 58.77, w: 12.5, h: 14.76 },
    ],
  },
};
