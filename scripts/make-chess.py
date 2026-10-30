"""Make the round piece pictures for Christian chess.

Each piece is a medallion: a circle cut from one of our paintings (or from
a Guess Who portrait, or the Jesus king picture) showing who the piece is.
Writes src/assets/chess/<team>-<piece>.webp with transparency, plus
jesus-full.webp (the whole king figure, for the piece card).

    python3 scripts/make-chess.py
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "src", "assets")
OUT = os.path.join(ASSETS, "chess")
KING_ART = os.path.join(OUT, "source", "jesus-king.webp")
SIZE = 200

# piece -> (source picture, centre x, centre y, radius), all in fractions
# of the picture's width (y in fractions of its height).
PIECES = {
    "nt-king": (KING_ART, 0.49, 0.155, 0.22),
    "nt-queen": ("guesswho/mary.webp", 0.5, 0.42, 0.42),
    "nt-bishop": ("guesswho/john.webp", 0.5, 0.4, 0.42),
    "nt-knight": ("puzzle-palm-sunday.jpg", 0.49, 0.53, 0.12),
    "nt-rook": ("puzzle-boy-temple.jpg", 0.78, 0.25, 0.14),
    "nt-pawn": ("puzzle-catch-fish.jpg", 0.5, 0.41, 0.09),
    "ot-king": ("guesswho/david.webp", 0.5, 0.42, 0.42),
    "ot-queen": ("guesswho/esther.webp", 0.48, 0.4, 0.42),
    "ot-bishop": ("guesswho/moses.webp", 0.55, 0.38, 0.42),
    "ot-knight": ("guesswho/elijah.webp", 0.55, 0.36, 0.42),
    "ot-rook": ("puzzle-tower-babel.jpg", 0.6, 0.36, 0.27),
    "ot-pawn": ("puzzle-joseph-coat.jpg", 0.27, 0.42, 0.15),
}


def medallion(path, cx, cy, r):
    img = Image.open(path if os.path.isabs(path) else os.path.join(ASSETS, path)).convert("RGBA")
    w, h = img.size
    x, y, rad = cx * w, cy * h, r * w
    face = img.crop((round(x - rad), round(y - rad), round(x + rad), round(y + rad))).resize(
        (SIZE * 4, SIZE * 4), Image.LANCZOS
    )
    # transparent parts (the king picture) sit on warm parchment
    bg = Image.new("RGBA", face.size, (246, 232, 204, 255))
    bg.alpha_composite(face)
    mask = Image.new("L", bg.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, bg.width - 1, bg.height - 1), fill=255)
    bg.putalpha(mask)
    return bg.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    for name, (src, cx, cy, r) in PIECES.items():
        medallion(src, cx, cy, r).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=88, method=6)
        print(name)
    king = Image.open(KING_ART).convert("RGBA")
    king.resize((480, round(king.height * 480 / king.width)), Image.LANCZOS).save(
        os.path.join(OUT, "jesus-full.webp"), "WEBP", quality=88, method=6
    )


if __name__ == "__main__":
    main()
