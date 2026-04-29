import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-neutral-900 bg-parchment">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-6 text-sm text-neutral-500">
        <p className="font-serif">&copy; {new Date().getFullYear()} SF School Navigator</p>
        <nav className="flex gap-4">
          <Link href="/guides" className="hover:text-neutral-700">
            Guides
          </Link>
          <Link href="/privacy" className="hover:text-neutral-700">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-neutral-700">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
