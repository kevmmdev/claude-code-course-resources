import type { JSONContent } from '@tiptap/react';

export function parseNoteContent(json: string): JSONContent {
  try {
    return JSON.parse(json);
  } catch {
    return { type: 'doc', content: [] };
  }
}
