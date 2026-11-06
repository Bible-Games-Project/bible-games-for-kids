"""Cut the Guess Who? portraits out of the story paintings.

Each character is a face marked in src/lib/story-items.ts (an item like
"moses.face"); the portrait is a square around that face, a little below it
so hair, veils and crowns fit. Writes src/assets/guesswho/<id>.webp.

    python3 scripts/make-guesswho.py
"""
import json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(SRC, "assets", "guesswho")

# character id -> (story slug, item index in that story)
CHARACTERS = {
    "jesus": ("good-shepherd", 0),
    "mary": ("nativity", 1),
    "joseph": ("nativity", 2),
    "moses": ("burning-bush", 0),
    "david": ("david-shepherd", 0),
    "goliath": ("david-goliath", 1),
    "noah": ("noahs-ark", 0),
    "abraham": ("abraham-stars", 0),
    "adam": ("adam-animals", 11),
    "elijah": ("elijah-ravens", 0),
    "daniel": ("daniel-lions", 0),
    "jonah": ("jonah-fish", 0),
    "esther": ("queen-esther", 0),
    "ruth": ("ruth-fields", 0),
    "naomi": ("ruth-fields", 1),
    "gideon": ("gideon-fleece", 0),
    "zacchaeus": ("zacchaeus", 0),
    "peter": ("washes-feet", 2),
    "john": ("baptism-jesus", 1),
    "martha": ("mary-martha", 2),
    "young-joseph": ("joseph-coat", 0),
    "gabriel": ("annunciation", 0),
    "samaritan": ("good-samaritan", 0),
    "father": ("prodigal-son", 0),
    "samuel": ("samuel-call", 0),
    "orpah": ("ruth-fields", 2),
    "mary-bethany": ("mary-martha", 1),
    "boy-jesus": ("boy-temple", 0),
    "cleopas": ("emmaus", 1),
    "sower": ("sower-seed", 0),
    "temple-teacher": ("boy-temple", 1),
    "jacob": ("joseph-coat", 2),
    "joseph-egypt": ("joseph-forgives", 0),
    "baby-moses": ("moses-basket", 2),
    "baby-jesus": ("nativity", 0),
    "blindman": ("heals-blind", 1),
    "fisherman": ("catch-fish", 3),
}

# Framing tweaks for faces not centred in their circle: shift (in radii)
# and zoom (smaller = closer).
ADJUST = {
    "zacchaeus": (0, -0.5, 1),
    "samaritan": (0, -0.45, 1),
    "peter": (-0.1, -0.3, 1),
    "goliath": (0, 0, 0.8),
}

SIZE = 240


def load_items():
    src = open(os.path.join(SRC, "lib", "story-items.ts"), encoding="utf-8").read()
    body = src[src.index("= {") + 2 : src.rindex("};") + 1]
    return json.loads(re.sub(r",\s*}", "}", body))


def main():
    items = load_items()
    os.makedirs(OUT, exist_ok=True)
    for cid, (slug, idx) in CHARACTERS.items():
        word, x, y, r = items[slug][idx]
        img = Image.open(os.path.join(SRC, "assets", f"puzzle-{slug}.jpg")).convert("RGB")
        w, h = img.size
        cx, cy, rad = x / 100 * w, y / 100 * h, r / 100 * w
        sx, sy, zoom = ADJUST.get(cid, (0, 0, 1))
        half = rad * 1.75 * zoom
        cx += rad * sx
        cy += rad * (0.35 + sy)
        box = [cx - half, cy - half, cx + half, cy + half]
        # Slide the square back inside the painting.
        dx = max(0, -box[0]) - max(0, box[2] - w)
        dy = max(0, -box[1]) - max(0, box[3] - h)
        box = [box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy]
        face = img.crop(tuple(round(v) for v in box)).resize((SIZE, SIZE), Image.LANCZOS)
        face.save(os.path.join(OUT, f"{cid}.webp"), "WEBP", quality=82, method=6)
        print(cid, word)


if __name__ == "__main__":
    main()
