import type { TimeLog } from '../types';
import { addDays, dayTotalHours, formatDuration, getWeekStart, groupLogsByDay, parseLocalDate, toIsoDate } from './timesheetUtils';

export type DatePreset = 'this_week' | 'this_month' | 'last_month' | 'custom';

export function getDateRangeForPreset(
  preset: DatePreset,
  customStart?: string,
  customEnd?: string,
): { startDate: string; endDate: string } {
  const today = new Date();

  if (preset === 'this_week') {
    const weekStart = getWeekStart(today);
    return { startDate: toIsoDate(weekStart), endDate: toIsoDate(addDays(weekStart, 6)) };
  }

  if (preset === 'this_month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toIsoDate(start), endDate: toIsoDate(today) };
  }

  if (preset === 'last_month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }

  return {
    startDate: customStart || toIsoDate(today),
    endDate: customEnd || toIsoDate(today),
  };
}

export function logDisplayHours(log: TimeLog): number {
  return log.isRunning ? log.effectiveHours : log.hours;
}

export function buildDailyHours(logs: TimeLog[]): { label: string; totalHours: number }[] {
  const grouped = groupLogsByDay(logs);
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayLogs]) => ({
      label: parseLocalDate(date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      totalHours: dayTotalHours(dayLogs),
    }));
}

export function buildEntryTypeHours(logs: TimeLog[]): { label: string; totalHours: number }[] {
  const totals = new Map<string, number>();

  for (const log of logs) {
    const type = log.entryType === 'Duplicate' ? 'Manual' : (log.entryType || 'Manual');
    totals.set(type, (totals.get(type) ?? 0) + logDisplayHours(log));
  }

  return Array.from(totals.entries())
    .map(([label, totalHours]) => ({ label, totalHours }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

export function groupLogsByDateDesc(logs: TimeLog[]) {
  const grouped = groupLogsByDay(logs);

  return Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({
      date,
      label: parseLocalDate(date).toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      logs: [...grouped[date]].sort(
        (a, b) => a.userName.localeCompare(b.userName) || a.taskTitle.localeCompare(b.taskTitle),
      ),
      totalHours: dayTotalHours(grouped[date]),
    }));
}

export function formatReportPeriod(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const end = parseLocalDate(endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return start === end ? start : `${start} – ${end}`;
}

export function formatReportHours(hours: number): string {
  return formatDuration(hours);
}
