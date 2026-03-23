import { ImageResponse } from "next/og";
import { getAllStaticPages, getLanguagePages, type SeoPageConfig } from "@/lib/seo/pages";
import { getLanguagesWithMinPrograms } from "@/lib/seo/queries";

export const alt = "SF School Navigator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const staticPages = getAllStaticPages();
  let languagePages: SeoPageConfig[] = [];
  try {
    const languages = await getLanguagesWithMinPrograms(3);
    languagePages = getLanguagePages(languages);
  } catch {
    // Build-time fallback
  }
  return [...staticPages, ...languagePages].map((p) => ({ slug: p.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const staticPages = getAllStaticPages();
  let languagePages: SeoPageConfig[] = [];
  try {
    const languages = await getLanguagesWithMinPrograms(3);
    languagePages = getLanguagePages(languages);
  } catch {
    // fallback
  }

  const allPages = [...staticPages, ...languagePages];
  const page = allPages.find((p) => p.slug === slug);
  const title = page?.title ?? "Schools in San Francisco";
  const description = page?.description ?? "Explore preschool programs in San Francisco";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FAF8F5",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 400,
              color: "#78716c",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            SF School Navigator
          </div>
          <div
            style={{
              width: "60px",
              height: "3px",
              backgroundColor: "#1c1917",
            }}
          />
          <div
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#1c1917",
              lineHeight: 1.15,
              fontFamily: "serif",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 400,
              color: "#57534e",
              lineHeight: 1.5,
              maxWidth: "800px",
              marginTop: "8px",
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px",
            color: "#a8a29e",
          }}
        >
          sfschoolnavigator.com
        </div>
      </div>
    ),
    { ...size }
  );
}
