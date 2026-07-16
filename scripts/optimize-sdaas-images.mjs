import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const sourceDir = path.resolve('public/articles/sdaas');
const outputDir = sourceDir;

const mappings = [
  {
    source: 'Monthly software delivery workflow illustration.jpg',
    slug: 'monthly-delivery-workflow',
  },
  {
    source: 'Two software delivery models comparison.jpg',
    slug: 'delivery-models-comparison',
  },
  {
    source: 'From scattered to structured systems.jpg',
    slug: 'scattered-to-structured',
  },
  {
    source: 'How software delivery works step by step.jpg',
    slug: 'delivery-process',
  },
  {
    source: 'Monthly capacity allocation infographic.jpg',
    slug: 'monthly-capacity',
  },
  {
    source: 'Subscription vs fixed-price vs direct hiring.jpg',
    slug: 'subscription-vs-fixed-price',
  },
  {
    source: 'Onboarding journey in 6 steps.jpg',
    slug: 'onboarding-journey',
  },
  {
    source: "Let's build what's next together.jpg",
    slug: 'consultation-cta',
  },
  {
    source: 'Trust and governance framework overview.jpg',
    slug: 'trust-and-governance',
  },
  {
    source: 'Capabilities overview and monthly development plan.jpg',
    slug: 'capabilities-overview',
  },
];

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 84;
const JPEG_QUALITY = 85;

async function optimizeOne({ source, slug }) {
  const inputPath = path.join(sourceDir, source);
  const jpgOut = path.join(outputDir, `${slug}.jpg`);
  const webpOut = path.join(outputDir, `${slug}.webp`);

  const pipeline = sharp(inputPath).rotate().resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
  });

  await pipeline
    .clone()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(jpgOut);

  await pipeline
    .clone()
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(webpOut);

  const meta = await sharp(webpOut).metadata();

  return {
    slug,
    width: meta.width ?? MAX_WIDTH,
    height: meta.height ?? Math.round(MAX_WIDTH * 0.5625),
    jpgOut,
    webpOut,
  };
}

async function main() {
  const results = [];

  for (const mapping of mappings) {
    results.push(await optimizeOne(mapping));
    console.log(`[sdaas-images] ${mapping.slug} -> ${mapping.slug}.webp`);
  }

  const manifest = results.map((item) => ({
    slug: item.slug,
    basePath: `/articles/sdaas/${item.slug}`,
    width: item.width,
    height: item.height,
  }));

  await fs.writeFile(
    path.join(outputDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(`\n[sdaas-images] Wrote manifest.json (${manifest.length} assets)`);
}

main().catch((error) => {
  console.error('[sdaas-images] Failed:', error);
  process.exit(1);
});
