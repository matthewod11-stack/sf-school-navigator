import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-neutral-900">Page not found</h1>
      <p className="mt-3 text-neutral-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <nav className="mt-6 flex gap-4">
        <Link
          href="/search"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Go to search
        </Link>
        <Link
          href="/"
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          Go home
        </Link>
      </nav>
    </div>
  );
}
