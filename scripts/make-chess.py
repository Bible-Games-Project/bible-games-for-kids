"""Turn the chess piece pictures into the game's piece images.

Each piece is its character (a raw PNG made by scripts/generate-chess-pieces.py,
transparent background, no pedestal) stood on the team's empty pedestal from
scripts/make-chess-pedestals.py, so every piece of a team has exactly the same
pedestal. The kings are the supplied pictures as they are. All pieces share one
frame, with the pedestal in the same place, and are written to
src/assets/chess/<team>-<piece>.webp. A piece with no raw picture is left as it is.

    python3 scripts/make-chess.py [raw folder]
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets", "chess")
SRC = os.path.join(OUT, "source")
RAW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "scripts", "chess-raw")

TEAMS = {
    # pedestal centre x, row the feet stand on, pedestal bottom, top of the king,
    # width of the pedestal top, shadow strength and the team's scale (so both
    # teams come out about the same size)
    "nt": dict(cx=550.5, feet=1178, bottom=1387, top=23, surface=466, shadow=0.42, scale=1.0),
    "ot": dict(cx=565.5, feet=1156, bottom=1417, top=62, surface=500, shadow=0.6, scale=0.967),
}
# figure height compared with the king's
HEIGHT = {"queen": 0.86, "bishop": 0.86, "knight": 0.72, "rook": 0.74, "pawn": 0.68}
HALF, TALL, OUT_H = 330, 1390, 560


def trimmed(path):
    img = Image.open(path).convert("RGBA")
    alpha = img.getchannel("A").point(lambda a: 255 if a > 12 else 0)
    return img.crop(alpha.getbbox())


def stand(team, piece):
    t = TEAMS[team]
    base = Image.open(os.path.join(SRC, f"{team}-pedestal.webp")).convert("RGBA")
    fig = trimmed(os.path.join(RAW, f"{team}-{piece}.png"))
    s = HEIGHT[piece] * (t["feet"] - t["top"]) / fig.height
    s = min(s, 1.2 * t["surface"] / fig.width)
    fig = fig.resize((round(fig.width * s), round(fig.height * s)), Image.LANCZOS)
    # centre the feet (the bottom rows of the figure) on the pedestal
    a = np.asarray(fig.getchannel("A")).astype(np.float32)
    foot = a[-max(4, fig.height // 20):].sum(0)
    xs = np.nonzero(foot > foot.max() * 0.05)[0]
    fx = float((foot * np.arange(fig.width)).sum() / foot.sum())
    left = round(t["cx"] - fx)
    top = round(t["feet"] - fig.height)
    # a soft contact shadow under the feet, only on the pedestal
    w = max(120, 1.15 * (xs[-1] - xs[0]))
    shadow = Image.new("L", base.size, 0)
    ImageDraw.Draw(shadow).ellipse((t["cx"] - w / 2, t["feet"] - 0.07 * w - 4, t["cx"] + w / 2, t["feet"] + 0.07 * w - 4),
                                   fill=round(255 * t["shadow"]))
    shadow = shadow.filter(ImageFilter.GaussianBlur(7))
    shadow = Image.fromarray(np.minimum(np.asarray(shadow), np.asarray(base.getchannel("A"))))
    base.alpha_composite(Image.merge("RGBA", (*[Image.new("L", base.size, 0)] * 3, shadow)))
    base.alpha_composite(fig, (left, top))
    return base


def framed(team, img):
    t = TEAMS[team]
    sc = t["scale"]
    img = img.resize((round(img.width * sc), round(img.height * sc)), Image.LANCZOS)
    cx, bottom = t["cx"] * sc, t["bottom"] * sc
    box = (round(cx - HALF), round(bottom + 6 - TALL), round(cx + HALF), round(bottom + 6))
    frame = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    frame.alpha_composite(img, (-box[0], -box[1]))
    return frame.resize((round(frame.width * OUT_H / frame.height), OUT_H), Image.LANCZOS)


def main():
    for team in TEAMS:
        for piece in ("king", *HEIGHT):
            name = f"{team}-{piece}"
            if piece == "king":
                img = Image.open(os.path.join(SRC, f"{team}-king.webp")).convert("RGBA")
            elif os.path.exists(os.path.join(RAW, f"{name}.png")):
                img = stand(team, piece)
            else:
                print(name, "kept (no raw picture)")
                continue
            framed(team, img).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=88, method=6)
            print(name)


if __name__ == "__main__":
    main()
