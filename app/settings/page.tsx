'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/client-api';

interface Settings {
  targetYear: number;
  dailyStudyHoursGoal: number;
  timezone: string;
  weekStartsOn: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    targetYear: 2027,
    dailyStudyHoursGoal: 4,
    timezone: 'Asia/Kolkata',
    weekStartsOn: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ settings: Settings }>('/api/settings')
      .then((data) => setSettings(data.settings))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    const data = await apiRequest<{ settings: Settings }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    setSettings(data.settings);
  };

  if (loading) {
    return <div className="rounded-xl border bg-white p-6 shadow-sm text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Persisted study preferences</p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <input type="number" value={settings.targetYear} onChange={(event) => setSettings({ ...settings, targetYear: Number(event.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Target year" />
        <input type="number" value={settings.dailyStudyHoursGoal} onChange={(event) => setSettings({ ...settings, dailyStudyHoursGoal: Number(event.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Daily study hours goal" />
        <input type="text" value={settings.timezone} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Timezone" />
        <select value={settings.weekStartsOn} onChange={(event) => setSettings({ ...settings, weekStartsOn: Number(event.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value={0}>Sunday</option>
          <option value={1}>Monday</option>
        </select>
        <button onClick={saveSettings} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Save Settings
        </button>
      </div>
    </div>
  );
}
