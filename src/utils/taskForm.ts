import type { CreateTaskDto, UpdateTaskDto } from '../types';

export type TaskFormState = CreateTaskDto & { percentComplete?: number; actualHours?: number };

export const emptyTaskForm = (): TaskFormState => ({
  workItemId: 0,
  taskTitle: '',
  taskDescription: '',
  assignedToId: undefined,
  assignedUserIds: [],
  statusId: 1,
  priorityId: 3,
  estimatedHours: undefined,
  startDate: '',
  dueDate: '',
  percentComplete: 0,
  actualHours: undefined,
});

export function toCreatePayload(form: TaskFormState): CreateTaskDto {
  return {
    workItemId: form.workItemId,
    taskTitle: form.taskTitle,
    taskDescription: form.taskDescription || undefined,
    assignedToId: form.assignedToId,
    statusId: form.statusId,
    priorityId: form.priorityId,
    estimatedHours: form.estimatedHours,
    startDate: form.startDate || undefined,
    dueDate: form.dueDate || undefined,
    assignedUserIds: form.assignedUserIds?.length ? form.assignedUserIds : undefined,
  };
}

export function toUpdatePayload(form: TaskFormState): UpdateTaskDto {
  return {
    ...toCreatePayload(form),
    percentComplete: form.percentComplete ?? 0,
    actualHours: form.actualHours,
  };
}
