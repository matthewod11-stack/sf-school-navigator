"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";

interface SaveButtonProps {
  programId: string;
}

export function SaveButton({ programId }: SaveButtonProps) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/saved-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });

      if (response.status === 409) {
        setSaved(true);
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save program");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant={saved ? "primary" : "secondary"}
        size="sm"
        onClick={handleSave}
        disabled={saving || saved}
      >
        {saved ? "Saved" : saving ? "Saving..." : "Save"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="signup"
      />
    </>
  );
}
