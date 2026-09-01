import type { RouteMetadataSnapshot } from './routeMetadataHelpers.ts';

function setMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  const selector = `meta[${attribute}="${key}"]`;
  const matches = Array.from(
    document.head.querySelectorAll<HTMLMetaElement>(selector),
  );

  const element =
    matches.shift() ?? document.head.appendChild(document.createElement('meta'));

  element.setAttribute(attribute, key);
  element.setAttribute('content', content);

  for (const duplicate of matches) {
    duplicate.remove();
  }
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;

  const matches = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>(selector),
  );

  const element =
    matches.shift() ?? document.head.appendChild(document.createElement('link'));

  element.setAttribute('rel', rel);
  element.setAttribute('href', href);

  if (hreflang) {
    element.setAttribute('hreflang', hreflang);
  }

  for (const duplicate of matches) {
    duplicate.remove();
  }
}

function removeLink(rel: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;

  for (const element of document.head.querySelectorAll(selector)) {
    element.remove();
  }
}

function removeMeta(attribute: 'name' | 'property', key: string) {
  const selector = `meta[${attribute}="${key}"]`;

  for (const element of document.head.querySelectorAll(selector)) {
    element.remove();
  }
}

export function applyRouteMetadataSnapshot(snapshot: RouteMetadataSnapshot) {
  document.title = snapshot.title;

  setMeta('name', 'description', snapshot.description);
  setMeta('name', 'robots', snapshot.robots);

  if (snapshot.canonical) {
    setLink('canonical', snapshot.canonical);
    setLink('alternate', snapshot.canonical, 'en-gb');
  } else {
    removeLink('canonical');
    removeLink('alternate', 'en-gb');
  }

  setMeta('property', 'og:type', snapshot.ogType);
  setMeta('property', 'og:locale', snapshot.ogLocale);
  setMeta('property', 'og:site_name', snapshot.ogSiteName);
  setMeta('property', 'og:title', snapshot.title);
  setMeta('property', 'og:description', snapshot.description);

  if (snapshot.canonical) {
    setMeta('property', 'og:url', snapshot.canonical);
  } else {
    removeMeta('property', 'og:url');
  }

  setMeta('property', 'og:image', snapshot.ogImage);
  setMeta('property', 'og:image:secure_url', snapshot.ogImageSecureUrl);
  setMeta('property', 'og:image:type', snapshot.ogImageType);
  setMeta('property', 'og:image:alt', snapshot.ogImageAlt);

  setMeta('name', 'twitter:card', snapshot.twitterCard);
  setMeta('name', 'twitter:title', snapshot.title);
  setMeta('name', 'twitter:description', snapshot.description);
  setMeta('name', 'twitter:image', snapshot.twitterImage);
  setMeta('name', 'twitter:image:alt', snapshot.twitterImageAlt);
}
