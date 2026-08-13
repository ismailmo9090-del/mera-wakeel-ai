import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_TEMPLATES,
  renderDocument,
  DocumentTemplateKey,
} from '../src/lib/documentTemplates';

const KEYS = Object.keys(DOCUMENT_TEMPLATES) as DocumentTemplateKey[];

describe('DOCUMENT_TEMPLATES', () => {
  it('contains all five templates', () => {
    expect(KEYS.sort()).toEqual(
      ['consumer_complaint', 'legal_notice', 'rent_agreement', 'rti_application', 'termination_notice'].sort()
    );
  });

  it('every template has a label, description and fields', () => {
    for (const key of KEYS) {
      const t = DOCUMENT_TEMPLATES[key];
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.fields.length).toBeGreaterThan(0);
    }
  });
});

describe('renderDocument', () => {
  it('renders a template with provided values', () => {
    const out = renderDocument('rti_application', { applicant_name: 'Rahul Sharma' });
    expect(out).toContain('Rahul Sharma');
  });

  it('substitutes NOT PROVIDED placeholder for missing values', () => {
    const out = renderDocument('legal_notice', {});
    expect(out).toContain('[NOT PROVIDED]');
  });

  it('throws for an unknown template key', () => {
    expect(() => renderDocument('nope' as DocumentTemplateKey, {})).toThrow(/Unknown document template key/);
  });

  it('renders a complete rent agreement with key parties', () => {
    const out = renderDocument('rent_agreement', {
      tenant_name: 'Ali Khan',
      landlord_name: 'Suresh Verma',
      property_address: 'B-42, Connaught Place, New Delhi',
      monthly_rent: '25000',
    });
    expect(out).toContain('Ali Khan');
    expect(out).toContain('Suresh Verma');
  });
});