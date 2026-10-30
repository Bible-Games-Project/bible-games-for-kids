"""Make the empty team pedestals for the chess pieces.

Every piece of a team stands on exactly the same pedestal: the one under the
supplied king (src/assets/chess/source/<team>-king.webp). This takes the king
off it: the hidden back of the top surface is filled in smoothly to meet the
visible part, with the same grain, and the back rim is drawn back in. Writes
src/assets/chess/source/<team>-pedestal.webp for scripts/make-chess.py.

    python3 scripts/make-chess-pedestals.py
"""
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src", "assets", "chess", "source")

TEAMS = {
    # top surface outline (cx, cy, rx, ry, superellipse power); above y_clear only the
    # top surface is pedestal; the rim shows below y_rim; the king's feet end at
    # y_cut, between x lo and hi; colours of the outline and the rim highlight
    "nt": dict(T=(553, 1095, 233, 142, 3), y_clear=1003, y_rim=1062, y_cut=1196, lo=372, hi=748,
               line=(112, 58, 20), shine=(244, 178, 90)),
    "ot": dict(T=(566, 1105, 250, 152, 3), y_clear=997, y_rim=1048, y_cut=1172, lo=378, hi=762,
               line=(28, 25, 28), shine=(92, 85, 90)),
}


def curve(cx, cy, rx, ry, n, k=720):
    t = np.linspace(0, 2 * np.pi, k, endpoint=False)
    c, s = np.cos(t), np.sin(t)
    return cx + rx * np.sign(c) * np.abs(c) ** (2 / n), cy + ry * np.sign(s) * np.abs(s) ** (2 / n)


def region(size, T, inset=0.0, ss=4):
    cx, cy, rx, ry, n = T
    x, y = curve(cx, cy, rx - inset, ry - inset * ry / rx, n)
    im = Image.new("L", (size[0] * ss, size[1] * ss), 0)
    ImageDraw.Draw(im).polygon(list(zip(x * ss, y * ss)), fill=255)
    return np.asarray(im.resize(size, Image.LANCZOS)).astype(np.float32) / 255


def noise(h, w, rng):
    out = np.zeros((h, w), np.float32)
    for sigma, amp in ((1.0, 0.7), (3, 1.0), (7, 0.45)):
        n = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), sigma)
        out += amp * n / (n.std() + 1e-6)
    return out / out.std()


def empty_pedestal(team):
    cfg = TEAMS[team]
    im = Image.open(os.path.join(SRC, f"{team}-king.webp")).convert("RGBA")
    W, H = im.size
    a = np.asarray(im).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    yy, xx = np.mgrid[0:H, 0:W]
    inT = region((W, H), cfg["T"])
    inner = region((W, H), cfg["T"], inset=16)
    # where the king stands: the back of the top surface and the feet
    M = np.maximum((inT > 0) * (yy < cfg["y_rim"]), inner * (yy < cfg["y_cut"]) * (xx > cfg["lo"]) * (xx < cfg["hi"]))
    M = cv2.GaussianBlur(M.astype(np.float32), (0, 0), 2.5) * (inT > 0.5)
    # smooth colour for the hidden part: a harmonic fill (on a 1/4 grid) that
    # meets the visible top surface on every side, so no seams show
    q = 4
    small = lambda arr: cv2.resize(arr, (W // q, H // q), interpolation=cv2.INTER_AREA)
    low = small(cv2.GaussianBlur(rgb, (0, 0), 5))
    known = small(((inT > 0.99) & (M < 0.05)).astype(np.float32)) > 0.99
    alive = small((inT > 0.5).astype(np.float32)) > 0.5
    unknown = alive & ~known
    f = low.copy()
    f[unknown] = np.median(low[known & (small(yy.astype(np.float32)) < cfg["y_cut"])], 0)
    w = alive.astype(np.float32)
    steps = ((1, 0), (-1, 0), (1, 1), (-1, 1))
    for _ in range(3000):
        num = sum(np.roll(f * w[..., None], sh, ax) for sh, ax in steps)
        den = sum(np.roll(w, sh, ax) for sh, ax in steps)
        f = np.where(unknown[..., None], num / np.maximum(den, 1e-6)[..., None], f)
    fill = cv2.resize(f, (W, H), interpolation=cv2.INTER_CUBIC)
    # the same grain as the visible top surface
    vis = (inner > 0.99) & (M < 0.01) & (yy >= cfg["y_rim"]) & (yy < cfg["y_cut"] + 30)
    amp = (rgb - cv2.GaussianBlur(rgb, (0, 0), 6))[vis].std(0)
    fill = np.clip(fill + noise(H, W, np.random.default_rng(7))[..., None] * amp * 0.8, 0, 255)
    out = rgb * (1 - M[..., None]) + fill * M[..., None]
    # nothing above the pedestal any more
    alpha = alpha * (1 - (yy < cfg["y_clear"]) * (1 - inT))
    alpha = np.where(M > 0, np.maximum(alpha, inT * 253), alpha)
    res = Image.fromarray(np.dstack([out, alpha]).astype(np.uint8), "RGBA")
    # the back rim: a soft highlight just inside a thin dark outline
    cx, cy, rx, ry, n = cfg["T"]
    ss = 4
    layer = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for inset, col, width in ((7, cfg["shine"] + (200,), 7), (0.8, cfg["line"] + (255,), 3)):
        x, y = curve(cx, cy, rx - inset, ry - inset * ry / rx, n)
        keep = y < cfg["y_clear"] + 24
        order = np.argsort(np.arctan2(y[keep] - cy, x[keep] - cx))
        d.line([(x[keep][i] * ss, y[keep][i] * ss) for i in order], fill=col, width=width * ss, joint="curve")
    layer = layer.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    # fade the drawn rim out where the original rim takes over
    la = np.asarray(layer).astype(np.float32)
    la[..., 3] *= np.clip((cfg["y_clear"] + 24 - yy) / 20, 0, 1)
    res.alpha_composite(Image.fromarray(la.astype(np.uint8), "RGBA"))
    return res


if __name__ == "__main__":
    for team in TEAMS:
        empty_pedestal(team).save(os.path.join(SRC, f"{team}-pedestal.webp"), "WEBP", quality=92, method=6)
        print(team)
