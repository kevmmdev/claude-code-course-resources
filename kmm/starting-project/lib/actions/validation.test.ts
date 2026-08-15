import { describe, it, expect } from 'vitest';
import { createNoteSchema, updateNoteSchema, contentJsonSchema } from './validation';

describe('Validation schemas', () => {
  describe('contentJsonSchema', () => {
    it('accepts valid TipTap document string', () => {
      const validJson = JSON.stringify({ type: 'doc', content: [] });
      const result = contentJsonSchema.safeParse(validJson);

      expect(result.success).toBe(true);
    });

    it('accepts complex TipTap document', () => {
      const json = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello' }],
          },
        ],
      });

      const result = contentJsonSchema.safeParse(json);

      expect(result.success).toBe(true);
    });

    it('rejects non-JSON string', () => {
      const result = contentJsonSchema.safeParse('{invalid json}');

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Note content must be a valid TipTap document');
    });

    it('rejects JSON without type field', () => {
      const json = JSON.stringify({ content: [] });

      const result = contentJsonSchema.safeParse(json);

      expect(result.success).toBe(false);
    });

    it('rejects JSON with wrong type value', () => {
      const json = JSON.stringify({ type: 'wrong', content: [] });

      const result = contentJsonSchema.safeParse(json);

      expect(result.success).toBe(false);
    });

    it('rejects JSON without content array', () => {
      const json = JSON.stringify({ type: 'doc' });

      const result = contentJsonSchema.safeParse(json);

      expect(result.success).toBe(false);
    });

    it('rejects JSON with non-array content', () => {
      const json = JSON.stringify({ type: 'doc', content: 'not an array' });

      const result = contentJsonSchema.safeParse(json);

      expect(result.success).toBe(false);
    });

    it('rejects oversized JSON string', () => {
      const hugeJson = JSON.stringify({
        type: 'doc',
        content: [{ type: 'text', text: 'a'.repeat(500_001) }],
      });

      const result = contentJsonSchema.safeParse(hugeJson);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Note content is too large');
    });

    it('accepts undefined (optional)', () => {
      const result = contentJsonSchema.safeParse(undefined);

      expect(result.success).toBe(true);
    });
  });

  describe('createNoteSchema', () => {
    it('accepts empty object (all optional)', () => {
      const result = createNoteSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it('accepts title and contentJson', () => {
      const data = {
        title: 'My Note',
        contentJson: JSON.stringify({ type: 'doc', content: [] }),
      };

      const result = createNoteSchema.safeParse(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('accepts title only', () => {
      const data = { title: 'My Note' };

      const result = createNoteSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts contentJson only', () => {
      const json = JSON.stringify({ type: 'doc', content: [] });
      const data = { contentJson: json };

      const result = createNoteSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createNoteSchema.safeParse({ title: '' });

      expect(result.success).toBe(false);
    });

    it('rejects title longer than 500 chars', () => {
      const result = createNoteSchema.safeParse({ title: 'a'.repeat(501) });

      expect(result.success).toBe(false);
    });

    it('rejects invalid contentJson', () => {
      const result = createNoteSchema.safeParse({
        contentJson: '{invalid}',
      });

      expect(result.success).toBe(false);
    });

    it('accepts 500 char title', () => {
      const result = createNoteSchema.safeParse({ title: 'a'.repeat(500) });

      expect(result.success).toBe(true);
    });
  });

  describe('updateNoteSchema', () => {
    it('accepts empty object (all optional)', () => {
      const result = updateNoteSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it('accepts title update only', () => {
      const data = { title: 'Updated Title' };

      const result = updateNoteSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts contentJson update only', () => {
      const json = JSON.stringify({ type: 'doc', content: [] });
      const data = { contentJson: json };

      const result = updateNoteSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts both title and contentJson', () => {
      const json = JSON.stringify({ type: 'doc', content: [] });
      const data = { title: 'New Title', contentJson: json };

      const result = updateNoteSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = updateNoteSchema.safeParse({ title: '' });

      expect(result.success).toBe(false);
    });

    it('rejects title longer than 500 chars', () => {
      const result = updateNoteSchema.safeParse({ title: 'a'.repeat(501) });

      expect(result.success).toBe(false);
    });

    it('rejects invalid contentJson', () => {
      const result = updateNoteSchema.safeParse({
        contentJson: '{broken}',
      });

      expect(result.success).toBe(false);
    });

    it('ignores extra fields', () => {
      const result = updateNoteSchema.safeParse({
        title: 'Title',
        userId: 'should-be-ignored',
        isPublic: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ title: 'Title' });
    });
  });
});
