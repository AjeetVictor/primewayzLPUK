import type { MouseEvent } from 'react';

export const scrollToArticleHeading = (
  headingId: string,
  behavior: ScrollBehavior = 'smooth',
) => {
  const element = document.getElementById(headingId);
  if (!element) return false;

  const header = document.querySelector('header');
  const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 80;

  const extraGap = 24;
  const targetTop =
    element.getBoundingClientRect().top + window.scrollY - headerHeight - extraGap;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior,
  });

  return true;
};

export const handleTocClick = (
  event: MouseEvent<HTMLAnchorElement>,
  headingId: string,
) => {
  event.preventDefault();

  const didScroll = scrollToArticleHeading(headingId, 'smooth');

  if (didScroll) {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#${headingId}`);
  }
};
