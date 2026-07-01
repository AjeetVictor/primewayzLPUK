from pathlib import Path

replacements = {
    "Learn more about website visibility support": "Explore website visibility support",
    "Learn more about CRM automation support": "Explore CRM automation support",
    "Learn more about how it works": "See how Primewayz UK works",
    ">Learn more<": ">Explore service details<",
    "label: 'Learn more'": "label: 'Explore service details'",
    'label: "Learn more"': 'label: "Explore service details"',
    "cta: 'Learn more'": "cta: 'Explore service details'",
    'cta: "Learn more"': 'cta: "Explore service details"',
    "text: 'Learn more'": "text: 'Explore service details'",
    'text: "Learn more"': 'text: "Explore service details"',
}

for path in Path("src").rglob("*"):
    if path.suffix.lower() not in [".ts", ".tsx", ".js", ".jsx"]:
        continue

    text = path.read_text(encoding="utf-8")
    original = text

    for old, new in replacements.items():
        text = text.replace(old, new)

    if text != original:
        path.write_text(text, encoding="utf-8")
        print("Updated", path)
