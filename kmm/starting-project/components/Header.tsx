import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-gray-900 hover:text-gray-700"
        >
          NextNotes
        </Link>
        {session?.user && <SignOutButton />}
      </div>
    </header>
  );
}
