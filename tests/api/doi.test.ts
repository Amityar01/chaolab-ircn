import { describe, it, expect, vi, beforeEach } from 'vitest';

// DOI validation regex (same as in route.ts)
const DOI_REGEX = /^10\.\d{4,}\/[^\s]+$/;

describe('DOI API Route', () => {
  describe('DOI Format Validation', () => {
    it('should accept valid DOI formats', () => {
      const validDOIs = [
        '10.1038/nature12373',
        '10.1016/j.neuron.2020.01.001',
        '10.1101/2021.01.01.425001',
        '10.7554/eLife.12345',
        '10.1523/JNEUROSCI.0000-00.0000',
      ];

      validDOIs.forEach(doi => {
        expect(DOI_REGEX.test(doi)).toBe(true);
      });
    });

    it('should reject invalid DOI formats', () => {
      const invalidDOIs = [
        '',
        'not-a-doi',
        '10.123/short', // Registry too short
        'https://doi.org/10.1038/nature12373', // Full URL
        '10.1038/', // Missing suffix
        '10.1038/nature 12373', // Contains space
      ];

      invalidDOIs.forEach(doi => {
        expect(DOI_REGEX.test(doi)).toBe(false);
      });
    });
  });
});

describe('Contact API Route', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  describe('Email Validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.jp',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        expect(EMAIL_REGEX.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        '',
        'not-an-email',
        '@no-local.com',
        'no-domain@',
        'spaces in@email.com',
      ];

      invalidEmails.forEach(email => {
        expect(EMAIL_REGEX.test(email)).toBe(false);
      });
    });
  });
});
