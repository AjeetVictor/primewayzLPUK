const SENSITIVE_KEY = /secret|token|password|credential|authorization|bearer|hash/i;
const SECRET_VALUE = /cck_[a-f0-9]{32}|ccs_[A-Za-z0-9_-]{20,}/;

export function sanitizeAuditDetails(value: unknown, depth = 0): Record<string, unknown> {
  const sanitized = sanitizeValue(value, depth);
  if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) return {};
  return sanitized as Record<string, unknown>;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 6) return '[truncated]';
  if (typeof value === 'string') {
    if (SECRET_VALUE.test(value)) return '[redacted]';
    return value.length > 500 ? value.slice(0, 500) : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  if (!value || typeof value !== 'object') return null;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) continue;
    output[key] = sanitizeValue(entry, depth + 1);
  }
  return output;
}
