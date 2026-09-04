import type { CreateTimeLogDto, Task, TimeLog, UpdateTimeLogDto } from '../types';
import { toIsoDate } from './timesheetUtils';

export const ENTRY_TYPES = ['Manual', 'Meeting', 'Task', 'Timer'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export interface TimeLogFormState {
  taskId: number;
  logDate: string;
  description: string;
  entryType: EntryType;
  startTime: string;
  endTime: string;
}

export function isTaskCompletedForTimeLog(task: Pick<Task, 'statusName' | 'percentComplete' | 'completedDate'>): boolean {
  if ((task.percentComplete ?? 0) >= 100) return true;
  if (task.completedDate) return true;

  const status = task.statusName?.trim().toLowerCase() ?? '';
  return status === 'completed' || status === 'done' || status === 'closed';
}

export function filterTasksForTimeLogPicker(tasks: Task[], selectedTaskId?: number | null): Task[] {
  const openTasks = tasks.filter((task) => !isTaskCompletedForTimeLog(task));
  if (!selectedTaskId) return openTasks;

  if (openTasks.some((task) => task.id === selectedTaskId))
    return openTasks;

  const selected = tasks.find((task) => task.id === selectedTaskId);
  return selected ? [selected, ...openTasks] : openTasks;
}

export function emptyTimeLogForm(): TimeLogFormState {
  return {
    taskId: 0,
    logDate: toIsoDate(new Date()),
    description: '',
    entryType: 'Manual',
    startTime: '09:00',
    endTime: '10:00',
  };
}

export function timeLogToForm(log: TimeLog): TimeLogFormState {
  let startTime = log.startedAt ? toTimeInputValue(log.startedAt) : '';
  let endTime = log.endedAt ? toTimeInputValue(log.endedAt) : '';

  if ((!startTime || !endTime) && log.hours > 0) {
    startTime = startTime || '09:00';
    endTime = endTime || addMinutesToTime(startTime, Math.round(log.hours * 60));
  }

  return {
    taskId: log.taskId,
    logDate: log.logDate.slice(0, 10),
    description: log.description ?? '',
    entryType: (log.entryType === 'Duplicate' ? 'Manual' : (log.entryType as EntryType)) || 'Manual',
    startTime,
    endTime,
  };
}

export function validateTimeLogForm(form: TimeLogFormState): string | null {
  if (!form.taskId) return 'Task is required.';
  if (!form.startTime || !form.endTime) return 'Start and end time are required.';
  if (form.endTime <= form.startTime) return 'End time must be after start time.';
  return null;
}

export function formDurationHours(form: TimeLogFormState): number {
  if (!form.startTime || !form.endTime || form.endTime <= form.startTime) return 0;
  const start = timeToMinutes(form.startTime);
  const end = timeToMinutes(form.endTime);
  return Math.round(((end - start) / 60) * 100) / 100;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  const hours = Math.floor(total / 60) % 24;
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function toTimeInputValue(iso: string): string {
  const direct = iso.match(/T(\d{2}):(\d{2})/);
  if (direct && !iso.includes('Z') && !/[+-]\d{2}:\d{2}$/.test(iso)) {
    return `${direct[1]}:${direct[2]}`;
  }

  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function toCreatePayload(form: TimeLogFormState): CreateTimeLogDto {
  return {
    taskId: form.taskId,
    hours: 0,
    logDate: form.logDate,
    description: form.description.trim() || undefined,
    entryType: form.entryType,
    startedAt: combineDateAndTime(form.logDate, form.startTime),
    endedAt: combineDateAndTime(form.logDate, form.endTime),
  };
}

export function toUpdatePayload(form: TimeLogFormState): UpdateTimeLogDto {
  return toCreatePayload(form);
}

export function getMonthDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(now),
  };
}

export function formatTaskOptionLabel(task: Pick<Task, 'projectName' | 'workItemNumber' | 'workItemTitle' | 'taskTitle'>): string {
  const project = task.projectName?.trim() || 'No Project';
  const workItem = `${task.workItemNumber ?? '—'} — ${task.workItemTitle ?? 'Untitled work item'}`;
  return `${project} › ${workItem} › ${task.taskTitle ?? 'Untitled task'}`;
}

export function sortTasksForSelect(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const projectA = a.projectName?.trim() || 'No Project';
    const projectB = b.projectName?.trim() || 'No Project';
    const byProject = projectA.localeCompare(projectB);
    if (byProject !== 0) return byProject;

    const byWorkItem = (a.workItemNumber ?? '').localeCompare(b.workItemNumber ?? '');
    if (byWorkItem !== 0) return byWorkItem;

    return (a.taskTitle ?? '').localeCompare(b.taskTitle ?? '');
  });
}

export function groupTasksForPicker(tasks: Task[]): { projectName: string; tasks: Task[] }[] {
  const groups = new Map<string, Task[]>();

  for (const task of sortTasksForSelect(tasks)) {
    const projectName = task.projectName?.trim() || 'No Project';
    const list = groups.get(projectName) ?? [];
    list.push(task);
    groups.set(projectName, list);
  }

  return Array.from(groups.entries()).map(([projectName, projectTasks]) => ({
    projectName,
    tasks: projectTasks,
  }));
}

export function taskMatchesSearch(task: Task, query: string): boolean {
  const haystack = [
    task.projectName,
    task.workItemNumber,
    task.workItemTitle,
    task.taskTitle,
    task.statusName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}
