import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const libreBaskerville = localFont({
  src: [
    { path: "../assets/fonts/libre-baskerville-400.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/libre-baskerville-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../assets/fonts/libre-baskerville-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const sourceSans = localFont({
  src: "../assets/fonts/source-sans-3-variable.woff2",
  weight: "200 900",
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
