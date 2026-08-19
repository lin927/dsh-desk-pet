#!/usr/bin/env python3
"""Regenerate the desk-pet embedded animated assets.

Reads a `kid--chenxin-dlut` spritesheet and writes `assets/*.webp` (per-action
animated WebP, 96x104, transparent) plus `src/client/assets.ts` (base64 data
URLs embedded in the client bundle).

Usage:  python3 scripts/generate-assets.py <path-to-spritesheet.webp>
The spritesheet is the official awesome-codex-pet
`pets/kid--chenxin-dlut/spritesheet.webp` (192x208 cells, 8 columns, rows per
action as mapped below). Requires Pillow.
"""

from __future__ import annotations

import base64
import io
import os
import sys

from PIL import Image

CELL_W, CELL_H = 192, 208
OUT_SIZE = (96, 104)
WEBP_QUALITY = 75

# Action -> (spritesheet row, per-frame durations in ms).
STATES: dict[str, tuple[int, list[int]]] = {
    'idle': (0, [280, 110, 110, 140, 140, 320]),
    'running': (7, [120, 120, 120, 120, 120, 220]),
    'waving': (3, [140, 140, 140, 280]),
    'jumping': (4, [140, 140, 140, 140, 280]),
    'failed': (5, [140, 140, 140, 140, 140, 140, 140, 240]),
}


def build_webp(atlas: Image.Image, row: int, durations: list[int]) -> bytes:
    frames = [
        atlas.crop((col * CELL_W, row * CELL_H, (col + 1) * CELL_W, (row + 1) * CELL_H))
        .convert('RGBA')
        .resize(OUT_SIZE, Image.Resampling.NEAREST)
        for col in range(len(durations))
    ]
    buf = io.BytesIO()
    frames[0].save(
        buf, format='WEBP', save_all=True, append_images=frames[1:],
        duration=durations, loop=0, lossless=False, quality=WEBP_QUALITY,
        method=6, exact=True,
    )
    return buf.getvalue()


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    atlas = Image.open(sys.argv[1])
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(root, 'assets')
    os.makedirs(assets_dir, exist_ok=True)

    lines = []
    for name, (row, durations) in STATES.items():
        data = build_webp(atlas, row, durations)
        with open(os.path.join(assets_dir, f'{name}.webp'), 'wb') as fh:
            fh.write(data)
        b64 = base64.b64encode(data).decode('ascii')
        lines.append(f"  {name}: 'data:image/webp;base64,{b64}',")
        print(f'wrote assets/{name}.webp ({len(data)} bytes)')

    header = (
        '/**\n'
        ' * Embedded animated assets for the desk pet, generated from the\n'
        ' * awesome-codex-pet `kid--chenxin-dlut` spritesheet (Kaito Kid). Each value is\n'
        ' * a self-contained `data:image/webp;base64,…` URL so the pet renders with zero\n'
        ' * network dependency. Regenerate with scripts/generate-assets.py.\n'
        ' */\n'
        '\n'
        '/** Action key -> animated WebP data URL. */\n'
        'export const PET_ASSETS: Record<string, string> = {\n'
    )
    with open(os.path.join(root, 'src', 'client', 'assets.ts'), 'w') as fh:
        fh.write(header + '\n'.join(lines) + '\n}\n')
    print('wrote src/client/assets.ts')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
