/**
 * Manual validation for Bing Webmaster Tools verification.
 *
 * Usage (server must be running on PORT, default 3000):
 *   node scripts/validate-bing-verification.mjs
 *   PORT=3000 node scripts/validate-bing-verification.mjs
 *
 * Or run the curl commands directly:
 *   curl -i http://localhost:3000/BingSiteAuth.xml
 *   curl -s http://localhost:3000/ | grep msvalidate.01
 *   curl -s http://localhost:3000/BingSiteAuth.xml
 */

const port = process.env.PORT || '3000';
const baseUrl = `http://localhost:${port}`;

async function main() {
  let failed = false;

  console.log(`Validating Bing verification at ${baseUrl}\n`);

  // 1. XML route headers and content type
  const xmlRes = await fetch(`${baseUrl}/BingSiteAuth.xml`);
  const xmlBody = await xmlRes.text();
  const contentType = xmlRes.headers.get('content-type') || '';

  console.log('--- curl -i http://localhost:3000/BingSiteAuth.xml (equivalent) ---');
  console.log(`HTTP/${xmlRes.status} ${xmlRes.statusText}`);
  console.log(`content-type: ${contentType}`);
  console.log('');

  if (!xmlRes.ok) {
    console.error('FAIL: /BingSiteAuth.xml did not return 200');
    failed = true;
  }

  if (!contentType.includes('application/xml') && !contentType.includes('text/xml')) {
    console.error(`FAIL: expected application/xml, got ${contentType}`);
    failed = true;
  }

  if (!xmlBody.trimStart().startsWith('<?xml')) {
    console.error('FAIL: response is not XML (likely caught by SSR catch-all)');
    failed = true;
  }

  if (xmlBody.includes('<div id="root"') || xmlBody.includes('<!--ssr-outlet-->')) {
    console.error('FAIL: response contains React/SSR HTML');
    failed = true;
  }

  if (!xmlBody.includes('<user>503A5E857E52D99A468198CE6BD47F45</user>')) {
    console.error('FAIL: verification user code missing from XML');
    failed = true;
  }

  // 2. Homepage meta tag
  const homeRes = await fetch(`${baseUrl}/`);
  const homeBody = await homeRes.text();

  console.log('--- curl -s http://localhost:3000/ | grep msvalidate.01 (equivalent) ---');
  const metaMatch = homeBody.match(/<meta[^>]+name=["']msvalidate\.01["'][^>]*>/i);
  console.log(metaMatch ? metaMatch[0] : '(not found)');
  console.log('');

  if (!metaMatch) {
    console.error('FAIL: msvalidate.01 meta tag not found on homepage');
    failed = true;
  } else if (!metaMatch[0].includes('503A5E857E52D99A468198CE6BD47F45')) {
    console.error('FAIL: msvalidate.01 content mismatch');
    failed = true;
  }

  // 3. XML body only (no HTML)
  console.log('--- curl -s http://localhost:3000/BingSiteAuth.xml (body) ---');
  console.log(xmlBody.trim());
  console.log('');

  if (failed) {
    process.exit(1);
  }

  console.log('All Bing verification checks passed.');
}

main().catch((error) => {
  console.error('Validation script error:', error.message);
  console.error('Is the server running? Try: npm run start');
  process.exit(1);
});
