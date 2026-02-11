import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SF School Navigator",
  description:
    "Find the right preschool for your family in San Francisco. Compare programs, explore neighborhoods, and track applications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
