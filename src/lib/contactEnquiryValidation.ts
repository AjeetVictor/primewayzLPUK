export const CONTACT_ENQUIRY_LIMITS = { nameMin: 2, nameMax: 80, emailMax: 191, messageMin: 10, messageMax: 2000, phoneMax: 40, maxPayloadBytes: 16_384 } as const;
const EMAIL_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
export class ContactEnquiryValidationError extends Error { constructor(message: string) { super(message); this.name = 'ContactEnquiryValidationError'; } }
export class ContactEnquiryHoneypotError extends Error { constructor() { super('Submission ignored.'); this.name = 'ContactEnquiryHoneypotError'; } }
export function assertContactJsonContentType(contentType?: string): void { if (!contentType?.toLowerCase().startsWith('application/json')) throw new ContactEnquiryValidationError('Content-Type must be application/json.'); }
export function assertContactPayloadSize(contentLength?: string): void { if (!contentLength) return; const bytes = Number(contentLength); if (!Number.isFinite(bytes) || bytes < 0 || bytes > CONTACT_ENQUIRY_LIMITS.maxPayloadBytes) throw new ContactEnquiryValidationError('Contact request is too large.'); }
export function assertSerializedContactPayloadSize(body: unknown): void { if (Buffer.byteLength(JSON.stringify(body), 'utf8') > CONTACT_ENQUIRY_LIMITS.maxPayloadBytes) throw new ContactEnquiryValidationError('Contact request is too large.'); }
export function validateContactSubmissionId(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const value = (body as Record<string, unknown>).submissionId;
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^[a-fA-F0-9]{32}$/.test(value)) {
    throw new ContactEnquiryValidationError('Submission identifier is invalid.');
  }
  return value.toLowerCase();
}
function requiredText(value: unknown, label: string, min: number, max: number): string { if (typeof value !== 'string') throw new ContactEnquiryValidationError(`${label} is required.`); const normalized = value.trim(); if (normalized.length < min || normalized.length > max) throw new ContactEnquiryValidationError(`${label} must be between ${min} and ${max} characters.`); return normalized; }
export function validateContactEnquiry(body: unknown): { name: string; email: string; message: string; phone: string | null } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ContactEnquiryValidationError('Invalid contact request.');
  const data = body as Record<string, unknown>;
  if (typeof data.companyWebsite === 'string' && data.companyWebsite.trim()) throw new ContactEnquiryHoneypotError();
  const name = requiredText(data.name, 'Name', CONTACT_ENQUIRY_LIMITS.nameMin, CONTACT_ENQUIRY_LIMITS.nameMax);
  const email = requiredText(data.email, 'Email', 3, CONTACT_ENQUIRY_LIMITS.emailMax).toLowerCase();
  if (!EMAIL_REGEX.test(email) || /[\s,]/.test(email)) throw new ContactEnquiryValidationError('Please enter a valid email address.');
  const message = requiredText(data.message, 'Message', CONTACT_ENQUIRY_LIMITS.messageMin, CONTACT_ENQUIRY_LIMITS.messageMax);
  let phone: string | null = null;
  if (data.phone != null && data.phone !== '') { if (typeof data.phone !== 'string' || data.phone.trim().length > CONTACT_ENQUIRY_LIMITS.phoneMax) throw new ContactEnquiryValidationError('Phone number is invalid.'); phone = data.phone.trim(); }
  return { name, email, message, phone };
}
