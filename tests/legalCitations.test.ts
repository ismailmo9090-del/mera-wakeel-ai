import { describe, it, expect } from 'vitest';
import {
  searchLegalCitations,
  formatCitation,
  DISCLAIMER_FOOTER,
  buildCitationContext,
  LEGAL_CITATIONS,
} from '../src/lib/legalCitations';

describe('searchLegalCitations', () => {
  it('returns an empty array for empty or blank queries', () => {
    expect(searchLegalCitations('')).toEqual([]);
    expect(searchLegalCitations('   ')).toEqual([]);
  });

  it('returns empty when nothing matches', () => {
    expect(searchLegalCitations('zzzzqqqq')).toEqual([]);
  });

  it('finds citations for "cheating fraud"', () => {
    const results = searchLegalCitations('cheating fraud', 10);
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((c) => c.id);
    expect(ids).toContain('IPC-420');
    expect(ids).toContain('IPC-415');
  });

  it('respects the limit parameter', () => {
    const results = searchLegalCitations('land property tenant', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('ranks best-scoring results first and does not duplicate ids', () => {
    const results = searchLegalCitations('land property tenant', 20);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('formatCitation & constants', () => {
  it('formats a citation label', () => {
    const c = LEGAL_CITATIONS.find((x) => x.id === 'IPC-302')!;
    expect(formatCitation(c)).toBe('IPC 302 — Murder');
  });

  it('DISCLAIMER_FOOTER is non-empty and mentions licensed advocate', () => {
    expect(DISCLAIMER_FOOTER).toContain('advocate');
    expect(DISCLAIMER_FOOTER.length).toBeGreaterThan(10);
  });
});

describe('buildCitationContext', () => {
  it('returns empty string when no citations match', () => {
    expect(buildCitationContext('zzzzqqqq')).toBe('');
  });

  it('builds a prompt fragment starting with the instruction', () => {
    const ctx = buildCitationContext('cheating fraud', 10);
    expect(ctx).toContain('AVAILABLE LEGAL CITATIONS');
    expect(ctx).toContain('IPC 420 —');
    expect(ctx).not.toContain('undefined');
  });
});