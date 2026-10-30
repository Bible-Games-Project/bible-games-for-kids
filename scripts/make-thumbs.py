"""Small copies of the story paintings for lists, cards and board squares.

Lists and boards show many paintings at once at a small size; loading the
full 896x1152 paintings for them made screens slow to appear. Writes
src/assets/thumbs/<slug>.webp (320 px wide) for every puzzle-<slug>.jpg.

    python3 scripts/make-thumbs.py
"""
import glob, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "src", "assets")
OUT = os.path.join(ASSETS, "thumbs")
WIDTH = 320


def main():
    os.makedirs(OUT, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(ASSETS, "puzzle-*.jpg"))):
        slug = os.path.basename(path)[len("puzzle-") : -len(".jpg")]
        img = Image.open(path).convert("RGB")
        h = round(img.height * WIDTH / img.width)
        img.resize((WIDTH, h), Image.LANCZOS).save(os.path.join(OUT, f"{slug}.webp"), "WEBP", quality=78, method=6)
        print(slug)


if __name__ == "__main__":
    main()
