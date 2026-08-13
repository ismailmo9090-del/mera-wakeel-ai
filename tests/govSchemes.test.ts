import { describe, it, expect } from 'vitest';
import {
  GOV_SCHEMES,
  isLikelyEligibleForFreeLegalAid,
  buildGovernmentAidContextBlock,
} from '../src/lib/govSchemes';

describe('GOV_SCHEMES', () => {
  it('contains the core schemes', () => {
    const names = GOV_SCHEMES.map((s) => s.name);
    expect(names.some((n) => n.startsWith('NALSA'))).toBe(true);
    expect(names.some((n) => n.startsWith('Tele-Law'))).toBe(true);
    expect(names.some((n) => n.startsWith('Lok Adalat'))).toBe(true);
  });

  it('every scheme has a helpline field', () => {
    for (const s of GOV_SCHEMES) {
      expect(typeof s.helpline).toBe('string');
      expect(s.helpline.length).toBeGreaterThan(0);
    }
  });
});

describe('isLikelyEligibleForFreeLegalAid', () => {
  it('returns false for text with no eligibility markers', () => {
    expect(isLikelyEligibleForFreeLegalAid('I want to buy a flat and register the sale deed.')).toBe(false);
  });

  it('returns true when income markers appear', () => {
    expect(isLikelyEligibleForFreeLegalAid('Meri income bahut kam hai aur mujhe paisa nahi hai, earning se below poverty line hoon.')).toBe(true);
  });

  it('returns true when markers appear', () => {
    expect(isLikelyEligibleForFreeLegalAid('I am a widow and cannot afford a lawyer.')).toBe(true);
  });
});

describe('buildGovernmentAidContextBlock', () => {
  it('returns empty string when not eligible', () => {
    expect(buildGovernmentAidContextBlock('Please draft a sale agreement for my house.')).toBe('');
  });

  it('mentions NALSA and 15100 when eligible', () => {
    const block = buildGovernmentAidContextBlock('I have no money and no income, I am below poverty line.');
    expect(block).toContain('NALSA');
    expect(block).toContain('15100');
    expect(block).toContain('FREE GOVERNMENT LEGAL AID');
  });
});