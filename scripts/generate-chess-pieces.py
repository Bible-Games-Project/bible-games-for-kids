"""Generate the Christian chess pieces with the OpenAI image API.

The supplied Jesus king picture (src/assets/chess/source/jesus-king.webp) is
sent as the style reference, so every piece is a figure on a chess pedestal
in the same look: ivory and gold pedestals for the New Testament, dark walnut
and bronze for the Old. Raw pictures go to the folder given (default
chess-raw/ next to this script); scripts/make-chess.py then trims and
shrinks them into src/assets/chess/.

    OPENAI_API_KEY=... python3 scripts/generate-chess-pieces.py [names...]

Without OPENAI_API_KEY the request is sent without a key, for environments
whose network proxy adds it.
"""
import base64, concurrent.futures as cf, os, sys, requests

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("CHESS_RAW", os.path.join(HERE, "chess-raw"))
REF = os.path.join(os.path.dirname(HERE), "src", "assets", "chess", "source", "jesus-king.webp")
CA = os.environ.get("REQUESTS_CA_BUNDLE") or None
KEY = os.environ.get("OPENAI_API_KEY")

STYLE = (
    "Use the attached picture only as the STYLE reference: the same soft, warm, painterly 3D cartoon look "
    "of a children's Bible storybook, the same lighting, the same proportions, a figure shown full length "
    "standing on a round chess-piece pedestal, centred, facing the viewer, on a fully transparent "
    "background, no shadow on the ground, no text. Do NOT draw Jesus; draw only the new piece described here. "
)
NT_BASE = "The pedestal is ivory white with gold rims, exactly like the reference picture. "
OT_BASE = (
    "The pedestal is dark polished walnut wood with antique bronze rims (this piece belongs to the dark team), "
    "same shape as the reference pedestal. "
)
PIECES = {
    "nt-queen": NT_BASE + "Mary, mother of Jesus, as the chess queen: a kind young woman in a soft blue mantle over a white robe, a delicate gold crown, hands gently folded.",
    "nt-bishop": NT_BASE + "John the Baptist as the chess bishop: a friendly bearded man with long wavy hair, wearing a camel-hair tunic with a leather belt, holding a tall wooden staff topped with a small cross.",
    "nt-knight": NT_BASE + "The chess knight is the gentle grey donkey that carried Jesus into Jerusalem: the donkey's head, neck and chest rise from the pedestal like a chess knight, with a red and gold saddle blanket and green palm branches beside it.",
    "nt-rook": NT_BASE + "The chess rook is the Temple of Jerusalem: a small golden-white stone temple with columns and a gold roof edge, built like a chess rook on top of the pedestal.",
    "nt-pawn": NT_BASE + "An apostle as the chess pawn: a smiling young fisherman with a short beard in a simple beige robe and a light blue sash, holding a small fishing net; a smaller, simpler piece than the others.",
    "ot-king": OT_BASE + "King David as the chess king: a cheerful young bearded king with curly hair, a gold crown with rubies, a purple and gold royal robe, holding a small golden harp.",
    "ot-queen": OT_BASE + "Queen Esther as the chess queen: a beautiful Persian queen with long dark hair, a jewelled gold crown and earrings, a royal purple and gold gown.",
    "ot-bishop": OT_BASE + "Moses as the chess bishop: a wise old man with a long white beard and a brown and red robe, holding a wooden shepherd's staff and the two stone tablets of the Law.",
    "ot-knight": OT_BASE + "The chess knight is Elijah's chariot of fire: a horse made of bright orange and golden flames rearing up like a chess knight, with a small flaming chariot wheel behind it, on top of the pedestal.",
    "ot-rook": OT_BASE + "The chess rook is the Tower of Babel: a tall round stepped ziggurat tower of sandy bricks with arched windows and little scaffolding, shaped like a chess rook on top of the pedestal.",
    "ot-pawn": OT_BASE + "One of the twelve sons of Israel as the chess pawn: a young shepherd with a short beard, a striped brown and cream robe and headband, holding a simple shepherd's staff; a smaller, simpler piece than the others.",
}


def generate(name, prompt):
    path = os.path.join(OUT, f"{name}.png")
    if os.path.exists(path):
        return name, "exists"
    with open(REF, "rb") as ref:
        r = requests.post(
            "https://api.openai.com/v1/images/edits",
            files={"image[]": ("jesus.webp", ref, "image/webp")},
            data={
                "model": "gpt-image-1.5",
                "prompt": STYLE + prompt,
                "size": "1024x1536",
                "background": "transparent",
                "output_format": "png",
                "quality": "medium",
                "n": "1",
            },
            headers={"Authorization": f"Bearer {KEY}"} if KEY else {},
            timeout=300,
            verify=CA or True,
        )
    if r.status_code != 200:
        return name, f"error {r.status_code}: {r.text[:300]}"
    data = r.json()["data"][0]["b64_json"]
    with open(path, "wb") as f:
        f.write(base64.b64decode(data))
    return name, "ok"


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or list(PIECES)
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        for name, status in pool.map(lambda n: generate(n, PIECES[n]), names):
            print(name, status, flush=True)
