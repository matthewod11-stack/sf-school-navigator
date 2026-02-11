// Slug generation: slugify(name)-neighborhood
// Produces URL-safe, stable, unique slugs for programs

export function generateProgramSlug(
  name: string,
  neighborhood: string | null
): string {
  const base = slugify(name);
  if (neighborhood) {
    return `${base}-${slugify(neighborhood)}`;
  }
  return base;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[']/g, "") // remove apostrophes
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → hyphens
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-"); // collapse multiple hyphens
}
