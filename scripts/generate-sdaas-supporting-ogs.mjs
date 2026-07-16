import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('public/articles/sdaas');

const articles = [
  {
    file: 'og-how-monthly-software-development-capacity-works',
    eyebrow: 'PROCESS GUIDE',
    line1: 'How Monthly Software',
    line2: 'Development Capacity Works',
    subtitle: 'Allocation, backlog, QA, releases and urgent work',
  },
  {
    file: 'og-how-to-prioritise-software-development-requests',
    eyebrow: 'PROCESS GUIDE',
    line1: 'How to Prioritise Software',
    line2: 'Development Requests',
    subtitle: 'Value, urgency, risk, effort and capacity',
  },
  {
    file: 'og-application-rescue-and-stabilisation-before-ongoing-development',
    eyebrow: 'TECHNICAL GUIDE',
    line1: 'Application Rescue and',
    line2: 'Stabilisation',
    subtitle: 'What happens before ongoing development',
  },
  {
    file: 'og-technical-debt-explained-for-business-owners',
    eyebrow: 'TECHNICAL GUIDE',
    line1: 'Technical Debt Explained',
    line2: 'for Business Owners',
    subtitle: 'Cost, speed, reliability and prioritisation',
  },
  {
    file: 'og-why-businesses-move-to-continuous-software-development',
    eyebrow: 'STRATEGY GUIDE',
    line1: 'Why Businesses Move to',
    line2: 'Continuous Development',
    subtitle: 'From fixed projects to ongoing capability',
  },
  {
    file: 'og-software-maintenance-vs-continuous-product-development',
    eyebrow: 'COMPARISON GUIDE',
    line1: 'Maintenance vs Continuous',
    line2: 'Product Development',
    subtitle: 'Service boundaries for live systems',
  },
  {
    file: 'og-how-to-choose-a-software-development-partner',
    eyebrow: 'BUYER GUIDE',
    line1: 'How to Choose a Software',
    line2: 'Development Partner',
    subtitle: 'Discovery, delivery, QA, ownership and handover',
  },
];

await fs.promises.mkdir(outDir, { recursive: true });

for (const article of articles) {
  const base = path.join(outDir, article.file);
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#000A2D"/>
      <stop offset="100%" stop-color="#0B1F4A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="80" r="220" fill="#10B981" fill-opacity="0.12"/>
  <circle cx="180" cy="560" r="180" fill="#3B82F6" fill-opacity="0.12"/>
  <text x="72" y="110" fill="#6EE7B7" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="3">${article.eyebrow}</text>
  <text x="72" y="210" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700">${article.line1}</text>
  <text x="72" y="278" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700">${article.line2}</text>
  <text x="72" y="350" fill="#CBD5E1" font-family="Arial, Helvetica, sans-serif" font-size="26">${article.subtitle}</text>
  <rect x="72" y="400" width="720" height="2" fill="#34D399" fill-opacity="0.5"/>
  <text x="72" y="470" fill="#E2E8F0" font-family="Arial, Helvetica, sans-serif" font-size="24">Software Development as a Subscription</text>
  <text x="72" y="570" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600">Primewayz UK</text>
</svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(`${base}.jpg`);
  await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(`${base}.webp`);
  console.log(`Created ${article.file}.jpg/webp`);
}
