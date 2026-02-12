"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const STORAGE_KEY = "sf-school-nav-compare";
const MAX_COMPARE = 4;

export interface CompareProgram {
  id: string;
  slug: string;
  name: string;
}

interface CompareContextValue {
  programs: CompareProgram[];
  add: (program: CompareProgram) => void;
  remove: (programId: string) => void;
  clear: () => void;
  has: (programId: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function readInitialComparePrograms(): CompareProgram[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as CompareProgram[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<CompareProgram[]>(readInitialComparePrograms);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  }, [programs]);

  const add = useCallback((program: CompareProgram) => {
    setPrograms((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((p) => p.id === program.id)) return prev;
      return [...prev, program];
    });
  }, []);

  const remove = useCallback((programId: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== programId));
  }, []);

  const clear = useCallback(() => {
    setPrograms([]);
  }, []);

  const has = useCallback(
    (programId: string) => programs.some((p) => p.id === programId),
    [programs]
  );

  return (
    <CompareContext.Provider
      value={{
        programs,
        add,
        remove,
        clear,
        has,
        isFull: programs.length >= MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}
