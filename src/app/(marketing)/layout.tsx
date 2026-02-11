import { NavHeader } from "@/components/layout/nav-header";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
