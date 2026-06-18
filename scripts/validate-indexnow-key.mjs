/**
 * Manual validation for IndexNow key file route.
 *
 * Usage (server must be running on PORT, default 3000):
 *   npm run validate:indexnow-key
 *
 * Also run Bing checks separately:
 *   npm run validate:bing
 */

const INDEXNOW_KEY = 'b477408d1a358457fb3b6d0b8e032ee3';
const port = process.env.PORT || '3000';
const baseUrl = `http://localhost:${port}`;
const keyUrl = `${baseUrl}/${INDEXNOW_KEY}.txt`;

async function main() {
  let failed = false;

  console.log(`Validating IndexNow key at ${keyUrl}\n`);

  const res = await fetch(keyUrl);
  const body = await res.text();
  const contentType = res.headers.get('content-type') || '';

  console.log(`--- curl -i ${keyUrl} (equivalent) ---`);
  console.log(`HTTP/${res.status} ${res.statusText}`);
  console.log(`content-type: ${contentType}`);
  console.log('');

  if (res.status !== 200) {
    console.error('FAIL: key route did not return 200');
    failed = true;
  }

  if (!contentType.includes('text/plain')) {
    console.error(`FAIL: expected text/plain, got ${contentType}`);
    failed = true;
  }

  if (body !== INDEXNOW_KEY) {
    console.error(`FAIL: body mismatch (expected exactly "${INDEXNOW_KEY}")`);
    failed = true;
  }

  if (body.includes('<div id="root"') || body.includes('<!--ssr-outlet-->')) {
    console.error('FAIL: response contains React/SSR HTML');
    failed = true;
  }

  console.log('--- body ---');
  console.log(body);
  console.log('');

  if (failed) {
    process.exit(1);
  }

  console.log('IndexNow key validation passed.');
  console.log('Tip: also run npm run validate:bing to confirm Bing verification is intact.');
}

main().catch((error) => {
  console.error('Validation script error:', error.message);
  console.error('Is the server running? Try: npm run start (after build) or npm run dev');
  process.exit(1);
});
