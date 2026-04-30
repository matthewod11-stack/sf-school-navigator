const PLACEHOLDER_DOMAINS = new Set(["example.com", "example.org", "example.net"]);
const PLACEHOLDER_TEXT = new Set(["no data", "n/a", "na", "none", "null"]);

function hasPlaceholderDomain(hostname: string): boolean {
  return Array.from(PLACEHOLDER_DOMAINS).some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

/**
 * Return a safe, displayable external HTTP(S) URL or null for placeholders.
 */
export function normalizeExternalUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (PLACEHOLDER_TEXT.has(lower) || lower.includes("no data")) return null;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(raw);
  if (hasScheme && !/^https?:\/\//i.test(raw)) return null;

  const withScheme = hasScheme ? raw : `https://${raw}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const hostname = url.hostname.toLowerCase();
    if (!hostname || hasPlaceholderDomain(hostname)) return null;

    return url.toString();
  } catch {
    return null;
  }
}
