from pathlib import Path
from datetime import datetime

# Path to JSX component
jsx_file = Path(r"src/components/HowItWorks.tsx")

# Card images mapping
cards = {
    "Product Engineering on Subscription": {
        "img": "/images/delivery-cards/product-engineering.webp",
        "alt": "Illustration showing Product Engineering on subscription with workflow and teamwork"
    },
    "Frontend and UX Delivery": {
        "img": "/images/delivery-cards/frontend-ux.webp",
        "alt": "Illustration showing Frontend and UX Delivery with clean interface mockups"
    },
    "Backend and Integrations": {
        "img": "/images/delivery-cards/backend-integrations.webp",
        "alt": "Illustration showing Backend and Integrations with servers and cloud workflow"
    },
    "QA, Refinement, and Stabilization": {
        "img": "/images/delivery-cards/qa-stabilization.webp",
        "alt": "Illustration showing QA, Refinement, and Stabilization process with checks"
    },
    "Automation and Operational Efficiency": {
        "img": "/images/delivery-cards/automation-efficiency.webp",
        "alt": "Illustration showing Automation and Operational Efficiency workflow"
    },
    "Flexible Output for Long-Term Growth": {
        "img": "/images/delivery-cards/flexible-output.webp",
        "alt": "Illustration showing Flexible Output for Long-Term Growth and business metrics"
    }
}

# Read JSX
text = jsx_file.read_text(encoding="utf-8")

# Insert <img> above each card title
for title, data in cards.items():
    lines = text.splitlines()
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if title in line:
            img_tag = f'            <img src="{data["img"]}" alt="{data["alt"]}" className="w-full aspect-[16/9] object-contain object-center rounded-xl mb-3" />'
            new_lines.insert(len(new_lines), img_tag)
    text = "\n".join(new_lines)

# Create backup with timestamp if exists
backup_file = jsx_file.with_suffix(".tsx.bak")
if backup_file.exists():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    backup_file = jsx_file.with_name(f"{jsx_file.stem}_{timestamp}.tsx.bak")

jsx_file.rename(backup_file)
backup_file.write_text(backup_file.read_text(encoding="utf-8"), encoding="utf-8")

# Write updated JSX
jsx_file.write_text(text, encoding="utf-8")

print(f"Updated JSX with images: {jsx_file}")
print(f"Backup created: {backup_file}")
