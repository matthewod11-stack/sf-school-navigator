export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-6 text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} SF School Navigator</p>
        <nav className="flex gap-4">
          <a href="#" className="hover:text-neutral-700">
            About
          </a>
          <a href="#" className="hover:text-neutral-700">
            Privacy
          </a>
        </nav>
      </div>
    </footer>
  );
}
