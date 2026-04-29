"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GRADE_LEVEL_LABELS,
  GRADE_LEVELS,
} from "@/lib/program-types";
import type { ChildProfile, GradeLevel } from "@/types/domain";

const SEARCH_CONTEXT_STORAGE_KEY = "sf-school-nav-search-context";
const SEARCH_CONTEXT_CHANGE_EVENT = "sf-school-nav-search-context-change";

interface ChildProfileManagerProps {
  initialChildren: ChildProfile[];
}

interface ChildDraft {
  id?: string;
  label: string;
  ageMonths: string;
  expectedDueDate: string;
  pottyTrained: "yes" | "no" | "unknown";
  gradeTarget: GradeLevel;
}

interface StoredSearchContext {
  familyId?: string | null;
  activeChildId?: string | null;
  familyDraft?: {
    childAgeMonths?: number | null;
    childExpectedDueDate?: string | null;
    gradeTarget?: GradeLevel;
    pottyTrained?: boolean | null;
    children?: ChildProfile[];
  } | null;
}

function childToDraft(child?: ChildProfile, nextIndex = 1): ChildDraft {
  return {
    id: child?.id,
    label: child?.label ?? `Child ${nextIndex}`,
    ageMonths: child?.ageMonths != null ? String(child.ageMonths) : "",
    expectedDueDate: child?.expectedDueDate ?? "",
    pottyTrained:
      child?.pottyTrained == null ? "unknown" : child.pottyTrained ? "yes" : "no",
    gradeTarget: child?.gradeTarget ?? "prek",
  };
}

function draftToChild(draft: ChildDraft): ChildProfile {
  const ageMonths = draft.ageMonths.trim() ? Number(draft.ageMonths) : null;
  return {
    id: draft.id ?? crypto.randomUUID(),
    label: draft.label.trim() || "Child",
    ageMonths: ageMonths != null && Number.isFinite(ageMonths) ? ageMonths : null,
    expectedDueDate: draft.expectedDueDate || null,
    pottyTrained:
      draft.pottyTrained === "unknown" ? null : draft.pottyTrained === "yes",
    gradeTarget: draft.gradeTarget,
  };
}

function formatChildSummary(child: ChildProfile): string {
  const parts = [GRADE_LEVEL_LABELS[child.gradeTarget]];
  if (child.ageMonths != null) {
    parts.push(`${child.ageMonths} months`);
  } else if (child.expectedDueDate) {
    parts.push(`Due ${child.expectedDueDate}`);
  }
  if (child.pottyTrained != null) {
    parts.push(child.pottyTrained ? "Potty trained" : "Not potty trained");
  }
  return parts.join(" · ");
}

function syncSearchContext(
  familyId: string | null,
  children: ChildProfile[],
  activeChildId: string | null
) {
  try {
    const raw = localStorage.getItem(SEARCH_CONTEXT_STORAGE_KEY);
    const current = raw ? (JSON.parse(raw) as StoredSearchContext) : {};
    const activeChild =
      children.find((child) => child.id === activeChildId) ?? children[0] ?? null;
    const nextContext: StoredSearchContext = {
      ...current,
      familyId: familyId ?? current.familyId ?? null,
      activeChildId: activeChild?.id ?? null,
    };

    if (current.familyDraft && activeChild) {
      nextContext.familyDraft = {
        ...current.familyDraft,
        childAgeMonths: activeChild.ageMonths,
        childExpectedDueDate: activeChild.expectedDueDate,
        gradeTarget: activeChild.gradeTarget,
        pottyTrained: activeChild.pottyTrained,
        children,
      };
    }

    localStorage.setItem(SEARCH_CONTEXT_STORAGE_KEY, JSON.stringify(nextContext));
    window.dispatchEvent(new Event(SEARCH_CONTEXT_CHANGE_EVENT));
  } catch {
    // Search can refresh from the database on the next request.
  }
}

