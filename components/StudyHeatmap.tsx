'use client';

import { format } from 'date-fns';

interface HeatmapEntry {
  date: string;
  hours: number;
}

export function StudyHeatmap({ data }: { data: HeatmapEntry[] }) {
  const getLevelColor = (hours: number) => {
    if (hours <= 0) return 'bg-white/70';
    if (hours <= 2) return 'bg-amber-200';
    if (hours <= 4) return 'bg-sky-300';
    return 'bg-slate-800';
  };

  const weeks = Array.from({ length: 12 }).map((_, weekIndex) =>
    data.slice(weekIndex * 7, (weekIndex + 1) * 7)
  );

  return (
    <div className="lofi-panel rounded-[1.8rem] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Study Heatmap</h2>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="h-3 w-3 rounded-sm bg-white/70" />
            <div className="h-3 w-3 rounded-sm bg-amber-200" />
            <div className="h-3 w-3 rounded-sm bg-sky-300" />
            <div className="h-3 w-3 rounded-sm bg-slate-800" />
          </div>
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`h-3 w-3 rounded-sm ${getLevelColor(day.hours)}`}
                  title={`${format(new Date(day.date), 'MMM d, yyyy')}: ${day.hours} hrs`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
