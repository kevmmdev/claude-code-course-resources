import { z } from 'zod';

const MAX_CONTENT_JSON_LENGTH = 500_000;

export const contentJsonSchema = z
  .string()
  .max(MAX_CONTENT_JSON_LENGTH, 'Note content is too large')
  .optional()
  .refine((val) => {
    if (val === undefined) return true;
    let parsed: unknown;
    try {
      parsed = JSON.parse(val);
    } catch {
      return false;
    }
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { type?: unknown }).type === 'doc' &&
      Array.isArray((parsed as { content?: unknown }).content)
    );
  }, 'Note content must be a valid TipTap document');

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  contentJson: contentJsonSchema,
});

export const createNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  contentJson: contentJsonSchema,
});