export function ChildProfileManager({
  initialChildren,
}: ChildProfileManagerProps) {
  const [children, setChildren] = useState(initialChildren);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ChildDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeChildId = useMemo(() => {
    if (typeof window === "undefined") return children[0]?.id ?? null;
    try {
      const raw = localStorage.getItem(SEARCH_CONTEXT_STORAGE_KEY);
      if (!raw) return children[0]?.id ?? null;
      const context = JSON.parse(raw) as StoredSearchContext;
      return children.some((child) => child.id === context.activeChildId)
        ? context.activeChildId ?? null
        : children[0]?.id ?? null;
    } catch {
      return children[0]?.id ?? null;
    }
  }, [children]);

  function beginAdd() {
    setEditingId("new");
    setDraft(childToDraft(undefined, children.length + 1));
    setError(null);
  }

  function beginEdit(child: ChildProfile) {
    setEditingId(child.id);
    setDraft(childToDraft(child));
    setError(null);
  }

  async function persist(nextChildren: ChildProfile[], nextActiveChildId: string | null) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/family/children", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ children: nextChildren }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to save child profiles");
      }

      const payload = (await response.json()) as {
        familyId: string | null;
        children: ChildProfile[];
      };
      setChildren(payload.children);
      syncSearchContext(payload.familyId, payload.children, nextActiveChildId);
      setEditingId(null);
      setDraft(null);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save child profiles";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    if (!draft || isSaving) return;
    const nextChild = draftToChild(draft);
    if (nextChild.ageMonths != null && (nextChild.ageMonths < 0 || nextChild.ageMonths > 216)) {
      setError("Age must be between 0 and 216 months.");
      return;
    }

    const nextChildren =
      editingId === "new"
        ? [...children, nextChild]
        : children.map((child) => (child.id === nextChild.id ? nextChild : child));
    await persist(nextChildren, nextChild.id);
  }

  async function handleRemove(child: ChildProfile) {
    if (children.length <= 1 || isSaving) return;
    const confirmed = window.confirm(`Remove ${child.label}?`);
    if (!confirmed) return;

    const nextChildren = children.filter((candidate) => candidate.id !== child.id);
    const nextActiveChildId =
      activeChildId === child.id ? nextChildren[0]?.id ?? null : activeChildId;
    await persist(nextChildren, nextActiveChildId);
  }

  return (
    <section id="child-profiles" className="mt-8 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            Child Profiles
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage the children used for search and comparison scoring.
          </p>
        </div>
        <Button size="sm" onClick={beginAdd} disabled={isSaving || editingId !== null}>
          Add Child
        </Button>
      </div>

      <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
        {children.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No child profiles yet. Add one to personalize search results.
          </p>
        ) : (
          children.map((child) => (
            <div
              key={child.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 py-3 last:border-b-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-neutral-900">{child.label}</p>
                  {child.id === activeChildId && (
                    <span className="rounded-sm bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatChildSummary(child)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => beginEdit(child)}
                  disabled={isSaving || editingId !== null}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(child)}
                  disabled={isSaving || editingId !== null || children.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}

        {draft && (
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-neutral-700">
                Label
                <input
                  type="text"
                  value={draft.label}
                  onChange={(event) =>
                    setDraft({ ...draft, label: event.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-neutral-700">
                Target grade
                <select
                  value={draft.gradeTarget}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      gradeTarget: event.target.value as GradeLevel,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                >
                  {GRADE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {GRADE_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-neutral-700">
                Age in months
                <input
                  type="number"
                  min={0}
                  max={216}
                  value={draft.ageMonths}
                  onChange={(event) =>
                    setDraft({ ...draft, ageMonths: event.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-neutral-700">
                Expected due date
                <input
                  type="date"
                  value={draft.expectedDueDate}
                  onChange={(event) =>
                    setDraft({ ...draft, expectedDueDate: event.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                />
              </label>
              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium text-neutral-700">
                  Potty trained
                </legend>
                <div className="flex flex-wrap gap-4">
                  {[
                    ["yes", "Yes"],
                    ["no", "No"],
                    ["unknown", "Not sure"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={draft.pottyTrained === value}
                        onChange={() =>
                          setDraft({
                            ...draft,
                            pottyTrained: value as ChildDraft["pottyTrained"],
                          })
                        }
                        className="text-neutral-900 focus:ring-neutral-700"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-error-500">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setDraft(null);
                  setError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
