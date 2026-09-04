import type { TimeLog } from '../types';

export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function parseWallClock(iso: string): Date {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match && !iso.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(iso)) {
    const [, date, hh, mm, ss = '00'] = match;
    return new Date(`${date}T${hh}:${mm}:${ss}`);
  }
  return new Date(iso);
}

function isUtcInstant(iso: string): boolean {
  return iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso);
}

/** Timer instants are stored as UTC; API/EF often omits the Z suffix. */
function normalizeUtcInstant(iso: string): string {
  if (isUtcInstant(iso)) return iso;
  return `${iso.replace(/\.\d+$/, '')}Z`;
}

function parseDateTime(iso: string, preferInstant = false): Date {
  if (preferInstant) {
    return new Date(normalizeUtcInstant(iso));
  }
  if (isUtcInstant(iso)) {
    return new Date(iso);
  }
  return parseWallClock(iso);
}

function formatDigitalTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatClockTime(iso?: string, preferInstant = false): string {
  if (!iso) return '—';

  if (!preferInstant && !isUtcInstant(iso)) {
    const direct = iso.match(/T(\d{2}):(\d{2})/);
    if (direct) return `${direct[1]}:${direct[2]}`;
  }

  return formatDigitalTime(parseDateTime(iso, preferInstant));
}

export function toDateKey(value: string): string {
  return value.slice(0, 10);
}

/** Calendar date in local timezone (YYYY-MM-DD). Avoid toISOString() — it shifts dates in UTC+N zones. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string as local midnight. */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekStart(date = new Date()): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getWeekDateRange(weekStart: Date): { startDate: string; endDate: string } {
  const end = addDays(weekStart, 6);
  return { startDate: toIsoDate(weekStart), endDate: toIsoDate(end) };
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function groupLogsByDay(logs: TimeLog[]): Record<string, TimeLog[]> {
  return logs.reduce<Record<string, TimeLog[]>>((acc, log) => {
    const key = toDateKey(log.logDate);
    acc[key] = acc[key] ? [...acc[key], log] : [log];
    return acc;
  }, {});
}

export function dayTotalHours(logs: TimeLog[]): number {
  return logs.reduce((sum, log) => sum + (log.isRunning ? log.effectiveHours : log.hours), 0);
}

export function formatWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function isTimerInstant(log: {
  isRunning?: boolean;
  entryType?: string;
  startedAt?: string;
  createdAt?: string;
}): boolean {
  if (log.isRunning || log.entryType === 'Timer') return true;
  if (log.startedAt && log.createdAt) {
    const started = parseDateTime(log.startedAt, true).getTime();
    const created = parseDateTime(log.createdAt, true).getTime();
    if (Math.abs(created - started) < 2 * 60 * 1000) return true;
  }
  return false;
}

export function formatTimeRange(log: {
  startedAt?: string;
  endedAt?: string;
  isRunning?: boolean;
  hours?: number;
  logDate?: string;
  entryType?: string;
  createdAt?: string;
}): string {
  const preferInstant = isTimerInstant(log);

  if (log.startedAt || log.endedAt) {
    const start = formatClockTime(log.startedAt, preferInstant);
    const end = log.isRunning && log.startedAt ? 'Now' : formatClockTime(log.endedAt, preferInstant);

    if (log.startedAt && (log.endedAt || log.isRunning)) return `${start} – ${end}`;
    if (log.startedAt) return `${start} – —`;
    return `— – ${end}`;
  }

  const hours = log.isRunning ? undefined : log.hours;
  if (hours && hours > 0 && log.logDate) {
    const dateKey = log.logDate.slice(0, 10);
    const start = new Date(`${dateKey}T09:00:00`);
    const end = new Date(start.getTime() + hours * 3600000);
    return `${formatClockTime(start.toISOString())} – ${formatClockTime(end.toISOString())}`;
  }

  return '—';
}

export function entrySubtitle(log: { description?: string; entryType?: string }): string {
  if (log.description?.trim()) return log.description.trim();
  const type = log.entryType === 'Duplicate' ? 'Manual' : log.entryType;
  if (type && type !== 'Manual') return type;
  return 'No notes';
}

export function entryTypeLabel(entryType?: string): string {
  if (!entryType || entryType === 'Duplicate') return 'Manual';
  return entryType;
}

export function elapsedSince(iso: string): number {
  const started = new Date(iso).getTime();
  return Math.max(0, (Date.now() - started) / 3600000);
}

export function elapsedSeconds(iso: string, nowMs = Date.now(), preferInstant = false): number {
  const started = parseDateTime(iso, preferInstant || isUtcInstant(iso)).getTime();
  return Math.max(0, Math.floor((nowMs - started) / 1000));
}

export function formatElapsedCounter(iso: string, nowMs = Date.now(), preferInstant = false): string {
  const total = elapsedSeconds(iso, nowMs, preferInstant);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatDateTime(iso?: string, preferInstant = false): string {
  if (!iso) return '—';
  const date = parseDateTime(iso, preferInstant || isUtcInstant(iso));
  const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${datePart} · ${formatDigitalTime(date)}`;
}
