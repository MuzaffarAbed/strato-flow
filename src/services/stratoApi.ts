import api, { unwrap } from './api';
import type { ApiResponse } from '../types';
import type {
  AuthResponse,
  DashboardData,
  Goal,
  KanbanColumn,
  LookupDto,
  MyWorkData,
  Notification,
  PagedResult,
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterParams,
  UserDetail,
  CreateUserDto,
  UpdateUserDto,
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  UserCapacity,
  CreateUserCapacityDto,
  UpdateUserCapacityDto,
  WorkItem,
  CreateWorkItemDto,
  UpdateWorkItemDto,
  WorkItemFilterParams,
  Comment,
  CreateCommentDto,
  UpdateCommentDto,
  TimeLog,
  CreateTimeLogDto,
  UpdateTimeLogDto,
  TimeLogFilterParams,
  TimeLogSummary,
} from '../types';

const get = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<ApiResponse<T>>(url, { params }).then(unwrap);

const post = <T>(url: string, data?: unknown) =>
  api.post<ApiResponse<T>>(url, data).then(unwrap);

const put = <T>(url: string, data?: unknown) =>
  api.put<ApiResponse<T>>(url, data).then(unwrap);

const del = <T>(url: string) =>
  api.delete<ApiResponse<T>>(url).then(unwrap);

