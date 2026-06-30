const TOKEN_PATTERN = /^rpt_[A-Za-z0-9_-]{20,128}$/;

export function isValidPublicToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}
