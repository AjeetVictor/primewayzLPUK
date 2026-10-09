export type SubmissionIdentity = {
  signature: string;
  id: string;
};

export function submissionIdForPayload(
  identity: { current: SubmissionIdentity | null },
  payload: readonly unknown[],
): string {
  const signature = JSON.stringify(payload);
  if (identity.current?.signature === signature) return identity.current.id;

  const cryptoApi = globalThis.crypto;
  const id = typeof cryptoApi?.randomUUID === 'function'
    ? cryptoApi.randomUUID().replace(/-/g, '')
    : cryptoApi?.getRandomValues
      ? Array.from(cryptoApi.getRandomValues(new Uint8Array(16)), byte =>
          byte.toString(16).padStart(2, '0'),
        ).join('')
      : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  identity.current = { signature, id };
  return id;
}
