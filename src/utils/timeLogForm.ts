import type { CreateTimeLogDto, TimeLog, UpdateTimeLogDto } from '../types';

export interface TimeLogFormState {
  taskId: number;
  hours: number;
  logDate: string;
  description: string;
}

export function emptyTimeLogForm(): TimeLogFormState {
  return {
    taskId: 0,
    hours: 1,
    logDate: new Date().toISOString().slice(0, 10),
    description: '',
  };
}

export function timeLogToForm(log: TimeLog): TimeLogFormState {
  return {
    taskId: log.taskId,
    hours: log.hours,
    logDate: log.logDate.slice(0, 10),
    description: log.description ?? '',
  };
}

export function toCreatePayload(form: TimeLogFormState): CreateTimeLogDto {
  return {
    taskId: form.taskId,
    hours: form.hours,
    logDate: form.logDate,
    description: form.description.trim() || undefined,
  };
}

export function toUpdatePayload(form: TimeLogFormState): UpdateTimeLogDto {
  return {
    taskId: form.taskId,
    hours: form.hours,
    logDate: form.logDate,
    description: form.description.trim() || undefined,
  };
}

export function getMonthDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}
