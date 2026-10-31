"""Turn the chess piece pictures into the game's piece images.

The pictures are in src/assets/chess/source/<team>-<piece>.webp: each a figure
standing on its pedestal, on a transparent background (the apostle pawn was
stood on the empty pedestal of the Jesus king). They come in slightly
different sizes, so each one is only scaled so that every pedestal ends up the
same width, then placed in one shared frame with the pedestal centred at the
bottom. Writes src/assets/chess/<team>-<piece>.webp. A piece with no source
picture is left as it is.

    python3 scripts/make-chess.py
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets", "chess")
SRC = os.path.join(OUT, "source")

PEDESTAL = 511  # pedestal width in the frame below
HALF, TALL, OUT_H = 330, 1390, 560
NAMES = [f"{team}-{piece}" for team in ("nt", "ot") for piece in ("king", "queen", "bishop", "knight", "rook", "pawn")]


def pedestal(alpha):
    """Width, centre and bottom of the pedestal: the widest row near the bottom."""
    solid = alpha > 128
    rows = np.nonzero(solid.any(1))[0]
    top, bottom = rows[0], rows[-1]
    best = (0, 0.0)
    for y in range(bottom - int(0.3 * (bottom - top)), bottom + 1):
        xs = np.nonzero(solid[y])[0]
        if len(xs) and xs[-1] - xs[0] > best[0]:
            best = (xs[-1] - xs[0], (xs[0] + xs[-1]) / 2)
    return best[0], best[1], bottom


def framed(img):
    width, cx, bottom = pedestal(np.asarray(img.getchannel("A")))
    s = PEDESTAL / width
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    cx, bottom = cx * s, bottom * s
    box = (round(cx - HALF), round(bottom + 6 - TALL), round(cx + HALF), round(bottom + 6))
    frame = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    frame.alpha_composite(img, (-box[0], -box[1]))
    # nothing of the figure may be cut off by the frame
    bbox = img.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
    if bbox[0] < box[0] or bbox[1] < box[1] or bbox[2] > box[2]:
        print("  warning: the figure does not fit the frame", bbox, box)
    return frame.resize((round(frame.width * OUT_H / frame.height), OUT_H), Image.LANCZOS)


def main():
    for name in NAMES:
        path = os.path.join(SRC, f"{name}.webp")
        if not os.path.exists(path):
            print(name, "kept (no source picture)")
            continue
        framed(Image.open(path).convert("RGBA")).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=88, method=6)
        print(name)


if __name__ == "__main__":
    main()
