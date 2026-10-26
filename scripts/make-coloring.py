"""Turn the story paintings into coloring pages for the Coloring game.

For every src/assets/puzzle-<slug>.jpg this writes, into src/assets/coloring/:
  <slug>-lines.webp   896x1152 dark outlines on a transparent background
  <slug>-regions.png  448x576 map of the fillable areas: each area's number is
                      stored in the red (low byte) and green (high byte) channels

Outlines come from two sources: the borders between flat color areas (the
painting simplified with mean-shift smoothing and k-means) and the painting's
own drawn edges (Canny). The spaces between outlines become the areas a tap
fills; tiny ones are painted together with their biggest neighbour.

A hand-drawn page always wins: put black-on-white line art (any size,
896x1152 proportions) at scripts/coloring-art/<slug>.png and it is used
instead of the automatic outlines. Run it again after adding stories:

  pip install opencv-python-headless numpy scipy
  python scripts/make-coloring.py            # only stories without pages yet
  python scripts/make-coloring.py --all      # regenerate everything
"""
import glob
import os
import sys

import cv2
import numpy as np
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "src", "assets")
OUT = os.path.join(SRC, "coloring")

FULL = (896, 1152)  # outline size (w, h), same as the paintings
MAP = (448, 576)  # region map size
COLORS = 16  # flat colors the painting is reduced to
MIN_AREA = 0.0006  # areas smaller than this share of the picture are merged


