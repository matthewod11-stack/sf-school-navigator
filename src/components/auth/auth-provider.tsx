"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });
const SEARCH_CONTEXT_STORAGE_KEY = "sf-school-nav-search-context";

interface StoredSearchContext {
  familyId?: string | null;
  attendanceAreaId?: string | null;
  homeCoordinates?: { lng: number; lat: number } | null;
  familyDraft?: unknown;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const migratingRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function maybeMigrateIntakeData(currentUser: User | null) {
      if (!currentUser || migratingRef.current) return;

      try {
        const raw = localStorage.getItem(SEARCH_CONTEXT_STORAGE_KEY);
        if (!raw) return;

        const stored = JSON.parse(raw) as StoredSearchContext;
        if (!stored.familyDraft || stored.familyId) return;

        migratingRef.current = true;
        const response = await fetch("/api/intake/migrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attendanceAreaId: stored.attendanceAreaId ?? null,
            homeCoordinates: stored.homeCoordinates ?? null,
            familyDraft: stored.familyDraft,
          }),
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { familyId: string | null };
        if (!payload.familyId) return;

        localStorage.setItem(
          SEARCH_CONTEXT_STORAGE_KEY,
          JSON.stringify({
            ...stored,
            familyId: payload.familyId,
          })
        );
      } catch {
        // Ignore migration failures; user can still proceed.
      } finally {
        migratingRef.current = false;
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
      void maybeMigrateIntakeData(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        void maybeMigrateIntakeData(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
