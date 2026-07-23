// GET /api/warranty/:jobId returns customer_whatsapp unmasked by design —
// masking is a frontend-only responsibility.
export function maskWhatsapp(normalized) {
  if (!normalized) return '';
  const local = normalized.startsWith('60') ? `0${normalized.slice(2)}` : normalized;
  if (local.length <= 6) return local;
  const stars = '*'.repeat(local.length - 6);
  return `${local.slice(0, 4)}${stars}${local.slice(-2)}`;
}
