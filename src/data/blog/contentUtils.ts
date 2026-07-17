export type ArticleHeading = {
  id: string;
  text: string;
};

export const slugifyHeading = (value: string) =>
  value
    .replace(/&amp;/gi, ' and ')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const decodeHeadingText = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();

const HEADING_TAG_PATTERN = /<h([23])([^>]*)>(.*?)<\/h\1>/gi;

export const extractArticleHeadings = (content: string): ArticleHeading[] => {
  const matches = content.matchAll(HEADING_TAG_PATTERN);
  const seen = new Map<string, number>();

  return Array.from(matches, (match) => {
    const text = decodeHeadingText(match[3]);
    const baseId = slugifyHeading(text) || 'section';
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);

    return {
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
      text,
    };
  }).filter((heading) => heading.text.length > 0);
};

export const injectHeadingIds = (content: string, headings: ArticleHeading[]) => {
  let index = 0;

  return content.replace(HEADING_TAG_PATTERN, (fullMatch, level, attrs, inner) => {
    const heading = headings[index];
    index += 1;

    if (!heading) {
      return fullMatch;
    }

    if (/\sid=/.test(attrs)) {
      return fullMatch;
    }

    return `<h${level}${attrs} id="${heading.id}" class="scroll-mt-32">${inner}</h${level}>`;
  });
};
