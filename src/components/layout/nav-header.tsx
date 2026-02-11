import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NavHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold text-brand-600">
          SF School Navigator
        </Link>
        <Link href="/intake">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    </header>
  );
}