def flat_labels(img):
    small = cv2.resize(img, MAP, interpolation=cv2.INTER_AREA)
    flat = cv2.pyrMeanShiftFiltering(small, sp=12, sr=26)
    lab = cv2.cvtColor(flat, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    cv2.setRNGSeed(7)
    _, labels, _ = cv2.kmeans(lab, COLORS, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    labels = labels.reshape(MAP[1], MAP[0]).astype(np.uint8)
    labels = cv2.medianBlur(labels, 7)
    # Split into connected areas and fold tiny ones (grass, sparkles) into
    # their neighbours before taking the borders.
    regions = np.zeros(labels.shape, np.int32)
    next_id = 1
    for k in range(COLORS):
        n, comp = cv2.connectedComponents((labels == k).astype(np.uint8), connectivity=4)
        mask = comp > 0
        regions[mask] = comp[mask] + next_id - 1
        next_id += n - 1
    return merge_small(regions, 0.002, across=1)


def drawing_edges(img):
    """Outlines of shapes (faces, folds, hands) the color areas would miss."""
    flat = cv2.pyrMeanShiftFiltering(img, sp=10, sr=24)
    gray = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 50, 9)
    edges = cv2.Canny(gray, 80, 170)
    return drop_specks(edges > 0, 140)


def drop_specks(mask, min_px):
    """Remove short scratches and dots; keep real contours."""
    n, comp, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    keep = np.zeros(n, bool)
    keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= min_px
    return keep[comp]


def color_borders(labels):
    edge = np.zeros(labels.shape, bool)
    edge[:, 1:] |= labels[:, 1:] != labels[:, :-1]
    edge[1:, :] |= labels[1:, :] != labels[:-1, :]
    return edge


def build_regions(lines):
    """Fillable areas are the spaces between lines. Line pixels join the
    nearest area so a fill reaches under its outline."""
    n, comp = cv2.connectedComponents((~lines).astype(np.uint8), connectivity=4)
    regions = comp.astype(np.int32)
    regions = merge_small(regions, MIN_AREA, across=2)
    # Give each line pixel (0) the id of the nearest area.
    _, (iy, ix) = ndimage.distance_transform_edt(regions == 0, return_indices=True)
    return regions[iy, ix]


def merge_small(regions, share, across):
    """Areas smaller than `share` of the picture join their biggest
    neighbour, looking up to `across` pixels away (across an outline)."""
    min_px = share * regions.size
    near = np.ones((2 * across + 1, 2 * across + 1), bool)
    areas = np.bincount(regions.ravel())
    slices = ndimage.find_objects(regions)
    for r in np.argsort(areas):
        if r == 0 or not (0 < areas[r] < min_px):
            continue
        sl = slices[r - 1]
        if sl is None:
            continue
        y0, y1 = max(sl[0].start - 3, 0), sl[0].stop + 3
        x0, x1 = max(sl[1].start - 3, 0), sl[1].stop + 3
        win = regions[y0:y1, x0:x1]
        mask = win == r
        ring = ndimage.binary_dilation(mask, near) & ~mask
        neighbours = win[ring]
        neighbours = neighbours[(neighbours != r) & (neighbours != 0)]
        if neighbours.size == 0:
            continue
        counts = np.bincount(neighbours)
        # Prefer the neighbour with the largest area among those touching.
        cand = np.nonzero(counts)[0]
        target = cand[np.argmax(areas[cand])]
        win[mask] = target
        areas[target] += areas[r]
        areas[r] = 0
    return regions


def relabel(regions):
    ids = np.unique(regions)
    lut = np.zeros(ids.max() + 1, np.int32)
    lut[ids] = np.arange(1, len(ids) + 1)
    return lut[regions]


def outlines(lines_full):
    soft = cv2.GaussianBlur(lines_full.astype(np.float32), (0, 0), 1.1)
    alpha = (np.clip(soft * 1.8, 0, 1) * 255).astype(np.uint8)
    rgba = np.zeros((FULL[1], FULL[0], 4), np.uint8)
    rgba[..., :3] = (48, 40, 56)
    rgba[..., 3] = alpha
    # Frame the page so the areas along the edges are closed too.
    cv2.rectangle(rgba, (1, 1), (FULL[0] - 2, FULL[1] - 2), (48, 40, 56, 255), 3)
    return rgba


def process(path):
    slug = os.path.basename(path)[len("puzzle-"):-len(".jpg")]
    img = cv2.imread(path)
    if img is None:
        print("skip", path)
        return
    img = cv2.resize(img, FULL, interpolation=cv2.INTER_AREA)
    custom = os.path.join(ROOT, "scripts", "coloring-art", f"{slug}.png")
    if os.path.exists(custom):
        art = cv2.imread(custom, cv2.IMREAD_GRAYSCALE)
        lines_full = cv2.resize(art, FULL, interpolation=cv2.INTER_AREA) < 128
        return finish(slug, lines_full)
    # Lines at full size: color-area borders plus drawing edges, thickened.
    borders = cv2.resize(color_borders(flat_labels(img)).astype(np.uint8), FULL, interpolation=cv2.INTER_LINEAR) > 0
    lines_full = borders | drawing_edges(img)
    lines_full = cv2.dilate(lines_full.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    lines_full = cv2.morphologyEx(lines_full.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0
    lines_full = drop_specks(lines_full, 400)
    finish(slug, lines_full)


def finish(slug, lines_full):
    """Areas on the smaller map come from the same lines as the outlines."""
    lines_map = cv2.resize(lines_full.astype(np.uint8) * 255, MAP, interpolation=cv2.INTER_AREA) > 60
    lines_map[[0, -1], :] = True
    lines_map[:, [0, -1]] = True
    regions = relabel(build_regions(lines_map))
    lines = outlines(lines_full)
    enc = np.zeros((MAP[1], MAP[0], 3), np.uint8)
    enc[..., 2] = regions & 255  # OpenCV writes BGR: index 2 is red
    enc[..., 1] = regions >> 8
    cv2.imwrite(os.path.join(OUT, f"{slug}-lines.webp"), lines, [cv2.IMWRITE_WEBP_QUALITY, 85])
    cv2.imwrite(os.path.join(OUT, f"{slug}-regions.png"), enc, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"{slug}: {regions.max()} areas")


def main():
    os.makedirs(OUT, exist_ok=True)
    every = "--all" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for path in sorted(glob.glob(os.path.join(SRC, "puzzle-*.jpg"))):
        slug = os.path.basename(path)[len("puzzle-"):-len(".jpg")]
        if only and slug not in only:
            continue
        if not every and not only and os.path.exists(os.path.join(OUT, f"{slug}-regions.png")):
            continue
        process(path)


if __name__ == "__main__":
    main()
