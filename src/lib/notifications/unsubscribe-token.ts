import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 180 * 24 * 60 * 60;

interface TokenPayload {
  savedProgramId: string;
  exp: number;
}

function getUnsubscribeSecret(): string | null {
  return process.env.UNSUBSCRIBE_TOKEN_SECRET ?? process.env.CRON_SECRET ?? null;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function issueUnsubscribeToken(savedProgramId: string): string {
  const secret = getUnsubscribeSecret();
  if (!secret) {
    throw new Error(
      "Missing unsubscribe signing secret (UNSUBSCRIBE_TOKEN_SECRET or CRON_SECRET)"
    );
  }

  const payload: TokenPayload = {
    savedProgramId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyUnsubscribeToken(
  token: string
): { savedProgramId: string } | null {
  const secret = getUnsubscribeSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as TokenPayload;
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.savedProgramId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (Math.floor(Date.now() / 1000) > payload.exp) {
    return null;
  }

  return { savedProgramId: payload.savedProgramId };
}
