export type UnmatchedRouteCategory =
  | 'genuine_app_route_failure'
  | 'missing_build_asset'
  | 'source_map_request'
  | 'wordpress_probe'
  | 'bot_probe'
  | 'malformed_api_request'
  | 'known_crawler'
  | 'spa_fallback'
  | 'genuine_user_404';

export type RouteClassification = {
  category: UnmatchedRouteCategory;
  logLevel: 'debug' | 'warn' | 'error';
  sample: boolean;
  message: string;
};

const WORDPRESS_PROBE = /\/wp-(?:admin|content|includes|login|json)|\/xmlrpc\.php|\/wp1\/|\/wordpress\//i;
const BOT_PROBE = /\/\.env|\/\.git|\/phpmyadmin|\/admin\.php|\/vendor\/phpunit|\/actuator\//i;
const SOURCE_MAP = /\.map$/i;
const CRAWLER = /\/robots\.txt|\/sitemap\.xml|\/favicon\.ico|\/\.well-known\//i;
const API_PREFIX = /^\/api\//;

export function classifyUnmatchedRequest(input: {
  method: string;
  path: string;
  accept?: string;
}): RouteClassification {
  const { method, path } = input;

  if (SOURCE_MAP.test(path)) {
    return {
      category: 'source_map_request',
      logLevel: 'debug',
      sample: true,
      message: `Source map request: ${path}`,
    };
  }

  if (WORDPRESS_PROBE.test(path)) {
    return {
      category: 'wordpress_probe',
      logLevel: 'debug',
      sample: true,
      message: `WordPress probe on non-WordPress app: ${path}`,
    };
  }

  if (BOT_PROBE.test(path)) {
    return {
      category: 'bot_probe',
      logLevel: 'debug',
      sample: true,
      message: `Known bot/security probe: ${path}`,
    };
  }

  if (CRAWLER.test(path)) {
    return {
      category: 'known_crawler',
      logLevel: 'debug',
      sample: false,
      message: `Known crawler asset: ${path}`,
    };
  }

  if (API_PREFIX.test(path)) {
    return {
      category: 'malformed_api_request',
      logLevel: 'warn',
      sample: false,
      message: `API route not found: ${method} ${path}`,
    };
  }

  if (/\.(?:js|css|woff2?|png|jpe?g|svg|webp|ico)$/i.test(path)) {
    return {
      category: 'missing_build_asset',
      logLevel: 'warn',
      sample: false,
      message: `Missing production asset: ${path}`,
    };
  }

  if (method === 'GET' && !path.includes('.')) {
    return {
      category: 'spa_fallback',
      logLevel: 'debug',
      sample: true,
      message: `SPA route fallback candidate: ${path}`,
    };
  }

  return {
    category: 'genuine_user_404',
    logLevel: 'warn',
    sample: false,
    message: `Unmatched request: ${method} ${path}`,
  };
}

const sampleCounters = new Map<string, number>();

export function shouldLogRouteClassification(
  classification: RouteClassification,
  path: string,
): boolean {
  if (!classification.sample) return true;
  const key = `${classification.category}:${path}`;
  const count = (sampleCounters.get(key) ?? 0) + 1;
  sampleCounters.set(key, count);
  return count === 1 || count % 50 === 0;
}

/** Reset sample counters — test helper only. */
export function resetRouteClassificationSamplesForTests(): void {
  sampleCounters.clear();
}
