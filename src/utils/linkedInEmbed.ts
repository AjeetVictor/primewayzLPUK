const LINKEDIN_SCRIPT_ID = 'linkedin-embed-platform-script';
const LINKEDIN_SCRIPT_SRC = 'https://platform.linkedin.com/in.js';

type LinkedInWindow = Window & {
  IN?: {
    parse?: (element?: HTMLElement) => void;
  };
};

let scriptPromise: Promise<void> | null = null;

export function sanitizeLinkedInPostUrl(url?: string): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');

    if (host !== 'linkedin.com') return null;

    const path = parsed.pathname.toLowerCase();
    const isPostPath =
      path.startsWith('/posts/') ||
      path.startsWith('/feed/update/') ||
      path.startsWith('/pulse/') ||
      path.includes('/pulse/');

    if (!isPostPath) return null;

    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeLinkedInEmbedHtml(html?: string): string | null {
  if (!html?.trim()) return null;

  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  const hasTrustedEmbed =
    /class=["'][^"']*\blinkedin-embed\b/i.test(cleaned) ||
    /class=["'][^"']*\blinkedin-post-embed\b/i.test(cleaned) ||
    /src=["']https:\/\/www\.linkedin\.com\/embed\//i.test(cleaned);

  if (!hasTrustedEmbed) return null;
  if (/\bon\w+\s*=|javascript:/i.test(cleaned)) return null;
  if (/<(script|object|embed|form|input|button|textarea|select|style)\b/i.test(cleaned)) return null;

  return cleaned;
}

export function loadLinkedInEmbedScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const linkedInWindow = window as LinkedInWindow;
  if (linkedInWindow.IN?.parse) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(LINKEDIN_SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('LinkedIn embed script failed to load')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = LINKEDIN_SCRIPT_ID;
    script.src = LINKEDIN_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('LinkedIn embed script failed to load'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export function processLinkedInEmbeds(root?: HTMLElement | null) {
  if (typeof window === 'undefined') return;

  const linkedInWindow = window as LinkedInWindow;
  linkedInWindow.IN?.parse?.(root ?? undefined);
}
