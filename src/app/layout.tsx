import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: (() => {
    const url = process.env.NEXT_PUBLIC_SITE_URL ?? "sf-school-navigator.vercel.app";
    return new URL(url.startsWith("http") ? url : `https://${url}`);
  })(),
  title: {
    default: "SF School Navigator",
    template: "%s — SF School Navigator",
  },
  description:
    "Find the right preschool for your family in San Francisco. Compare programs, explore neighborhoods, and track applications.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SF School Navigator",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${libreBaskerville.variable} ${sourceSans.variable}`}
    >
      <body className="min-h-screen bg-cream font-sans text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
