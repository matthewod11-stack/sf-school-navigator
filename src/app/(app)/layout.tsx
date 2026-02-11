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
          <NavHeader />
          <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-20">
            {children}
          </div>
          <CompareTray />
        </div>
      </CompareProvider>
    </AuthProvider>
  );
}
