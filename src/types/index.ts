export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  departmentName?: string;
  roleName: string;
  avatarUrl?: string;
}

export interface UserDetail extends User {
  departmentId?: number;
  roleId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId?: number;
  roleId: number;
  isActive?: boolean;
}

export interface UpdateUserDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  departmentId?: number;
  roleId: number;
  isActive: boolean;
}

export interface Role {
  id: number;
  name: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

export interface CreateRoleDto {
  name: string;
  isActive?: boolean;
}

export interface UpdateRoleDto {
  name: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface CreateWorkItemDto {
  title: string;
  description?: string;
  businessReason?: string;
  priorityId: number;
  statusId: number;
  assignedToId?: number;
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  goalId?: number;
  projectId?: number;
  workItemTypeId: number;
  tagIds?: number[];
}

export interface UpdateWorkItemDto extends CreateWorkItemDto {
  percentComplete: number;
  actualHours?: number;
}

export interface WorkItemFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
  statusId?: number;
  priorityId?: number;
  assignedToId?: number;
  projectId?: number;
  goalId?: number;
  workItemTypeId?: number;
}

export interface WorkItem {
  id: number;
  workItemNumber: string;
  title: string;
  description?: string;
  businessReason?: string;
  priorityId: number;
  priorityName: string;
  priorityColor?: string;
  statusId: number;
  statusName: string;
  statusColor?: string;
  assignedToId?: number;
  assignedToName?: string;
  estimatedHours?: number;
  actualHours?: number;
  percentComplete: number;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  goalId?: number;
  goalTitle?: string;
  projectId?: number;
  projectName?: string;
  workItemTypeId: number;
  workItemTypeName: string;
  createdByName: string;
  createdAt: string;
  tags: string[];
}

export interface KanbanColumn {
  statusId: number;
  statusName: string;
  color?: string;
  sortOrder: number;
  items: KanbanWorkItem[];
}

export interface KanbanWorkItem {
  id: number;
  workItemNumber: string;
  title: string;
  statusId: number;
  statusName: string;
  priorityName: string;
  priorityColor?: string;
  assignedToName?: string;
  dueDate?: string;
  percentComplete: number;
}

export interface DashboardData {
  stats: {
    openWorkItems: number;
    completedThisMonth: number;
    blockedTasks: number;
    totalHoursLogged: number;
    overdueItems: number;
    activeProjects: number;
  };
  workItemsByStatus: ChartData[];
  workItemsByPriority: ChartData[];
  hoursLoggedPerUser: ChartData[];
  monthlyCompletionTrend: ChartData[];
  teamCapacityUtilization: CapacityChart[];
  recentActivity: ActivityFeed[];
  recentComments: CommentFeed[];
  recentWorkItems: RecentWorkItem[];
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface CapacityChart {
  userName: string;
  availableHours: number;
  allocatedHours: number;
  actualHours: number;
  utilizationPercent: number;
}

export interface ActivityFeed {
  action: string;
  entityType: string;
  entityName: string;
  userName: string;
  timestamp: string;
}

export interface CommentFeed {
  id: number;
  entityType: string;
  entityName: string;
  comment: string;
  userName: string;
  createdAt: string;
}

export interface Comment {
  id: number;
  entityType: string;
  entityId: number;
  userId: number;
  userName: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommentDto {
  entityType: 'WorkItem' | 'Task';
  entityId: number;
  comment: string;
}

export interface UpdateCommentDto {
  comment: string;
}

export interface RecentWorkItem {
  id: number;
  workItemNumber: string;
  title: string;
  statusName: string;
  priorityName: string;
  createdAt: string;
}

export interface Task {
  id: number;
  workItemId: number;
  workItemNumber: string;
  workItemTitle: string;
  taskTitle: string;
  taskDescription?: string;
  assignedToId?: number;
  assignedToName?: string;
  statusId: number;
  statusName: string;
  priorityId: number;
  priorityName: string;
  estimatedHours?: number;
  actualHours?: number;
  percentComplete: number;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  assignedUserIds: number[];
  assignedUserNames: string[];
  hasActiveBlocker: boolean;
}

export interface CreateTaskDto {
  workItemId: number;
  taskTitle: string;
  taskDescription?: string;
  assignedToId?: number;
  statusId: number;
  priorityId: number;
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  assignedUserIds?: number[];
}

export interface UpdateTaskDto extends CreateTaskDto {
  percentComplete: number;
  actualHours?: number;
}

export interface TaskFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  workItemId?: number;
  assignedToId?: number;
  statusId?: number;
  priorityId?: number;
  blockedOnly?: boolean;
}

export interface Project {
  id: number;
  projectName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  workItemCount: number;
  progressPercent: number;
}

export interface CreateProjectDto {
  projectName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

export interface UpdateProjectDto extends CreateProjectDto {}

export interface Goal {
  id: number;
  goalTitle: string;
  goalDescription?: string;
  isActive: boolean;
  workItemCount: number;
  progressPercent: number;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserCapacity {
  id: number;
  userId: number;
  userName: string;
  weekStartDate: string;
  availableHours: number;
  allocatedHours: number;
  actualHours: number;
  remainingHours: number;
  utilizationPercentage: number;
  remainingCapacity: number;
  capacityPercentage: number;
  isOverAllocated: boolean;
}

export interface CreateUserCapacityDto {
  userId: number;
  weekStartDate: string;
  availableHours: number;
}

export interface UpdateUserCapacityDto {
  weekStartDate?: string;
  availableHours: number;
}

export interface LookupDto {
  id: number;
  name: string;
  color?: string;
  sortOrder?: number;
}

export interface MyWorkData {
  assignedWorkItems: WorkItem[];
  assignedTasks: Task[];
  overdueWork: WorkItem[];
  blockedWork: unknown[];
  recentTimeLogs: TimeLog[];
  totalHoursThisWeek: number;
}

export interface TimeLog {
  id: number;
  taskId: number;
  taskTitle: string;
  workItemId: number;
  workItemNumber: string;
  projectId?: number;
  projectName?: string;
  userId: number;
  userName: string;
  hours: number;
  logDate: string;
  description?: string;
  createdAt: string;
}

export interface CreateTimeLogDto {
  taskId: number;
  hours: number;
  logDate: string;
  description?: string;
}

export interface UpdateTimeLogDto {
  taskId: number;
  hours: number;
  logDate: string;
  description?: string;
}

export interface TimeLogFilterParams {
  userId?: number;
  taskId?: number;
  workItemId?: number;
  projectId?: number;
  startDate?: string;
  endDate?: string;
}

export interface HoursSummaryItem {
  id?: number;
  label: string;
  totalHours: number;
}

export interface TimeLogSummary {
  grandTotalHours: number;
  hoursByUser: HoursSummaryItem[];
  hoursByMonth: HoursSummaryItem[];
  hoursByProject: HoursSummaryItem[];
}
