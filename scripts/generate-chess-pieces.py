"""Generate the Christian chess pieces with the OpenAI image API.

Each piece is drawn as the character alone (no pedestal, transparent
background), with the team's supplied king as the style reference
(src/assets/chess/source/<team>-king.webp): the same chibi look, red clothes
for the New Testament like Jesus' cloak and royal blue for the Old like King
David's robe. Raw pictures go to the folder given (default chess-raw/ next to
this script); scripts/make-chess.py then stands each one on its team's pedestal.

    OPENAI_API_KEY=... python3 scripts/generate-chess-pieces.py [names...]

Without OPENAI_API_KEY the request is sent without a key, for environments
whose network proxy adds it.
"""
import base64, concurrent.futures as cf, os, sys, requests

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("CHESS_RAW", os.path.join(HERE, "chess-raw"))
SRC = os.path.join(os.path.dirname(HERE), "src", "assets", "chess", "source")
CA = os.environ.get("REQUESTS_CA_BUNDLE") or None
KEY = os.environ.get("OPENAI_API_KEY")

COLOUR = {
    "nt": "The main colour of the clothes is the same warm red as Jesus' cloak in the picture, with white and gold details.",
    "ot": "The main colour of the clothes is the same royal blue as King David's robe in the picture, with white and gold details.",
}
PIECES = {
    "nt-queen": "Mary, mother of Jesus, as the queen: a gentle young woman with long brown hair, a red mantle over a white dress, a small gold crown with a little cross, hands folded.",
    "nt-bishop": "John the Baptist as the bishop: a friendly young man with wild curly brown hair and a beard, a red cloak over a camel-hair tunic, holding a tall thin wooden staff topped with a small cross.",
    "nt-knight": "the gentle grey donkey that carried Jesus into Jerusalem, as the knight: a cute chibi donkey standing on its four legs, seen from the front three-quarter view, with a red and gold saddle blanket and a green palm leaf in its mouth.",
    "nt-rook": "the Temple of Jerusalem as the rook: a small chunky cream-coloured stone temple tower with columns, gold trim, a gold roof edge and red banners.",
    "nt-pawn": "an apostle as the pawn: a smiling young fisherman with a short brown beard, a red robe over a white tunic, holding a small fishing net; a little shorter and simpler than the king.",
    "ot-queen": "Queen Esther as the queen: a beautiful Persian queen with long dark hair, a jewelled gold crown and earrings, a royal blue gown with gold trim.",
    "ot-bishop": "Moses as the bishop: an old man with a long white beard, a royal blue robe, holding a wooden shepherd's staff and the two stone tablets of the Law.",
    "ot-knight": "Elijah's chariot of fire as the knight: a cute chibi horse made of bright orange and golden flames, standing on its four legs, seen from the front three-quarter view, harnessed to a small royal blue and gold chariot.",
    "ot-rook": "the Tower of Babel as the rook: a chunky round stepped tower of sandy bricks with arched windows and royal blue and gold banners at the top.",
    "ot-pawn": "one of the twelve sons of Israel as the pawn: a young shepherd with a short brown beard, a royal blue robe over a white tunic and a headband, holding a simple shepherd's crook; a little shorter and simpler than the king.",
}


def generate(name):
    path = os.path.join(OUT, f"{name}.png")
    if os.path.exists(path):
        return name, "exists"
    team = name[:2]
    prompt = (
        "Use this chess-piece figure only as the style reference. Draw a new, different figure: "
        f"{PIECES[name]} Exactly the same art style as the reference: a cute chibi 3D cartoon figure with a big "
        "head, big friendly brown eyes and soft warm painterly shading, the same level of detail. "
        f"{COLOUR[team]} Show the whole figure from top to bottom, standing upright, facing the viewer, centred. "
        "Important: draw NO pedestal, no base, no ground and no shadow under it; the figure stands on nothing, "
        "on a fully transparent background. No text."
    )
    with open(os.path.join(SRC, f"{team}-king.webp"), "rb") as ref:
        r = requests.post(
            "https://api.openai.com/v1/images/edits",
            files={"image[]": ("king.webp", ref, "image/webp")},
            data={
                "model": "gpt-image-1.5",
                "prompt": prompt,
                "size": "1024x1536",
                "background": "transparent",
                "output_format": "png",
                "quality": "medium",
                "input_fidelity": "high",
                "n": "1",
            },
            headers={"Authorization": f"Bearer {KEY}"} if KEY else {},
            timeout=400,
            verify=CA or True,
        )
    if r.status_code != 200:
        return name, f"error {r.status_code}: {r.text[:300]}"
    with open(path, "wb") as f:
        f.write(base64.b64decode(r.json()["data"][0]["b64_json"]))
    return name, "ok"


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or list(PIECES)
    with cf.ThreadPoolExecutor(max_workers=5) as pool:
        for name, status in pool.map(generate, names):
            print(name, status, flush=True)
