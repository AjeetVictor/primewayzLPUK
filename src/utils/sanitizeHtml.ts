const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'div',
  'em',
  'h2',
  'h3',
  'h4',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'u',
  'ul',
]);

const ALLOWED_ATTRS = new Set(['alt', 'class', 'href', 'id', 'rel', 'src', 'target', 'title']);

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:')
  );
}

function sanitizeClassName(value: string): string {
  return value
    .split(/\s+/)
    .filter((token) =>
      /^(blog-|cms-|attachment-|callout-|prose-|quote-|scroll-mt-)[a-z0-9_-]*$/i.test(token),
    )
    .join(' ');
}

function isSafeHeadingId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(value);
}

function sanitizeWithDomParser(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        element.replaceWith(...Array.from(element.childNodes));
        return;
      }

      Array.from(element.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
          element.removeAttribute(attr.name);
          return;
        }

        if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
          element.removeAttribute(attr.name);
          return;
        }

        if (name === 'id' && !isSafeHeadingId(value)) {
          element.removeAttribute(attr.name);
          return;
        }

        if (name === 'class') {
          const safeClassName = sanitizeClassName(value);
          if (safeClassName) element.setAttribute('class', safeClassName);
          else element.removeAttribute('class');
        }
      });

      if (tag === 'a') {
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noopener noreferrer');
      }

      walk(element);
    });
  };

  walk(root);
  return root.innerHTML;
}

function sanitizeWithRegex(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(script|style|iframe|embed|object|form|input|button|textarea|select|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|embed|object|form|input|button|textarea|select|meta|link)[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, '')
    .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]+/gi, '');
}

export function sanitizeBlogHtml(html: string): string {
  if (!html) return '';

  if (typeof DOMParser !== 'undefined') {
    return sanitizeWithDomParser(html);
  }

  return sanitizeWithRegex(html);
}
