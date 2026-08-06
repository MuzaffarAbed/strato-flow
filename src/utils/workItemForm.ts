import type { CreateWorkItemDto, UpdateWorkItemDto } from '../types';

export const emptyWorkItemForm = (): CreateWorkItemDto & { percentComplete?: number; actualHours?: number } => ({
  title: '',
  description: '',
  businessReason: '',
  priorityId: 3,
  statusId: 1,
  workItemTypeId: 1,
  assignedToId: undefined,
  estimatedHours: undefined,
  startDate: '',
  dueDate: '',
  goalId: undefined,
  projectId: undefined,
  percentComplete: 0,
  actualHours: undefined,
});

export function toCreatePayload(form: CreateWorkItemDto & { percentComplete?: number; actualHours?: number }): CreateWorkItemDto {
  return {
    title: form.title,
    description: form.description || undefined,
    businessReason: form.businessReason || undefined,
    priorityId: form.priorityId,
    statusId: form.statusId,
    workItemTypeId: form.workItemTypeId,
    assignedToId: form.assignedToId,
    estimatedHours: form.estimatedHours,
    startDate: form.startDate || undefined,
    dueDate: form.dueDate || undefined,
    goalId: form.goalId,
    projectId: form.projectId,
  };
}

export function toUpdatePayload(form: CreateWorkItemDto & { percentComplete?: number; actualHours?: number }): UpdateWorkItemDto {
  return {
    ...toCreatePayload(form),
    percentComplete: form.percentComplete ?? 0,
    actualHours: form.actualHours,
  };
}
