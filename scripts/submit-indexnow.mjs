/**
 * Submit priority URLs to IndexNow after production deploy.
 * Run manually only when key file is publicly reachable.
 *
 * Usage:
 *   npm run submit:indexnow
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow';

const payload = {
  host: 'uk.primewayz.com',
  key: 'b477408d1a358457fb3b6d0b8e032ee3',
  keyLocation: 'https://uk.primewayz.com/b477408d1a358457fb3b6d0b8e032ee3.txt',
  urlList: [
    'https://uk.primewayz.com/',
    'https://uk.primewayz.com/software-development-subscription-uk',
    'https://uk.primewayz.com/website-maintenance-subscription-uk',
    'https://uk.primewayz.com/crm-integration-support-uk',
    'https://uk.primewayz.com/blog',
  ],
};

async function main() {
  console.log(`Host: ${payload.host}`);
  console.log(`Key location: ${payload.keyLocation}`);
  console.log(`URLs: ${payload.urlList.length}`);
  console.log('');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  console.log(`Response status: ${res.status}`);
  if (text) {
    console.log(`Response body: ${text}`);
  }

  if (res.status === 200 || res.status === 202) {
    console.log('\nIndexNow submission succeeded.');
    return;
  }

  console.error('\nIndexNow submission failed.');
  process.exitCode = 1;
}

main().catch((error) => {
  console.error('Submit script error:', error.message);
  process.exitCode = 1;
});
