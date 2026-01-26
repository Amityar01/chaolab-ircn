import { describe, it, expect } from 'vitest';
import {
  getAllMembers,
  getAllPublications,
  getAllNews,
  getAllResearchThemes,
  getHomepageSettings,
  getContactInfo,
} from '@/lib/content';

describe('Content Loading', () => {
  describe('getAllMembers', () => {
    it('should return an array of members', () => {
      const members = getAllMembers();
      expect(Array.isArray(members)).toBe(true);
    });

    it('should have required fields for each member', () => {
      const members = getAllMembers();
      members.forEach(member => {
        expect(member).toHaveProperty('slug');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('category');
      });
    });
  });

  describe('getAllPublications', () => {
    it('should return an array of publications', () => {
      const publications = getAllPublications();
      expect(Array.isArray(publications)).toBe(true);
    });

    it('should have required fields for each publication', () => {
      const publications = getAllPublications();
      publications.forEach(pub => {
        expect(pub).toHaveProperty('id');
        expect(pub).toHaveProperty('title');
        expect(pub).toHaveProperty('authors');
        expect(pub).toHaveProperty('year');
        expect(pub).toHaveProperty('type');
      });
    });

    it('should have publications sorted by year (newest first)', () => {
      const publications = getAllPublications();
      if (publications.length > 1) {
        for (let i = 1; i < publications.length; i++) {
          expect(publications[i - 1].year).toBeGreaterThanOrEqual(publications[i].year);
        }
      }
    });
  });

  describe('getAllNews', () => {
    it('should return an array of news items', () => {
      const news = getAllNews();
      expect(Array.isArray(news)).toBe(true);
    });
  });

  describe('getAllResearchThemes', () => {
    it('should return an array of research themes', () => {
      const themes = getAllResearchThemes();
      expect(Array.isArray(themes)).toBe(true);
    });

    it('should have bilingual fields', () => {
      const themes = getAllResearchThemes();
      themes.forEach(theme => {
        expect(theme.title).toHaveProperty('en');
        expect(theme.title).toHaveProperty('ja');
        expect(theme.description).toHaveProperty('en');
        expect(theme.description).toHaveProperty('ja');
      });
    });
  });

  describe('getHomepageSettings', () => {
    it('should return homepage settings or null', () => {
      const settings = getHomepageSettings();
      // Settings can be null if file doesn't exist
      if (settings) {
        expect(settings).toHaveProperty('labName');
      }
    });
  });

  describe('getContactInfo', () => {
    it('should return contact info or null', () => {
      const contact = getContactInfo();
      // Contact can be null if file doesn't exist
      if (contact) {
        expect(contact).toHaveProperty('email');
      }
    });
  });
});
