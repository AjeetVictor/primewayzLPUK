from pathlib import Path
from PIL import Image, ImageChops

source = Path("public/images/process-delivery/how-delivery-works-infographic.png")
output = Path("public/images/process-delivery/how-delivery-works-infographic.webp")

if not source.exists():
    raise FileNotFoundError(f"Source not found: {source}")

with Image.open(source) as img:
    img = img.convert("RGBA")

    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -18)
    bbox = diff.getbbox()

    if bbox:
        img = img.crop(bbox)

    if img.width < 1000:
        img = img.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)

    img.save(output, "WEBP", quality=86, method=6)

print(f"Replaced cleaned WebP: {output}")
