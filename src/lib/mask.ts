function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return maskId(email);

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!domain) return maskId(email);

  const keep = clamp(local.length >= 4 ? 2 : 1, 1, Math.max(1, local.length));
  const maskedLocal =
    local.length <= keep ? '*'.repeat(local.length) : local.slice(0, keep) + '*'.repeat(3);
  return `${maskedLocal}@${domain}`;
}

export function maskId(id: string): string {
  const v = id.trim();
  if (!v) return '***';
  if (v.length <= 8) return `${v[0]}***`;
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}
