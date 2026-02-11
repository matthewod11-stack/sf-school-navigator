"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";

export function AuthNav() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return <div className="h-8 w-16" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setShowAuth(true)}>
        Sign in
      </Button>
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="login"
      />
    </>
  );
}
