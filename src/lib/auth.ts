export function headerAuth(apiKey: string | undefined): RequestInit['headers'] | undefined {
  const key = (apiKey ?? '').trim();
  if (!key) return undefined;
  return { Authorization: `Bearer ${key}` };
}
