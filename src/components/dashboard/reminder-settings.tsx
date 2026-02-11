"use client";

import { useState } from "react";

interface ReminderSettingsProps {
  savedProgramId: string;
  programName: string;
  initialLeadDays: number;
}

const LEAD_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
];

export function ReminderSettings({
  savedProgramId,
  programName,
  initialLeadDays,
}: ReminderSettingsProps) {
  const [leadDays, setLeadDays] = useState(initialLeadDays);
  const [saving, setSaving] = useState(false);

  async function handleChange(newValue: number) {
    setLeadDays(newValue);
    setSaving(true);
    try {
      await fetch(`/api/saved-programs/${savedProgramId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderLeadDays: newValue }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500 truncate" title={programName}>
        {programName}
      </span>
      <select
        value={leadDays}
        onChange={(e) => handleChange(Number(e.target.value))}
        disabled={saving}
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:opacity-50"
      >
        {LEAD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {saving && (
        <span className="text-xs text-neutral-400">Saving...</span>
      )}
    </div>
  );
}
