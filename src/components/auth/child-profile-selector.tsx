"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import type { ChildProfile } from "@/types/domain";

const SEARCH_CONTEXT_STORAGE_KEY = "sf-school-nav-search-context";
const SEARCH_CONTEXT_CHANGE_EVENT = "sf-school-nav-search-context-change";

interface StoredSearchContext {
  activeChildId?: string | null;
  familyId?: string | null;
  familyDraft?: {
    childAgeMonths?: number | null;
    childExpectedDueDate?: string | null;
    gradeTarget?: ChildProfile["gradeTarget"];
    pottyTrained?: boolean | null;
    children?: ChildProfile[];
    budgetMonthlyMax?: number | null;
    preferences?: {
      philosophy: string[];
      languages: string[];
      mustHaves: string[];
      niceToHaves: string[];
    };
  } | null;
}

function fallbackChild(draft: StoredSearchContext["familyDraft"]): ChildProfile | null {
  if (!draft) return null;
  return {
    id: "child-1",
    label: "Child 1",
    ageMonths: draft.childAgeMonths ?? null,
    expectedDueDate: draft.childExpectedDueDate ?? null,
    pottyTrained: draft.pottyTrained ?? null,
    gradeTarget: draft.gradeTarget ?? "prek",
  };
}

interface SelectorState {
  context: StoredSearchContext | null;
  children: ChildProfile[];
  activeChildId: string | null;
}

function readContext(): SelectorState {
  if (typeof window === "undefined") {
    return { context: null, children: [], activeChildId: null };
  }

  try {
    const raw = localStorage.getItem(SEARCH_CONTEXT_STORAGE_KEY);
    if (!raw) return { context: null, children: [], activeChildId: null };
    const context = JSON.parse(raw) as StoredSearchContext;
    const fallback = fallbackChild(context.familyDraft);
    const children = context.familyDraft?.children?.length
      ? context.familyDraft.children
      : fallback
        ? [fallback]
        : [];
    return {
      context,
      children,
      activeChildId: context.activeChildId ?? children[0]?.id ?? null,
    };
  } catch {
    return { context: null, children: [], activeChildId: null };
  }
}

function writeContextWithChildren(
  baseContext: StoredSearchContext | null,
  familyId: string | null,
  children: ChildProfile[],
  activeChildId: string
): StoredSearchContext {
  const activeChild = children.find((child) => child.id === activeChildId) ?? children[0];
  const nextContext: StoredSearchContext = {
    ...(baseContext ?? {}),
    familyId: familyId ?? baseContext?.familyId ?? null,
    activeChildId: activeChild.id,
  };

  if (baseContext?.familyDraft) {
    nextContext.familyDraft = {
      ...baseContext.familyDraft,
      childAgeMonths: activeChild.ageMonths,
      childExpectedDueDate: activeChild.expectedDueDate,
      gradeTarget: activeChild.gradeTarget,
      pottyTrained: activeChild.pottyTrained,
      children,
    };
  }

  localStorage.setItem(SEARCH_CONTEXT_STORAGE_KEY, JSON.stringify(nextContext));
  window.dispatchEvent(new Event(SEARCH_CONTEXT_CHANGE_EVENT));
  return nextContext;
}

export function ChildProfileSelector() {
  const { user } = useAuth();
  const [selectorState, setSelectorState] = useState<SelectorState>(readContext);

  useEffect(() => {
    function handleContextChange() {
      setSelectorState(readContext());
    }

    window.addEventListener(SEARCH_CONTEXT_CHANGE_EVENT, handleContextChange);
    return () => window.removeEventListener(SEARCH_CONTEXT_CHANGE_EVENT, handleContextChange);
  }, []);

  useEffect(() => {
    if (!user) return;

    let canceled = false;

    async function loadPersistedChildren() {
      try {
        const response = await fetch("/api/family/children");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          familyId: string | null;
          children: ChildProfile[];
        };
        if (canceled || payload.children.length === 0) return;

        const current = readContext();
        const currentActiveId = current.activeChildId;
        const activeChildId =
          payload.children.some((child) => child.id === currentActiveId)
            ? currentActiveId!
            : payload.children[0].id;
        const nextContext = writeContextWithChildren(
          current.context,
          payload.familyId,
          payload.children,
          activeChildId
        );
        setSelectorState({
          context: nextContext,
          children: payload.children,
          activeChildId,
        });
      } catch {
        // Keep local context only.
      }
    }

    void loadPersistedChildren();
    return () => {
      canceled = true;
    };
  }, [user]);

  const { children, activeChildId } = selectorState;

  if (children.length < 2) return null;

  function handleChange(nextChildId: string) {
    const current = readContext();
    const nextChild = current.children.find((child) => child.id === nextChildId);
    if (!current.context || !nextChild) return;

    const nextContext = writeContextWithChildren(
      current.context,
      current.context.familyId ?? null,
      current.children,
      nextChild.id
    );
    setSelectorState({ context: nextContext, children: current.children, activeChildId: nextChild.id });
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <label htmlFor="active-child" className="sr-only">
        Active child profile
      </label>
      <select
        id="active-child"
        value={activeChildId ?? children[0].id}
        onChange={(event) => handleChange(event.target.value)}
        className="max-w-36 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-700 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.label}
          </option>
        ))}
      </select>
      <Link href="/dashboard#child-profiles" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
        Manage
      </Link>
    </div>
  );
}
