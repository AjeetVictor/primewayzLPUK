import { existsSync } from 'node:fs';
import { SDAAS_SUPPORTING_ARTICLES } from '../src/data/sdaas/supportingArticlesRegistry.ts';
import { relatedLiveLinks } from '../src/data/sdaas/pillarArticle.ts';
import { comparisonRelatedLiveLinks } from '../src/data/sdaas/comparisonArticle.ts';
import { useCasesRelatedLiveLinks } from '../src/data/sdaas/useCasesArticle.ts';
import { contentClusters } from '../src/data/contentClusters/index.ts';
import { SDAAS_PAGE_PATH } from '../src/data/sdaas/commercialPage.ts';

const phrases = [
  'ongoing and evolving work',
  'shared backlog',
  'recurring delivery capacity',
  'without restarting procurement',
  'fixed-price is suitable when',
  'subscription is suitable when',
  '24/7 support included',
  'guaranteed delivery',
  'unlimited development',
  'automatically rolls over',
  'automatic rollover',
];

function flattenArticle(a: (typeof SDAAS_SUPPORTING_ARTICLES)[number]) {
  const parts: string[] = [
    a.directAnswer,
    a.directAnswerFollow || '',
    ...(a.introParagraphs || []),
    ...(a.conclusion?.paragraphs || []),
  ];
  for (const s of a.sections) {
    for (const b of s.blocks) {
      if (b.type === 'paragraphs') parts.push(...b.texts);
      if (b.type === 'bullets') parts.push(...b.items);
      if (b.type === 'callout') parts.push(b.text);
      if (b.type === 'checklist') parts.push(...b.items);
      if (b.type === 'geo') parts.push(...b.statements);
      if (b.type === 'subsection') {
        parts.push(b.title, ...(b.paragraphs || []), ...(b.bullets || []));
      }
      if (b.type === 'table') parts.push(...b.headers, ...b.rows.flat());
      if (b.type === 'scorecard') {
        parts.push(...b.categories.flatMap((c) => [c.name, ...c.prompts]));
      }
    }
  }
  for (const f of a.faqs) parts.push(f.question, f.answer);
  return parts.join('\n').toLowerCase();
}

console.log('=== TITLES & METAS ===');
const titles = new Set<string>();
const metas = new Set<string>();
for (const a of SDAAS_SUPPORTING_ARTICLES) {
  titles.add(a.seo.title);
  metas.add(a.seo.description);
  const ukCount = (a.seo.title.match(/\bUK\b/g) || []).length;
  console.log(
    `${a.cardCategory.padEnd(18)} | T${a.seo.title.length} D${a.seo.description.length} UK:${ukCount}`,
  );
  console.log(`  title: ${a.seo.title}`);
  console.log(`  meta:  ${a.seo.description}`);
  console.log(
    `  og:    ${a.ogImage} exists=${
      existsSync(`public${a.ogImage}`) &&
      existsSync(`public${a.ogImage.replace('.webp', '.jpg')}`)
    }`,
  );
}
console.log(`unique titles=${titles.size}/7 unique metas=${metas.size}/7`);

console.log('\n=== FORBIDDEN / REPEATED PHRASES ===');
for (const p of phrases) {
  let total = 0;
  const hits: string[] = [];
  for (const a of SDAAS_SUPPORTING_ARTICLES) {
    const text = flattenArticle(a);
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const n = (text.match(re) || []).length;
    if (n) {
      total += n;
      hits.push(`${a.slug}:${n}`);
    }
  }
  console.log(
    `${total === 0 ? 'OK' : 'COUNT'} ${p} => ${total}${hits.length ? ` | ${hits.join(', ')}` : ''}`,
  );
}

console.log('\n=== CLAIM GUARDRAILS ===');
const claimChecks = [
  { name: '24/7 support included', re: /24\/7 support included/i },
  { name: 'guaranteed delivery', re: /guaranteed delivery/i },
  { name: 'automatic rollover promise', re: /automatic(ally)? roll ?over/i },
];
for (const check of claimChecks) {
  const offenders: string[] = [];
  for (const a of SDAAS_SUPPORTING_ARTICLES) {
    if (check.re.test(flattenArticle(a))) offenders.push(a.slug);
  }
  console.log(
    `${offenders.length ? 'FAIL' : 'PASS'} ${check.name}${offenders.length ? ` | ${offenders.join(', ')}` : ''}`,
  );
}

// Rescue unknown-codebase boundary should be present
const rescue = SDAAS_SUPPORTING_ARTICLES.find((a) =>
  a.slug.includes('application-rescue'),
)!;
console.log(
  `PASS/FAIL rescue assessment boundary: ${
    /unknown codebase should normally be assessed/i.test(flattenArticle(rescue))
      ? 'PASS'
      : 'FAIL'
  }`,
);

console.log('\n=== LINK GRAPH ===');
const need = {
  pillar: [
    '/insights/software-development-subscription-vs-fixed-price',
    '/insights/software-development-subscription-use-cases',
    '/insights/how-monthly-software-development-capacity-works',
    '/insights/how-to-prioritise-software-development-requests',
    '/insights/why-businesses-move-to-continuous-software-development',
    '/insights/software-maintenance-vs-continuous-product-development',
    '/insights/how-to-choose-a-software-development-partner',
  ],
  comparison: [
    '/insights/how-monthly-software-development-capacity-works',
    '/insights/why-businesses-move-to-continuous-software-development',
    '/insights/how-to-choose-a-software-development-partner',
  ],
  useCases: [
    '/insights/how-monthly-software-development-capacity-works',
    '/insights/how-to-prioritise-software-development-requests',
    '/insights/application-rescue-and-stabilisation-before-ongoing-development',
    '/insights/technical-debt-explained-for-business-owners',
    '/insights/software-maintenance-vs-continuous-product-development',
  ],
};
function check(name: string, links: readonly { href: string }[], required: string[]) {
  const hrefs = new Set(links.map((l) => l.href));
  for (const r of required) {
    console.log(`${hrefs.has(r) ? 'OK' : 'MISSING'} ${name} -> ${r}`);
  }
  console.log(`${name} related count=${links.length}`);
}
check('pillar', relatedLiveLinks, need.pillar);
check('comparison', comparisonRelatedLiveLinks, need.comparison);
check('useCases', useCasesRelatedLiveLinks, need.useCases);

console.log('\n=== BACK TO COMMERCIAL ===');
for (const a of SDAAS_SUPPORTING_ARTICLES) {
  const ok = a.relatedLiveLinks.some((l) => l.href === SDAAS_PAGE_PATH);
  console.log(`${ok ? 'OK' : 'MISSING'} ${a.slug} related=${a.relatedLiveLinks.length}`);
}

console.log('\n=== REGISTRY ===');
const reg = contentClusters.sdaas.assets.articleRegistry || [];
console.log(
  `live=${reg.filter((r) => r.status === 'live').length} planned=${reg.filter((r) => r.status === 'planned').length}`,
);
console.log(
  'decision placeholder=',
  reg.some((r) => r.route.includes('is-software-development-subscription-right')),
);

console.log('\n=== DATES ===');
for (const a of SDAAS_SUPPORTING_ARTICLES) {
  console.log(
    `${a.slug}: ${a.seo.datePublished} / ${a.seo.dateModified} equal=${
      a.seo.datePublished === a.seo.dateModified
    }`,
  );
}

console.log('\n=== ANALYTICS NAMESPACES ===');
for (const a of SDAAS_SUPPORTING_ARTICLES) {
  console.log(`${a.analyticsNamespace} -> ${a.slug}`);
}
