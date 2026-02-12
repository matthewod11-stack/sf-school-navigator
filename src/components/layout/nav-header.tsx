import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthNav } from "./auth-nav";

export function NavHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-cream">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-xl font-bold text-neutral-900">
          SF School Navigator
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/intake">
            <Button size="sm">Get Started</Button>
          </Link>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
