import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNoteById } from "@/lib/notes";
import { NoteEditor } from "@/components/NoteEditor";

interface NotePageProps {
  params: {
    id: string;
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const session = await getSession();

  if (!session || !session.user) {
    redirect("/authenticate");
  }

  const note = await getNoteById(session.user.id, params.id);

  if (!note) {
    notFound();
  }

  return <NoteEditor note={note} />;
}
