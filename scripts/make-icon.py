"""Render the plugin icon to PNG.

Draws the same geometry as icon.svg (a list card with two rows and a red
delete badge) at 8x supersampling and downsamples, so the rounded corners and
the badge stay clean at 96-180 px. Raster output is required by plugin
storefronts, which refuse SVG icons.

Usage: python scripts/make-icon.py
Output: assets/icon-180.png, assets/icon-512.png
"""

from pathlib import Path

from PIL import Image, ImageDraw

SCALE = 8
SIZE = 64 * SCALE  # 512 px canvas, drawn at 8x

BLUE = (36, 123, 191, 255)      # #247bbf
WHITE = (255, 255, 255, 255)
RED = (229, 72, 77, 255)        # #e5484d

ROOT = Path(__file__).resolve().parent.parent


def px(value: float) -> int:
    return int(round(value * SCALE))


def rounded(draw, box, radius, fill):
    x0, y0, x1, y1 = (px(v) for v in box)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=px(radius), fill=fill)


def main() -> None:
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Card body.
    rounded(draw, (8, 14, 56, 54), 8, BLUE)
    # Two list rows.
    rounded(draw, (18, 24, 46, 30), 3, WHITE)
    rounded(draw, (18, 36, 38, 42), 3, WHITE)
    # Delete badge: red dot with a white bar.
    draw.ellipse([px(39), px(3), px(53), px(17)], fill=RED)
    rounded(draw, (44.6, 6, 47.4, 14), 1.4, WHITE)

    assets = ROOT / "assets"
    assets.mkdir(exist_ok=True)
    image.resize((512, 512), Image.LANCZOS).save(assets / "icon-512.png")
    image.resize((180, 180), Image.LANCZOS).save(assets / "icon-180.png")
    print("wrote assets/icon-180.png and assets/icon-512.png")


if __name__ == "__main__":
    main()
