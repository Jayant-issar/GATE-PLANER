'use client';

import { useState } from 'react';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/features/settings/hooks';

const DEFAULT_SETTINGS = {
  targetYear: 2027,
  dailyStudyHoursGoal: 4,
  timezone: 'Asia/Kolkata',
  weekStartsOn: 1,
};

export default function SettingsPage() {
  const settingsQuery = useSettingsQuery();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const [draftSettings, setDraftSettings] = useState(DEFAULT_SETTINGS);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const settings = hasLocalChanges ? draftSettings : settingsQuery.data ?? DEFAULT_SETTINGS;

  if (settingsQuery.isLoading && !hasLocalChanges) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading settings...</div>;
  }

  if (settingsQuery.isError && !hasLocalChanges) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-rose-600">Failed to load settings.</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Persisted study preferences</p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <input
          type="number"
          value={settings.targetYear}
          onChange={(event) => {
            setHasLocalChanges(true);
            setDraftSettings({ ...settings, targetYear: Number(event.target.value) });
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Target year"
        />
        <input
          type="number"
          value={settings.dailyStudyHoursGoal}
          onChange={(event) => {
            setHasLocalChanges(true);
            setDraftSettings({ ...settings, dailyStudyHoursGoal: Number(event.target.value) });
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Daily study hours goal"
        />
        <input
          type="text"
          value={settings.timezone}
          onChange={(event) => {
            setHasLocalChanges(true);
            setDraftSettings({ ...settings, timezone: event.target.value });
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Timezone"
        />
        <select
          value={settings.weekStartsOn}
          onChange={(event) => {
            setHasLocalChanges(true);
            setDraftSettings({ ...settings, weekStartsOn: Number(event.target.value) });
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value={0}>Sunday</option>
          <option value={1}>Monday</option>
        </select>
        <button
          onClick={() =>
            updateSettingsMutation.mutate(settings, {
              onSuccess: (savedSettings) => {
                setHasLocalChanges(false);
                setDraftSettings(savedSettings);
              },
            })
          }
          disabled={updateSettingsMutation.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
