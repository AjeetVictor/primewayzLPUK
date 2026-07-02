const STICKY_HEADER_OFFSET = 112;

export function scrollToAuditSection(sectionId: string, behavior: ScrollBehavior = 'smooth'): void {
  if (typeof window === 'undefined') return;

  const target = document.getElementById(sectionId);
  if (!target) return;

  const targetTop = target.getBoundingClientRect().top + window.scrollY - STICKY_HEADER_OFFSET;
  window.scrollTo({ top: Math.max(targetTop, 0), left: 0, behavior });
}
