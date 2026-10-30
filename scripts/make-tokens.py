"""Paint the round player tokens used by the board games.

A classic round counter seen from slightly above: a raised rim, a shallow
dish with a groove, a soft painted texture and a warm light from the top
left, like the illustrations. One per colour, saved as
src/assets/tokens/<colour>.webp with transparency.

    python3 scripts/make-tokens.py   (needs numpy, opencv-python and Pillow)
"""
import os
import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets", "tokens")

COLOURS = {
    "blue": (63, 111, 181),
    "red": (201, 74, 74),
    "yellow": (232, 184, 60),
    "green": (79, 154, 94),
    "purple": (122, 85, 168),
    "orange": (224, 127, 58),
}

S = 768  # working size; saved at 192
CX, CY = S / 2, S * 0.45
A, B = S * 0.40, S * 0.34  # top face radii (the counter is tilted a little)
T = S * 0.065  # thickness seen below the top face


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def render(rgb):
    y, x = np.mgrid[0:S, 0:S].astype(np.float32)
    base = np.array(rgb, np.float32) / 255

    # --- the top face: height profile -> normals -> light
    u, v = (x - CX) / A, (y - CY) / B
    r = np.sqrt(u * u + v * v)
    top = r <= 1
    # rim ridge near the edge, a groove inside it, a shallow dish in the middle
    h = 0.10 * smooth(r, 0.62, 0.80) - 0.10 * smooth(r, 0.86, 1.0) - 0.035 * np.exp(-((r - 0.58) / 0.035) ** 2)
    h += 0.02 * (1 - r * r)
    gy, gx = np.gradient(h * S * 0.35)
    n = np.stack([-gx, -gy, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    light = np.array([-0.45, -0.65, 0.62])
    light /= np.linalg.norm(light)
    lam = np.clip((n * light).sum(-1), 0, 1)
    half = light + np.array([0, 0, 1.0])
    half /= np.linalg.norm(half)
    spec = np.clip((n * half).sum(-1), 0, 1) ** 24

    # --- the side band below the top face
    vs = (y - CY - T) / B
    side = ((u * u + vs * vs) <= 1) & (y > CY) & ~top
    side_shade = 0.55 - 0.25 * smooth((y - CY) / (B + T), 0.2, 1.0) + 0.12 * np.clip(-u, 0, 1)

    # soft painted texture
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 1, (S // 8, S // 8)).astype(np.float32)
    noise = cv2.GaussianBlur(cv2.resize(noise, (S, S), interpolation=cv2.INTER_CUBIC), (0, 0), 6)
    noise = 1 + 0.035 * noise / (np.abs(noise).max() + 1e-6)

    # Shadows go to a warm deep tone of the colour (not grey), lights lift
    # toward cream, like painted plastic rather than metal.
    dark = base * np.array([0.55, 0.45, 0.4], np.float32)
    cream = np.array([1.0, 0.97, 0.9], np.float32)
    k = np.clip((lam - 0.15) / 0.85, 0, 1)[..., None]
    lit = dark + (base - dark) * np.clip(k * 1.25, 0, 1)
    lit = lit + (cream - lit) * (0.35 * np.clip((k - 0.8) / 0.2, 0, 1))
    col = np.zeros((S, S, 3), np.float32)
    col[top] = lit[top] * noise[top, None] + 0.3 * spec[top, None]
    sk = side_shade[..., None]
    col[side] = (dark + (base - dark) * np.clip(sk, 0, 1))[side] * noise[side, None]
    # a lighter lip where the top meets the side
    lip = top & (r > 0.97)
    col[lip] = col[lip] * 0.8 + 0.2
    col = np.clip(col, 0, 1)

    alpha = np.zeros((S, S), np.float32)
    alpha[top | side] = 1
    # antialiased edge
    img = Image.fromarray((col * 255).astype(np.uint8))
    mask = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))

    # soft shadow on the table
    sh = np.zeros((S, S), np.float32)
    ush, vsh = (x - CX - S * 0.02) / (A * 1.02), (y - CY - T - S * 0.05) / (B * 0.9)
    sh[(ush * ush + vsh * vsh) <= 1] = 0.35
    shadow = Image.fromarray((sh * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(S * 0.03))

    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste((40, 25, 15, 255), (0, 0), shadow)
    out.paste(img, (0, 0), mask)
    # crop to the token and its shadow
    box = (int(CX - A - S * 0.05), int(CY - B - S * 0.04), int(CX + A + S * 0.07), int(CY + B + T + S * 0.1))
    out = out.crop(box)
    w = 192
    return out.resize((w, round(out.height * w / out.width)), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, rgb in COLOURS.items():
        render(rgb).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=90, method=6)
        print(name)


if __name__ == "__main__":
    main()
