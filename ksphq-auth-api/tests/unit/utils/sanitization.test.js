/**
 * Sanitization Tests
 * Tests for input sanitization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  stripHtmlTags,
  normalizeWhitespace,
  normalizeUnicode,
  containsSqlInjectionPatterns,
  containsXssPatterns,
  sanitizeTextInput,
  sanitizeObject,
  sanitizeProjectData,
} from '../../../src/utils/sanitization.js';

describe('Sanitization Utilities', () => {
  describe('stripHtmlTags', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = stripHtmlTags(input);

      expect(result).toBe('alert("xss")Hello');
      expect(result).not.toContain('<script>');
    });

    it('should remove multiple HTML tags', () => {
      const input = '<div><p>Test</p><span>content</span></div>';
      const result = stripHtmlTags(input);

      expect(result).toBe('Testcontent');
    });

    it('should handle self-closing tags', () => {
      const input = 'Text<br/>More text';
      const result = stripHtmlTags(input);

      expect(result).toBe('TextMore text');
    });

    it('should return input unchanged if not a string', () => {
      expect(stripHtmlTags(123)).toBe(123);
      expect(stripHtmlTags(null)).toBe(null);
    });
  });

  describe('normalizeWhitespace', () => {
    it('should trim leading and trailing whitespace', () => {
      const input = '  Hello World  ';
      const result = normalizeWhitespace(input);

      expect(result).toBe('Hello World');
    });

    it('should replace multiple spaces with single space', () => {
      const input = 'Hello    World';
      const result = normalizeWhitespace(input);

      expect(result).toBe('Hello World');
    });

    it('should remove zero-width spaces', () => {
      const input = 'Hello\u200BWorld';
      const result = normalizeWhitespace(input);

      expect(result).toBe('HelloWorld');
    });

    it('should handle newlines and tabs', () => {
      const input = 'Hello\n\tWorld';
      const result = normalizeWhitespace(input);

      expect(result).toBe('Hello World');
    });
  });

  describe('normalizeUnicode', () => {
    it('should normalize accented characters', () => {
      const input = 'café';
      const result = normalizeUnicode(input);

      expect(result).toBe('cafe');
    });

    it('should handle various diacritics', () => {
      const input = 'ñáéíóú';
      const result = normalizeUnicode(input);

      expect(result).toBe('naeiou');
    });
  });

  describe('containsSqlInjectionPatterns', () => {
    it('should detect UNION SELECT injection', () => {
      const input = "' UNION SELECT * FROM users--";

      expect(containsSqlInjectionPatterns(input)).toBe(true);
    });

    it('should detect DROP TABLE injection', () => {
      const input = "'; DROP TABLE projects;--";

      expect(containsSqlInjectionPatterns(input)).toBe(true);
    });

    it('should detect OR 1=1 injection', () => {
      const input = "admin' OR 1=1--";

      expect(containsSqlInjectionPatterns(input)).toBe(true);
    });

    it('should detect SQL comments', () => {
      expect(containsSqlInjectionPatterns('test--')).toBe(true);
      expect(containsSqlInjectionPatterns('test/*comment*/')).toBe(true);
    });

    it('should not flag normal text', () => {
      const input = 'This is a normal project description';

      expect(containsSqlInjectionPatterns(input)).toBe(false);
    });

    it('should not flag legitimate use of words like "or"', () => {
      const input = 'We need to order supplies';

      expect(containsSqlInjectionPatterns(input)).toBe(false);
    });
  });

  describe('containsXssPatterns', () => {
    it('should detect script tags', () => {
      const input = '<script>alert("xss")</script>';

      expect(containsXssPatterns(input)).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      const input = '<a href="javascript:alert()">Click</a>';

      expect(containsXssPatterns(input)).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsXssPatterns('<div onclick="alert()">Test</div>')).toBe(true);
      expect(containsXssPatterns('<img onload="steal()">')).toBe(true);
    });

    it('should detect iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';

      expect(containsXssPatterns(input)).toBe(true);
    });

    it('should not flag normal text', () => {
      const input = 'This is a normal description';

      expect(containsXssPatterns(input)).toBe(false);
    });
  });

  describe('sanitizeTextInput', () => {
    it('should apply all sanitization steps', () => {
      const input = '  <b>Hello</b>    World  ';
      const result = sanitizeTextInput(input);

      expect(result).toBe('Hello World');
      expect(result).not.toContain('<b>');
    });

    it('should handle complex input', () => {
      const input = '  <script>alert()</script>Test\n\n  Content  ';
      const result = sanitizeTextInput(input);

      expect(result).toBe('alert()Test Content');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string fields in object', () => {
      const input = {
        name: '  <b>Project</b>  ',
        description: '<script>xss</script>Description',
        number: 123,
      };

      const result = sanitizeObject(input);

      expect(result.name).toBe('Project');
      expect(result.description).toBe('xss Description');
      expect(result.number).toBe(123);
    });

    it('should recursively sanitize nested objects', () => {
      const input = {
        name: '<b>Test</b>',
        metadata: {
          notes: '  <i>Notes</i>  ',
        },
      };

      const result = sanitizeObject(input);

      expect(result.name).toBe('Test');
      expect(result.metadata.notes).toBe('Notes');
    });

    it('should throw error on SQL injection patterns', () => {
      const input = {
        name: "'; DROP TABLE projects;--",
      };

      expect(() => sanitizeObject(input)).toThrow(/SQL/);
    });

    it('should throw error on XSS patterns', () => {
      const input = {
        description: '<script>alert("xss")</script>',
      };

      expect(() => sanitizeObject(input, { checkInjection: true })).toThrow(/XSS/);
    });

    it('should skip specified fields', () => {
      const input = {
        id: '<should-not-sanitize>',
        name: '<b>Should sanitize</b>',
      };

      const result = sanitizeObject(input, { fieldsToSkip: ['id'] });

      expect(result.id).toBe('<should-not-sanitize>');
      expect(result.name).toBe('Should sanitize');
    });

    it('should handle arrays', () => {
      const input = ['<b>Item 1</b>', '<i>Item 2</i>'];

      const result = sanitizeObject(input);

      expect(result[0]).toBe('Item 1');
      expect(result[1]).toBe('Item 2');
    });

    it('should disable injection checks when checkInjection is false', () => {
      const input = {
        name: "'; DROP TABLE projects;--",
      };

      expect(() => sanitizeObject(input, { checkInjection: false })).not.toThrow();
    });
  });

  describe('sanitizeProjectData', () => {
    it('should sanitize project data', () => {
      const input = {
        name: '  <b>Project</b>  ',
        description: '<i>Description</i>',
        project_manager_id: 'should-not-change',
        status: 'planning',
      };

      const result = sanitizeProjectData(input);

      expect(result.name).toBe('Project');
      expect(result.description).toBe('Description');
      expect(result.project_manager_id).toBe('should-not-change');
    });

    it('should not sanitize ID fields', () => {
      const input = {
        id: 'abc-123',
        project_id: 'project-456',
        branch_id: 'branch-789',
        name: '<b>Test</b>',
      };

      const result = sanitizeProjectData(input);

      expect(result.id).toBe('abc-123');
      expect(result.project_id).toBe('project-456');
      expect(result.branch_id).toBe('branch-789');
      expect(result.name).toBe('Test');
    });

    it('should throw on injection attempts', () => {
      const input = {
        name: 'Test',
        description: "'; DROP TABLE projects;--",
      };

      expect(() => sanitizeProjectData(input)).toThrow();
    });
  });
});
