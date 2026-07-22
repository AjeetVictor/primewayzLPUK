import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { resolveAuthorityProofStories } from '../components/sections/AuthorityProofSection.tsx';
import {
  APPROVED_PUBLIC_STORY_SLUGS,
  getPublishedSuccessStories,
  getSuccessStoryPath,
  RETIRED_ILLUSTRATIVE_STORY_SLUGS,
} from './successStories.ts';

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const EXTERNAL_URL_PATTERN = /https?:\/\/(?!uk\.primewayz\.com|primewayz\.com|www\.linkedin\.com)[^\s)"']+/i;
const METRIC_CLAIM_PATTERN = /\b\d+(?:\.\d+)?\s*%|\b£\s*\d|\$\s*\d|\bGBP\s*\d|\bUSD\s*\d/i;

const ROOT = process.cwd();

function readRepoFile(...parts: string[]): string {
  return readFileSync(path.join(ROOT, ...parts), 'utf8');
}

function collectSourceFiles(dir: string, collected: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      collectSourceFiles(fullPath, collected);
      continue;
    }
    if (/\.(tsx?|jsx?|md|xml)$/.test(entry)) {
      collected.push(fullPath);
    }
  }
  return collected;
}

test('AuthorityProofSection resolves only published story slugs', () => {
  const resolved = resolveAuthorityProofStories([
    'wholesale-order-management-platform',
    'not-a-real-authority-story',
    'rentreadbuy-book-rental-platform',
    RETIRED_ILLUSTRATIVE_STORY_SLUGS[0],
  ]);

  assert.deepEqual(
    resolved.map((story) => story.slug),
    ['wholesale-order-management-platform', 'rentreadbuy-book-rental-platform'],
  );
  assert.equal(resolved.every((story) => story.publicationStatus === 'published'), true);
});

test('every resolved proof story link uses an approved public story path', () => {
  const stories = resolveAuthorityProofStories([...APPROVED_PUBLIC_STORY_SLUGS]);
  assert.equal(stories.length, 3);
  for (const story of stories) {
    assert.equal(getSuccessStoryPath(story.slug), `/success-stories/${story.slug}`);
    assert.ok((APPROVED_PUBLIC_STORY_SLUGS as readonly string[]).includes(story.slug));
  }
});

test('public story count remains exactly three', () => {
  assert.equal(getPublishedSuccessStories().length, 3);
});

test('no retired story slugs remain in active React components or content data', () => {
  const scanRoots = [
    path.join(ROOT, 'src', 'components'),
    path.join(ROOT, 'src', 'data'),
    path.join(ROOT, 'src', 'constants'),
    path.join(ROOT, 'src', 'lib'),
  ];

  const allowlistSuffixes = [
    path.join('data', 'successStories.ts'),
    path.join('constants', 'canonicalRoutes.ts'),
  ];

  for (const root of scanRoots) {
    for (const filePath of collectSourceFiles(root)) {
      if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) continue;
      if (allowlistSuffixes.some((suffix) => filePath.endsWith(suffix))) continue;
      const contents = readFileSync(filePath, 'utf8');
      for (const retiredSlug of RETIRED_ILLUSTRATIVE_STORY_SLUGS) {
        assert.equal(
          contents.includes(retiredSlug),
          false,
          `Retired slug "${retiredSlug}" found in ${path.relative(ROOT, filePath)}`,
        );
      }
    }
  }
});

test('visibility proof uses RentReadBuy', () => {
  const source = readRepoFile('src', 'components', 'WebsiteMaintenanceSubscriptionUkPage.tsx');
  assert.match(source, /isVisibilityPage[\s\S]*?rentreadbuy-book-rental-platform/);
  assert.match(
    source,
    /storySlugs=\{\['rentreadbuy-book-rental-platform',\s*'restaurant-self-ordering-platform'\]\}/,
  );
});

test('CRM proof uses wholesale story', () => {
  const source = readRepoFile('src', 'components', 'CrmIntegrationSupportUkPage.tsx');
  assert.match(source, /id="crm-authority-proof"/);
  assert.match(source, /storySlugs=\{\['wholesale-order-management-platform'\]\}/);
});

