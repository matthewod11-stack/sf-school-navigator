export function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === "42703" ||
    (typeof candidate.message === "string" &&
      candidate.message.includes("does not exist"))
  );
}
