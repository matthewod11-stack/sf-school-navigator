"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "sf-school-nav-compare";
const STORAGE_CHANGE_EVENT = "sf-school-nav-compare-change";
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

function parseComparePrograms(raw: string | null): CompareProgram[] {
  try {
    if (!raw) return [];

    const parsed = JSON.parse(raw) as CompareProgram[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

function getCompareSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function getCompareServerSnapshot(): string {
  return "[]";
}

function subscribeToCompareStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STORAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STORAGE_CHANGE_EVENT, onStoreChange);
  };
}

function writeComparePrograms(programs: CompareProgram[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(programs.slice(0, MAX_COMPARE))
  );
  window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
}

function readCurrentComparePrograms(): CompareProgram[] {
  return parseComparePrograms(getCompareSnapshot());
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const compareSnapshot = useSyncExternalStore(
    subscribeToCompareStore,
    getCompareSnapshot,
    getCompareServerSnapshot
  );
  const programs = useMemo(
    () => parseComparePrograms(compareSnapshot),
    [compareSnapshot]
  );

  const add = useCallback((program: CompareProgram) => {
    const currentPrograms = readCurrentComparePrograms();
    if (currentPrograms.length >= MAX_COMPARE) return;
    if (currentPrograms.some((p) => p.id === program.id)) return;

    writeComparePrograms([...currentPrograms, program]);
  }, []);

  const remove = useCallback((programId: string) => {
    writeComparePrograms(
      readCurrentComparePrograms().filter((p) => p.id !== programId)
    );
  }, []);

  const clear = useCallback(() => {
    writeComparePrograms([]);
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