test('software proof uses approved stories only', () => {
  const source = readRepoFile('src', 'components', 'SoftwareDevelopmentSubscriptionUkPage.tsx');
  assert.match(source, /id="sdaas-authority-proof"/);
  assert.match(source, /rentreadbuy-book-rental-platform/);
  assert.match(source, /wholesale-order-management-platform/);
  assert.match(source, /restaurant-self-ordering-platform/);
  for (const retiredSlug of RETIRED_ILLUSTRATIVE_STORY_SLUGS) {
    assert.equal(source.includes(retiredSlug), false);
  }
});

test('maintenance proof uses wholesale and/or RentReadBuy', () => {
  const source = readRepoFile('src', 'components', 'WebsiteMaintenanceSubscriptionUkPage.tsx');
  assert.match(source, /isMaintenancePage[\s\S]*?wholesale-order-management-platform/);
  assert.match(
    source,
    /storySlugs=\{\['wholesale-order-management-platform',\s*'rentreadbuy-book-rental-platform'\]\}/,
  );
});

test('remote IT proof uses wholesale story', () => {
  const source = readRepoFile('src', 'components', 'RemoteItResourceAugmentationPage.tsx');
  assert.match(source, /id="remote-it-authority-proof"/);
  assert.match(source, /storySlugs=\{\['wholesale-order-management-platform'\]\}/);
});

test('proof block copy contains no percentage or currency claims', () => {
  const proofFiles = [
    'src/components/sections/AuthorityProofSection.tsx',
    'src/components/WebsiteMaintenanceSubscriptionUkPage.tsx',
    'src/components/CrmIntegrationSupportUkPage.tsx',
    'src/components/SoftwareDevelopmentSubscriptionUkPage.tsx',
    'src/components/RemoteItResourceAugmentationPage.tsx',
    'src/components/SuccessStories.tsx',
  ];

  for (const relativePath of proofFiles) {
    const source = readFileSync(path.join(ROOT, relativePath), 'utf8');
    const proofCopyChunks = source.match(
      /(?:eyebrow|heading|introduction|ctaLabel)=["`][^"`]+["`]/g,
    ) ?? [];
    for (const chunk of proofCopyChunks) {
      assert.doesNotMatch(chunk, METRIC_CLAIM_PATTERN, `Metric claim in ${relativePath}: ${chunk}`);
    }
  }

  for (const story of resolveAuthorityProofStories([...APPROVED_PUBLIC_STORY_SLUGS])) {
    assert.doesNotMatch(story.summary, METRIC_CLAIM_PATTERN);
    assert.doesNotMatch(story.keyOutcome, METRIC_CLAIM_PATTERN);
  }
});

test('LinkedIn authority document exists with approved tagline and no confidential contact leakage', () => {
  const linkedInPath = path.join(ROOT, 'Docs', 'linkedin-authority-content-plan.md');
  const contents = readFileSync(linkedInPath, 'utf8');

  assert.match(contents, /Reliable digital systems and technical delivery for UK SMEs\./);
  assert.doesNotMatch(contents, EMAIL_PATTERN);
  assert.doesNotMatch(contents, EXTERNAL_URL_PATTERN);
  assert.doesNotMatch(contents, /cheap labour/i);

  for (const slug of APPROVED_PUBLIC_STORY_SLUGS) {
    assert.ok(contents.includes(`/success-stories/${slug}`), `Missing approved story link: ${slug}`);
  }

  for (const retiredSlug of RETIRED_ILLUSTRATIVE_STORY_SLUGS) {
    assert.equal(contents.includes(retiredSlug), false, `Retired slug in LinkedIn plan: ${retiredSlug}`);
  }
});

test('Services local-trades card points to website visibility support, not a story', () => {
  const source = readRepoFile('src', 'components', 'ServicesPage.tsx');
  const localTradesMatch = source.match(
    /title:\s*'Local trades and service businesses',\s*href:\s*([^,]+),/,
  );
  assert.ok(localTradesMatch, 'Local trades industry card not found');
  assert.equal(localTradesMatch[1].trim(), 'CANONICAL_ROUTES.websiteVisibilitySupport');
  assert.doesNotMatch(localTradesMatch[1], /getSuccessStoryPath|restaurant-self-ordering/);
});

