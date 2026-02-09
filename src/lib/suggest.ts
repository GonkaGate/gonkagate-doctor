function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Use typed arrays to avoid `noUncheckedIndexedAccess` noise.
  const v0 = new Uint32Array(b.length + 1);
  const v1 = new Uint32Array(b.length + 1);

  for (let i = 0; i <= b.length; i++) v0[i] = i;

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j]! + 1, v0[j + 1]! + 1, v0[j]! + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j]!;
  }

  return v1[b.length]!;
}

export function suggestModels(query: string, candidates: string[], limit = 5): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = candidates
    .map((id) => {
      const c = id.toLowerCase();
      let score = levenshtein(q, c);
      if (c.startsWith(q)) score -= 10;
      else if (c.includes(q)) score -= 6;
      return { id, score: Math.max(0, score) };
    })
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));

  const maxScore = Math.max(4, Math.floor(q.length * 0.6) + 2);
  return scored
    .filter((s) => s.score <= maxScore)
    .slice(0, limit)
    .map((s) => s.id);
}
