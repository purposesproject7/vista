# Renders the PNG/ICO favicons from the same geometry as public/favicon.svg
# (no SVG rasterizer needed). Re-run after changing the SVG:
#   python client/scripts/favicons.py
from pathlib import Path
from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parent.parent / "public"
SS = 8  # supersampling for smooth edges


def render(size, rounded=True):
    s = size * SS / 64  # SVG units -> pixels
    img = Image.new("RGBA", (size * SS,) * 2, (0, 0, 0, 0))
    top, bottom = (0x3B, 0x82, 0xF6), (0x1D, 0x4E, 0xD8)
    grad = Image.new("RGBA", img.size)
    gd = ImageDraw.Draw(grad)
    for y in range(img.height):
        t = y / (img.height - 1)
        gd.line([(0, y), (img.width, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=14 * s if rounded else 0, fill=255)
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)
    cx, cy, r = 19.5 * s, 18 * s, 5 * s
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill="#fbbf24")
    pts = [(17 * s, 30 * s), (29.5 * s, 46 * s), (48 * s, 18 * s)]
    w = 7.5 * s
    d.line(pts, fill="white", width=round(w), joint="curve")
    for x, y in pts:  # round caps
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill="white")
    return img.resize((size, size), Image.LANCZOS)


# iOS draws its own rounded corners on home-screen icons, so that one is square.
render(180, rounded=False).save(PUBLIC / "apple-touch-icon.png")
ico = render(64)
ico.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("wrote apple-touch-icon.png, favicon.ico")
