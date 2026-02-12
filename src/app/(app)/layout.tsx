import { NavHeader } from "@/components/layout/nav-header";
import { CompareProvider } from "@/components/compare/compare-context";
import { CompareTray } from "@/components/compare/compare-tray";
import { AuthProvider } from "@/components/auth/auth-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CompareProvider>
        <div className="flex min-h-screen flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cream focus:text-neutral-900 focus:underline focus:shadow-lg focus:rounded"
          >
            Skip to main content
          </a>
          <NavHeader />
          <div id="main-content" className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-24">
            {children}
          </div>
          <CompareTray />
        </div>
      </CompareProvider>
    </AuthProvider>
  );
}
