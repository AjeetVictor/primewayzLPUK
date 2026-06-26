export const CONTACT_PAGE_PATH = '/contact-us';
export const BOOK_CALL_HASH = 'book-call';
export const BOOK_CALL_URL = `${CONTACT_PAGE_PATH}#${BOOK_CALL_HASH}`;
export const CONTACT_ENQUIRY_URL = CONTACT_PAGE_PATH;

export function isContactPagePath(pathname: string): boolean {
  return pathname === CONTACT_PAGE_PATH || pathname === '/contact';
}

export function isBookCallHash(hash: string): boolean {
  return hash === `#${BOOK_CALL_HASH}`;
}
