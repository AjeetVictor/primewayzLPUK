from pathlib import Path
from PIL import Image

# Folder containing the original PNG card images
image_dir = Path("public/images/delivery-cards")

# Card definitions: original file, target webp, and alt text for SEO
cards = {
    "product-engineering": {
        "file": "product-engineering.png",
        "webp": "product-engineering.webp",
        "alt": "Illustration showing Product Engineering on subscription with workflow and teamwork"
    },
    "frontend-ux": {
        "file": "frontend-ux.png",
        "webp": "frontend-ux.webp",
        "alt": "Illustration showing Frontend and UX Delivery with clean interface mockups"
    },
    "backend-integrations": {
        "file": "backend-integrations.png",
        "webp": "backend-integrations.webp",
        "alt": "Illustration showing Backend and Integrations with servers and cloud workflow"
    },
    "qa-stabilization": {
        "file": "qa-stabilization.png",
        "webp": "qa-stabilization.webp",
        "alt": "Illustration showing QA, Refinement, and Stabilization process with checks"
    },
    "automation-efficiency": {
        "file": "automation-efficiency.png",
        "webp": "automation-efficiency.webp",
        "alt": "Illustration showing Automation and Operational Efficiency workflow"
    },
    "flexible-output": {
        "file": "flexible-output.png",
        "webp": "flexible-output.webp",
        "alt": "Illustration showing Flexible Output for Long-Term Growth and business metrics"
    }
}

# Process each card image
for key, data in cards.items():
    src_file = image_dir / data["file"]
    target_file = image_dir / data["webp"]

    if not src_file.exists():
        print(f"SKIPPED: Source not found: {src_file}")
        continue

    with Image.open(src_file) as img:
        img = img.convert("RGBA")  # Preserve transparency if any
        img.save(target_file, "WEBP", quality=82, method=6)

    print(f"CREATED: {target_file} with alt='{data['alt']}'")

print("All card images processed successfully.")
