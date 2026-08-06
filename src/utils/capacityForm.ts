import type { CreateUserCapacityDto } from '../types';

export type CapacityFormState = CreateUserCapacityDto;

export const emptyCapacityForm = (): CapacityFormState => ({
  userId: 0,
  weekStartDate: new Date().toISOString().slice(0, 10),
  availableHours: 40,
});

export function getUtilizationColor(utilization: number): string {
  if (utilization > 100) return 'text-red-400';
  if (utilization >= 80) return 'text-orange-400';
  return 'text-green-400';
}

export function getUtilizationBarColor(utilization: number): string {
  if (utilization > 100) return 'bg-red-500';
  if (utilization >= 80) return 'bg-orange-500';
  return 'bg-green-500';
}

export function getUtilizationRowClass(utilization: number): string {
  if (utilization > 100) return 'bg-red-500/5';
  if (utilization >= 80) return 'bg-orange-500/5';
  return '';
}
