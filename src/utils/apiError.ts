import axios from 'axios';
import type { ApiResponse } from '../types';

export type FieldErrors = Record<string, string>;

export interface FormValidationState {
  messages: string[];
  fields: FieldErrors;
}

export const emptyValidation: FormValidationState = { messages: [], fields: {} };

const FIELD_LABELS: Record<string, string> = {
  Password: 'Password',
  Email: 'Email address',
  FirstName: 'First name',
  LastName: 'Last name',
  RoleId: 'Role',
  DepartmentId: 'Department',
  Name: 'Name',
  ProjectName: 'Project name',
  Description: 'Description',
  Status: 'Status',
  StartDate: 'Start date',
  EndDate: 'End date',
};

function humanizeField(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function normalizeFieldKey(field: string): string {
  const cleaned = field.replace(/^\$\./, '').replace(/^dto\./i, '');
  if (!cleaned) return '';
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function humanizeValidationMessage(field: string, message: string): string {
  const label = humanizeField(field);

  const minLength = message.match(/must be at least (\d+) characters.*entered (\d+)/i);
  if (minLength) {
    return `${label} must be at least ${minLength[1]} characters (you entered ${minLength[2]}).`;
  }

  const maxLength = message.match(/must be (\d+) characters or fewer/i);
  if (maxLength) {
    return `${label} must be ${maxLength[1]} characters or fewer.`;
  }

  if (/field is required/i.test(message) || /must not be empty/i.test(message)) {
    return `${label} is required.`;
  }

  if (/not a valid e-mail/i.test(message)) {
    return 'Please enter a valid email address.';
  }

  if (/greater than/i.test(message)) {
    return `Please select a ${label.toLowerCase()}.`;
  }

  if (/cannot be before/i.test(message)) {
    return message;
  }

  if (message.includes(label) || message.includes(`'${field}'`)) {
    return message.replace(/'/g, '');
  }

  return `${label}: ${message}`;
}

function extractValidationState(data: unknown): FormValidationState | null {
  if (!data || typeof data !== 'object') return null;

  const payload = data as Record<string, unknown>;

  if (payload.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)) {
    const fields: FieldErrors = {};
    const messages: string[] = [];

    for (const [rawField, rawMessages] of Object.entries(payload.errors as Record<string, string[]>)) {
      const messageList = rawMessages ?? [];
      if (!messageList.length) continue;

      const message = humanizeValidationMessage(rawField, messageList[0]);
      messages.push(message);

      const fieldKey = normalizeFieldKey(rawField);
      if (fieldKey && !fields[fieldKey]) {
        fields[fieldKey] = message;
      }
    }

    if (messages.length) return { messages, fields };
  }

  return null;
}

function extractGeneralMessages(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];

  const payload = data as Record<string, unknown>;

  if (Array.isArray(payload.errors)) {
    return payload.errors.filter((item): item is string => typeof item === 'string');
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return [payload.message];
  }

  if (
    typeof payload.title === 'string' &&
    payload.title.trim() &&
    payload.title !== 'One or more validation errors occurred.'
  ) {
    return [payload.title];
  }

  return [];
}

export function createFormValidation(items: Array<{ field?: string; message: string }>): FormValidationState {
  const fields: FieldErrors = {};
  const messages: string[] = [];

  for (const item of items) {
    messages.push(item.message);
    if (item.field && !fields[item.field]) {
      fields[item.field] = item.message;
    }
  }

  return { messages, fields };
}

export function withClearedField(prev: FormValidationState, field: string): FormValidationState {
  if (!prev.fields[field]) return prev;

  const fields = { ...prev.fields };
  delete fields[field];
  const messages = Object.values(fields);

  return { fields, messages };
}

export function inputFieldClass(hasError: boolean, extra = ''): string {
  return [
    'w-full bg-background border rounded-lg px-4 py-2.5 text-sm focus:outline-none',
    hasError
      ? 'border-red-500 ring-1 ring-red-500/30 focus:border-red-500'
      : 'border-border focus:border-primary',
    extra,
  ].filter(Boolean).join(' ');
}

export function labelFieldClass(hasError: boolean): string {
  return hasError ? 'block text-sm mb-1 text-red-600 font-medium' : 'block text-sm mb-1 text-gray-500';
}

export function getApiFormValidation(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): FormValidationState {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    const validation = extractValidationState(data);
    if (validation) return validation;

    const messages = extractGeneralMessages(data);
    if (messages.length) return { messages, fields: {} };

    if (typeof error.response?.data === 'string' && error.response.data.trim()) {
      return { messages: [error.response.data], fields: {} };
    }
  }

  if (error instanceof Error && error.message) {
    return { messages: [error.message], fields: {} };
  }

  return { messages: [fallback], fields: {} };
}

export function getApiErrorMessages(error: unknown, fallback = 'Something went wrong. Please try again.'): string[] {
  return getApiFormValidation(error, fallback).messages;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return getApiErrorMessages(error, fallback).join(' ');
}
