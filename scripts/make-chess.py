"""Turn the chess piece pictures into the game's piece images.

Takes the raw pictures made by scripts/generate-chess-pieces.py (one PNG per
piece, transparent background) plus the supplied Jesus king picture, trims
each to the figure and shrinks it. Writes src/assets/chess/<team>-<piece>.webp.

    python3 scripts/make-chess.py [raw folder]
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets", "chess")
RAW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "scripts", "chess-raw")
KING = os.path.join(OUT, "source", "jesus-king.webp")
HEIGHT = 420

NAMES = [f"{team}-{piece}" for team in ("nt", "ot") for piece in ("king", "queen", "bishop", "knight", "rook", "pawn")]


def figure(path):
    img = Image.open(path).convert("RGBA")
    # trim to the figure (ignore nearly invisible edge pixels)
    alpha = img.getchannel("A").point(lambda a: 255 if a > 12 else 0)
    img = img.crop(alpha.getbbox())
    w = round(img.width * HEIGHT / img.height)
    return img.resize((w, HEIGHT), Image.LANCZOS)


def main():
    for name in NAMES:
        src = KING if name == "nt-king" else os.path.join(RAW, f"{name}.png")
        figure(src).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=88, method=6)
        print(name)


if __name__ == "__main__":
    main()
