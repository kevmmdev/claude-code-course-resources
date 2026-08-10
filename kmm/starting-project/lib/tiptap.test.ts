import { describe, it, expect } from 'vitest';
import { parseNoteContent } from './tiptap';

describe('parseNoteContent', () => {
  it('parses valid JSON and returns it', () => {
    const json = '{"type":"doc","content":[]}';
    const result = parseNoteContent(json);

    expect(result).toEqual({ type: 'doc', content: [] });
  });

  it('parses complex TipTap document', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
      ],
    });

    const result = parseNoteContent(json);

    expect(result.type).toBe('doc');
    expect(result.content).toHaveLength(2);
    expect(result.content?.[0].type).toBe('paragraph');
  });

  it('returns empty doc on invalid JSON', () => {
    const invalidJson = '{invalid json}';
    const result = parseNoteContent(invalidJson);

    expect(result).toEqual({ type: 'doc', content: [] });
  });

  it('returns empty doc on empty string', () => {
    const result = parseNoteContent('');

    expect(result).toEqual({ type: 'doc', content: [] });
  });

  it('handles JSON with marks and attrs', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'bold text',
              marks: [{ type: 'bold' }],
            },
          ],
        },
      ],
    });

    const result = parseNoteContent(json);

    expect(result.content?.[0].content?.[0]).toHaveProperty('marks');
  });

  it('preserves all node properties', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'javascript' },
          content: [{ type: 'text', text: 'const x = 1;' }],
        },
      ],
    });

    const result = parseNoteContent(json);

    expect(result.content?.[0]).toHaveProperty('attrs');
    expect(result.content?.[0].attrs).toEqual({ language: 'javascript' });
  });
});
