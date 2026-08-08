"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createNote,
  updateNote,
  deleteNote,
  setNotePublic,
} from "@/lib/notes";

const updateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  contentJson: z.string().optional(),
});

const createNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  contentJson: z.string().optional(),
});

export async function createNoteWithContentAction(data: unknown) {
  const session = await getSession();
  if (!session || !session.user) throw new Error("Unauthorized");

  const validated = createNoteSchema.parse(data);
  const note = await createNote(session.user.id, validated);
  redirect(`/notes/${note.id}`);
}

export async function updateNoteAction(noteId: string, data: unknown) {
  const session = await getSession();
  if (!session || !session.user) throw new Error("Unauthorized");

  const validated = updateNoteSchema.parse(data);
  const note = await updateNote(session.user.id, noteId, validated);

  if (!note) throw new Error("Note not found or not owned by user");
  return note;
}

export async function deleteNoteAction(noteId: string) {
  const session = await getSession();
  if (!session || !session.user) throw new Error("Unauthorized");

  await deleteNote(session.user.id, noteId);
  redirect("/dashboard");
}

export async function toggleShareAction(noteId: string, isPublic: boolean) {
  const session = await getSession();
  if (!session || !session.user) throw new Error("Unauthorized");

  const note = await setNotePublic(session.user.id, noteId, isPublic);
  if (!note) throw new Error("Note not found or not owned by user");

  return note;
}
