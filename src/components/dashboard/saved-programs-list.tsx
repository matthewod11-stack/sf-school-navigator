"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  researching: "Researching",
  toured: "Toured",
  applied: "Applied",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  enrolled: "Enrolled",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, "blue" | "green" | "yellow" | "red" | "gray"> = {
  researching: "gray",
  toured: "blue",
  applied: "blue",
  waitlisted: "yellow",
  accepted: "green",
  enrolled: "green",
  rejected: "red",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

interface SavedProgramItem {
  id: string;
  programId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  program: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    primaryType: string;
  } | null;
}

interface SavedProgramsListProps {
  initialPrograms: SavedProgramItem[];
}

export function SavedProgramsList({ initialPrograms }: SavedProgramsListProps) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  async function handleStatusChange(savedId: string, newStatus: string) {
    setUpdatingId(savedId);
    try {
      const response = await fetch(`/api/saved-programs/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setPrograms((prev) =>
          prev.map((p) => (p.id === savedId ? { ...p, status: newStatus } : p))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveNotes(savedId: string) {
    setUpdatingId(savedId);
    try {
      const response = await fetch(`/api/saved-programs/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText || null }),
      });
      if (response.ok) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === savedId ? { ...p, notes: notesText || null } : p
          )
        );
        setEditingNotesId(null);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(savedId: string) {
    setUpdatingId(savedId);
    try {
      const response = await fetch(`/api/saved-programs/${savedId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPrograms((prev) => prev.filter((p) => p.id !== savedId));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
        <p className="font-serif font-medium text-neutral-900">No saved programs yet</p>
        <p className="mt-1 text-sm text-neutral-500">
          Save programs from search results or program profiles to track them here.
        </p>
        <Link href="/search" className="mt-4 inline-block">
          <Button size="sm">Browse Programs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {programs.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {item.program ? (
                    <Link
                      href={`/programs/${item.program.slug}`}
                      className="text-sm font-semibold text-neutral-900 hover:text-brand-700 hover:underline"
                    >
                      {item.program.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-neutral-500">
                      Program unavailable
                    </span>
                  )}
                  <Badge color={STATUS_COLORS[item.status] ?? "gray"}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </div>
                {item.program?.address && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {item.program.address}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={updatingId === item.id}
                className="shrink-0 text-xs text-neutral-400 hover:text-red-500"
                aria-label={`Remove ${item.program?.name ?? "program"}`}
              >
                Remove
              </button>
            </div>

            {/* Status dropdown */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor={`status-${item.id}`} className="text-xs text-neutral-500">
                Status:
              </label>
              <select
                id={`status-${item.id}`}
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                disabled={updatingId === item.id}
                aria-label={`Status for ${item.program?.name ?? "program"}`}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mt-3">
              {editingNotesId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Add your notes..."
                    maxLength={5000}
                    rows={3}
                    className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveNotes(item.id)}
                      disabled={updatingId === item.id}
                      aria-label={`Save notes for ${item.program?.name ?? "program"}`}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingNotesId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {item.notes ? (
                    <p className="text-sm text-neutral-600">{item.notes}</p>
                  ) : null}
                  <button
                    onClick={() => {
                      setEditingNotesId(item.id);
                      setNotesText(item.notes ?? "");
                    }}
                    className="mt-1 text-xs text-brand-700 hover:text-brand-800 hover:underline"
                    aria-label={`${item.notes ? "Edit" : "Add"} notes for ${item.program?.name ?? "program"}`}
                  >
                    {item.notes ? "Edit notes" : "Add notes"}
                  </button>
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-neutral-400">
              Saved{" "}
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