export const authApi = {
  login: (email: string, password: string) => post<AuthResponse>('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    post<AuthResponse>('/auth/register', data),
};

export const dashboardApi = {
  get: () => get<DashboardData>('/dashboard'),
};

export const workItemsApi = {
  getAll: (params?: WorkItemFilterParams) => {
    const query: Record<string, unknown> = { ...params };

    if (params?.statusIds?.length) {
      query.statusIds = params.statusIds;
      delete query.statusId;
    } else {
      delete query.statusIds;
    }

    return api
      .get<ApiResponse<PagedResult<WorkItem>>>('/workitems', {
        params: query,
        paramsSerializer: {
          indexes: null,
        },
      })
      .then(unwrap);
  },
  getById: (id: number) => get<WorkItem>(`/workitems/${id}`),
  create: (data: CreateWorkItemDto) => post<WorkItem>('/workitems', data),
  update: (id: number, data: UpdateWorkItemDto) => put<WorkItem>(`/workitems/${id}`, data),
  delete: (id: number) => del<boolean>(`/workitems/${id}`),
  getKanban: () => get<KanbanColumn[]>('/workitems/kanban'),
  updateStatus: (id: number, statusId: number) =>
    post<boolean>(`/workitems/${id}/status`, { statusId }),
  updateKanbanStatus: (workItemId: number, newStatusId: number) =>
    post<boolean>('/workitems/kanban/status', { workItemId, newStatusId }),
  bulkUpdate: (data: { workItemIds: number[]; statusId?: number; priorityId?: number; assignedToId?: number }) =>
    post<boolean>('/workitems/bulk-update', data),
};

export const tasksApi = {
  getAll: (params?: TaskFilterParams) => {
    const query: Record<string, unknown> = { ...params };

    if (params?.statusIds?.length) {
      query.statusIds = params.statusIds;
      delete query.statusId;
    } else {
      delete query.statusIds;
    }

    if (params?.priorityIds?.length) {
      query.priorityIds = params.priorityIds;
      delete query.priorityId;
    } else {
      delete query.priorityIds;
    }

    return api
      .get<ApiResponse<PagedResult<Task>>>('/tasks', {
        params: query,
        paramsSerializer: {
          indexes: null,
        },
      })
      .then(unwrap);
  },
  getById: (id: number) => get<Task>(`/tasks/${id}`),
  create: (data: CreateTaskDto) => post<Task>('/tasks', data),
  update: (id: number, data: UpdateTaskDto) => put<Task>(`/tasks/${id}`, data),
  delete: (id: number) => del<boolean>(`/tasks/${id}`),
};

export const commentsApi = {
  getByEntity: (entityType: string, entityId: number) =>
    get<Comment[]>('/comments', { entityType, entityId }),
  getById: (id: number, entityType: string) =>
    get<Comment>(`/comments/${id}`, { entityType }),
  create: (data: CreateCommentDto) => post<Comment>('/comments', data),
  update: (id: number, entityType: string, data: UpdateCommentDto) =>
    put<Comment>(`/comments/${id}?entityType=${encodeURIComponent(entityType)}`, data),
  delete: (id: number, entityType: string) =>
    del<boolean>(`/comments/${id}?entityType=${encodeURIComponent(entityType)}`),
};

export const projectsApi = {
  getAll: () => get<Project[]>('/projects'),
  getById: (id: number) => get<Project>(`/projects/${id}`),
  create: (data: CreateProjectDto) => post<Project>('/projects', data),
  update: (id: number, data: UpdateProjectDto) => put<Project>(`/projects/${id}`, data),
  delete: (id: number) => del<boolean>(`/projects/${id}`),
};

export const goalsApi = {
  getAll: () => get<Goal[]>('/goals'),
  create: (data: Partial<Goal>) => post<Goal>('/goals', data),
  update: (id: number, data: Partial<Goal>) => put<Goal>(`/goals/${id}`, data),
  delete: (id: number) => del<boolean>(`/goals/${id}`),
};

export const notificationsApi = {
  getAll: (unreadOnly = false) => get<Notification[]>('/notifications', { unreadOnly }),
  getUnreadCount: () => get<number>('/notifications/unread-count'),
  markAsRead: (id: number) => put<boolean>(`/notifications/${id}/read`),
  markAllAsRead: () => put<boolean>('/notifications/read-all'),
};

export const userCapacityApi = {
  getAll: (weekStart?: string) => get<UserCapacity[]>('/usercapacity', weekStart ? { weekStart } : undefined),
  getById: (id: number) => get<UserCapacity>(`/usercapacity/${id}`),
  create: (data: CreateUserCapacityDto) => post<UserCapacity>('/usercapacity', data),
  update: (id: number, data: UpdateUserCapacityDto) => put<UserCapacity>(`/usercapacity/${id}`, data),
  delete: (id: number) => del<boolean>(`/usercapacity/${id}`),
};

/** @deprecated Use userCapacityApi */
export const capacityApi = {
  getAll: () => userCapacityApi.getAll(),
};

export const reportsApi = {
  getReport: (reportType: string, params?: Record<string, unknown>) =>
    get<Record<string, unknown>>(`/reports/${reportType}`, params),
  getMyWork: () => get<MyWorkData>('/reports/my-work'),
};

export const lookupsApi = {
  getAll: () => get<Record<string, LookupDto[]>>('/lookups'),
};

export const usersApi = {
  getAll: (params?: { activeOnly?: boolean }) =>
    get<UserDetail[]>('/users', params as Record<string, unknown>),
  getLookup: () => get<User[]>('/users/lookup'),
  getById: (id: number) => get<UserDetail>(`/users/${id}`),
  create: (data: CreateUserDto) => post<UserDetail>('/users', data),
  update: (id: number, data: UpdateUserDto) => put<UserDetail>(`/users/${id}`, data),
  delete: (id: number) => del<boolean>(`/users/${id}`),
};

export const rolesApi = {
  getAll: () => get<Role[]>('/roles'),
  getById: (id: number) => get<Role>(`/roles/${id}`),
  create: (data: CreateRoleDto) => post<Role>('/roles', data),
  update: (id: number, data: UpdateRoleDto) => put<Role>(`/roles/${id}`, data),
  delete: (id: number) => del<boolean>(`/roles/${id}`),
};

export const timeLogsApi = {
  getAll: (params?: TimeLogFilterParams) => get<TimeLog[]>('/timelogs', params as Record<string, unknown>),
  getById: (id: number) => get<TimeLog>(`/timelogs/${id}`),
  getRunning: () => get<TimeLog | null>('/timelogs/running'),
  getSummary: (params?: TimeLogFilterParams) => get<TimeLogSummary>('/timelogs/summary', params as Record<string, unknown>),
  create: (data: CreateTimeLogDto) => post<TimeLog>('/timelogs', data),
  update: (id: number, data: UpdateTimeLogDto) => put<TimeLog>(`/timelogs/${id}`, data),
  delete: (id: number) => del<boolean>(`/timelogs/${id}`),
  startTimer: (data: { taskId: number; description?: string; entryType?: string }) =>
    post<TimeLog>('/timelogs/start', data),
  stopTimer: (id: number) => post<TimeLog>(`/timelogs/${id}/stop`),
  duplicate: (id: number) => post<TimeLog>(`/timelogs/${id}/duplicate`),
  duplicateAndStart: (id: number) => post<TimeLog>(`/timelogs/${id}/duplicate-start`),
};
