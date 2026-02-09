import { describe, expect, it } from 'vitest';

import { suggestModels } from '../src/lib/suggest.js';

describe('suggestModels', () => {
  it('returns empty list on empty query', () => {
    expect(suggestModels('', ['a', 'b'])).toEqual([]);
  });

  it('prefers substring/prefix matches', () => {
    const candidates = ['llama-3.1-70b-instruct', 'llama-3.1-8b', 'gpt-4o-mini'];
    const res = suggestModels('llama-3.1-70b', candidates, 5);
    expect(res[0]).toBe('llama-3.1-70b-instruct');
  });
});
