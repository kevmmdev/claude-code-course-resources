import { notFound } from "next/navigation";
import Link from "next/link";
import { getNoteByPublicSlug } from "@/lib/notes";

interface PublicNotePageProps {
  params: {
    slug: string;
  };
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const note = await getNoteByPublicSlug(params.slug);

  if (!note) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← Home
            </Link>
            <h1 className="flex-1 text-xl font-bold">{note.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <div className="prose max-w-none">
            <pre className="overflow-auto rounded-md bg-gray-100 p-4 text-sm">
              {note.contentJson}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