test('application-rescue mappings use the wholesale authority story', () => {
  const entityTerms = readRepoFile('src', 'data', 'contentClusters', 'entityTerms.ts');
  const clusters = readRepoFile('src', 'data', 'contentClusters', 'index.ts');
  const rescueArticle = readRepoFile('src', 'data', 'sdaas', 'applicationRescueArticle.ts');

  assert.match(
    entityTerms,
    /existingAppRescue:[\s\S]*?getSuccessStoryPath\('wholesale-order-management-platform'\)/,
  );
  assert.match(
    clusters,
    /id:\s*'appRescue'[\s\S]*?getSuccessStoryPath\('wholesale-order-management-platform'\)/,
  );
  assert.match(rescueArticle, /getSuccessStoryPath\('wholesale-order-management-platform'\)/);
  assert.doesNotMatch(rescueArticle, /rentreadbuy-book-rental-platform/);
  assert.doesNotMatch(rescueArticle, /RentReadBuy/);
});

test('application-rescue content does not describe RentReadBuy as stabilised or rescued', () => {
  const rescueArticle = readRepoFile('src', 'data', 'sdaas', 'applicationRescueArticle.ts');
  assert.doesNotMatch(rescueArticle, /RentReadBuy[\s\S]{0,80}(?:stabilis|rescued|rescue)/i);
  assert.doesNotMatch(rescueArticle, /(?:stabilis|rescued|rescue)[\s\S]{0,80}RentReadBuy/i);
});

test('enquiry-flow audit action points to website visibility support', () => {
  const source = readRepoFile('src', 'constants', 'auditCategoryActionLinks.ts');
  assert.match(
    source,
    /'lead-capture':[\s\S]*?href:\s*CANONICAL_ROUTES\.websiteVisibilitySupport/,
  );
  assert.doesNotMatch(source, /getSuccessStoryPath/);
  assert.doesNotMatch(source, /restaurant-self-ordering-platform/);
});

test('public proof labels use restrained wording', () => {
  const successStoriesPage = readRepoFile('src', 'components', 'SuccessStoriesPage.tsx');
  const proofSection = readRepoFile('src', 'components', 'sections', 'AuthorityProofSection.tsx');
  const storyDetail = readRepoFile('src', 'components', 'AuthorityStoryDetailPage.tsx');

  assert.match(successStoriesPage, /Delivery experience/);
  assert.match(proofSection, /Delivery highlight/);
  assert.match(storyDetail, /Delivery outcomes/);
  assert.match(
    storyDetail,
    /Qualitative outcomes we can state publicly without relying on unsupported performance metrics\./,
  );

  for (const source of [successStoriesPage, proofSection, storyDetail]) {
    assert.doesNotMatch(source, /Delivery evidence/);
    assert.doesNotMatch(source, /Evidence highlight/);
    assert.doesNotMatch(source, /Verified qualitative outcomes/);
    assert.doesNotMatch(source, /Documented results based on approved delivery evidence/);
  }
});

test('legacy redirect handler preserves query and uses slashless canonical targets', () => {
  const serverSource = readRepoFile('server.ts');
  assert.match(
    serverSource,
    /const queryIndex = req\.originalUrl\.indexOf\('\?'\);\s*const search = queryIndex >= 0 \? req\.originalUrl\.slice\(queryIndex\) : '';\s*res\.redirect\(301, `\$\{toPath\}\$\{search\}`\);/,
  );
  assert.doesNotMatch(serverSource, /const suffix = req\.originalUrl\.slice\(matchedPath\.length\)/);
});

test('malformed success-story slug decoding returns the existing 404 payload', () => {
  const serverSource = readRepoFile('server.ts');
  assert.match(
    serverSource,
    /successStoryMatch[\s\S]*?try\s*\{[\s\S]*?decodeURIComponent\(successStoryMatch\[1\]\)[\s\S]*?\}\s*catch\s*\{[\s\S]*?statusCode:\s*404[\s\S]*?Success Story Not Found/,
  );
});
