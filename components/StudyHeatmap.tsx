'use client';

import { useMemo, useState, useEffect } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export function StudyHeatmap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  const days = useMemo(() => {
    if (!mounted) return [];
    const end = new Date();
    const start = subDays(end, 84); // 12 weeks
    const interval = eachDayOfInterval({ start, end });
    
    return interval.map((date) => {
      // Generate pseudo-random study hours for demo purposes (0 to 6) based on date
      const seed = date.getTime();
      const hours = Math.floor((Math.sin(seed) * 10000) % 7);
      const absHours = Math.abs(hours);
      return {
        date,
        hours: absHours,
        level: absHours === 0 ? 0 : absHours <= 2 ? 1 : absHours <= 4 ? 2 : 3,
      };
    });
  }, [mounted]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-indigo-200';
      case 2: return 'bg-indigo-400';
      case 3: return 'bg-indigo-600';
      default: return 'bg-slate-100';
    }
  };

  if (!mounted) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Study Heatmap</h2>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="h-3 w-3 rounded-sm bg-slate-100" />
              <div className="h-3 w-3 rounded-sm bg-indigo-200" />
              <div className="h-3 w-3 rounded-sm bg-indigo-400" />
              <div className="h-3 w-3 rounded-sm bg-indigo-600" />
            </div>
            <span>More</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {Array.from({ length: 12 }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-sm bg-slate-100 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Study Heatmap</h2>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="h-3 w-3 rounded-sm bg-slate-100" />
            <div className="h-3 w-3 rounded-sm bg-indigo-200" />
            <div className="h-3 w-3 rounded-sm bg-indigo-400" />
            <div className="h-3 w-3 rounded-sm bg-indigo-600" />
          </div>
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {/* Group by weeks (columns) */}
          {Array.from({ length: 12 }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-sm ${getLevelColor(day.level)}`}
                  title={`${format(day.date, 'MMM d, yyyy')}: ${day.hours} hrs`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
