export type SafeUtmFields = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
};

const UTM_KEY_LIMIT = 120;

function pickSafeUtmValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, UTM_KEY_LIMIT);
}

export function pickSafeUtmFields(body: Record<string, unknown>): SafeUtmFields {
  const utmSource = pickSafeUtmValue(body.utm_source ?? body.utmSource);
  const utmMedium = pickSafeUtmValue(body.utm_medium ?? body.utmMedium);
  const utmCampaign = pickSafeUtmValue(body.utm_campaign ?? body.utmCampaign);
  const utmContent = pickSafeUtmValue(body.utm_content ?? body.utmContent);

  return {
    ...(utmSource ? { utmSource } : {}),
    ...(utmMedium ? { utmMedium } : {}),
    ...(utmCampaign ? { utmCampaign } : {}),
    ...(utmContent ? { utmContent } : {}),
  };
}

export function formatSafeUtmFieldsForEmail(utm: SafeUtmFields): string {
  const lines = [
    utm.utmSource ? `Source: ${utm.utmSource}` : null,
    utm.utmMedium ? `Medium: ${utm.utmMedium}` : null,
    utm.utmCampaign ? `Campaign: ${utm.utmCampaign}` : null,
    utm.utmContent ? `Content: ${utm.utmContent}` : null,
  ].filter(Boolean);

  return lines.length > 0 ? lines.join('\n') : 'Not provided';
}
