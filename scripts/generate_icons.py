#!/usr/bin/env python3
"""Gera ícones PNG para PWA a partir de icon.svg usando cairosvg ou Pillow."""
import os, sys

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
ICONS_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

try:
    import cairosvg
    SVG_PATH = os.path.join(ICONS_DIR, "icon.svg")
    for size in SIZES:
        out = os.path.join(ICONS_DIR, f"icon-{size}.png")
        cairosvg.svg2png(url=SVG_PATH, write_to=out, output_width=size, output_height=size)
        print(f"  ✓ {out}")
    # Maskable (safe zone padding ~10%)
    for size in [192, 512]:
        out = os.path.join(ICONS_DIR, f"icon-{size}-maskable.png")
        cairosvg.svg2png(url=SVG_PATH, write_to=out, output_width=size, output_height=size)
        print(f"  ✓ maskable {out}")
except ImportError:
    print("cairosvg not available — creating placeholder PNGs with Pillow")
    try:
        from PIL import Image, ImageDraw, ImageFont

        def make_icon(size: int, maskable: bool = False) -> Image.Image:
            img = Image.new("RGBA", (size, size), (5, 5, 8, 255))
            draw = ImageDraw.Draw(img)
            # Padding extra para maskable (safe zone = 20%)
            pad = int(size * 0.20) if maskable else int(size * 0.12)
            # Fundo circular violet com gradiente simulado
            draw.ellipse([pad, pad, size - pad, size - pad], fill=(124, 92, 252, 255))
            # Círculo interno mais claro (highlight)
            inner_pad = pad + size // 8
            draw.ellipse([inner_pad, pad + 4, size - inner_pad, size // 2],
                         fill=(155, 130, 253, 80))
            return img

        # Ícones normais
        for size in SIZES:
            img = make_icon(size)
            out = os.path.join(ICONS_DIR, f"icon-{size}.png")
            img.save(out, "PNG")
            print(f"  ✓ {out}")

        # Ícones maskable (com safe zone extra)
        for size in [192, 512]:
            img = make_icon(size, maskable=True)
            out = os.path.join(ICONS_DIR, f"icon-{size}-maskable.png")
            img.save(out, "PNG")
            print(f"  ✓ maskable {out}")
    except ImportError:
        print("Neither cairosvg nor Pillow available. Install one: pip install cairosvg")
        sys.exit(1)

print("Icons generated successfully!")
