import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getNotesByUser } from "@/lib/notes";
import { createNoteAction } from "@/lib/actions/notes";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect("/authenticate");
  }

  const notes = await getNotesByUser(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Notes</h1>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <form
            action={createNoteAction}
            method="POST"
            className="inline-block"
          >
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              New note
            </button>
          </form>
        </div>

        {notes.length === 0 ? (
          <p className="text-gray-500">No notes yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="block rounded-md border border-gray-200 bg-white p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {note.isPublic && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Public
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
