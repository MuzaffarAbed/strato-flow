import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheckSquare,
  FiClock,
  FiArrowRight,
  FiSlash,
  FiCalendar,
} from 'react-icons/fi';
import { reportsApi } from '../services/stratoApi';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';
import { formatDuration } from '../utils/timesheetUtils';
import type { Task, TimeLog, WorkItem } from '../types';

function formatDate(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

function isDueSoon(dueDate?: string | null) {
  if (!dueDate) return false;
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= 3;
}

function isOverdueDate(dueDate?: string | null) {
  if (!dueDate) return false;
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export default function MyWorkPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-work'],
    queryFn: () => reportsApi.getMyWork(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-2">Could not load your work.</p>
        <p className="text-sm text-gray-500">Please refresh and try again.</p>
      </div>
    );
  }

  const workItems = data.assignedWorkItems ?? [];
  const tasks = data.assignedTasks ?? [];
  const overdue = data.overdueWork ?? [];
  const blocked = data.blockedWork ?? [];
  const recentLogs = data.recentTimeLogs ?? [];
  const dueSoonTasks = tasks.filter((task) => isDueSoon(task.dueDate) && !isOverdueDate(task.dueDate));
  const blockedTasks = tasks.filter((task) => task.hasActiveBlocker);
  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Work</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hi {firstName} — here is what needs your attention and what you are working on.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/tasks" className="px-3 py-2 text-sm border border-border rounded-lg hover:border-primary">
            View all tasks
          </Link>
          <Link to="/work-items" className="px-3 py-2 text-sm border border-border rounded-lg hover:border-primary">
            View work items
          </Link>
          <Link to="/timesheet" className="px-3 py-2 text-sm bg-primary text-background rounded-lg font-medium">
            Log time
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="My Work Items" value={workItems.length} icon={<FiBriefcase className="w-6 h-6" />} />
        <StatCard title="My Tasks" value={tasks.length} icon={<FiCheckSquare className="w-6 h-6" />} />
        <StatCard
          title="Overdue"
          value={overdue.length}
          color={overdue.length > 0 ? 'text-red-500' : 'text-primary'}
          icon={<FiAlertTriangle className="w-6 h-6" />}
        />
        <StatCard
          title="Blocked"
          value={blocked.length || blockedTasks.length}
          color={(blocked.length || blockedTasks.length) > 0 ? 'text-orange-500' : 'text-primary'}
          icon={<FiSlash className="w-6 h-6" />}
        />
        <StatCard
          title="Hours This Week"
          value={formatDuration(Number(data.totalHoursThisWeek ?? 0))}
          icon={<FiClock className="w-6 h-6" />}
        />
      </div>

      {(overdue.length > 0 || blocked.length > 0 || dueSoonTasks.length > 0) && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Needs attention</h2>
            <p className="text-sm text-gray-500">Items that are overdue, blocked, or due soon.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AttentionCard
              title="Overdue work items"
              count={overdue.length}
              tone="danger"
              emptyText="Nothing overdue"
            >
              {overdue.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={`/work-items/${item.id}`}
                  className="block p-3 rounded-lg bg-background/80 hover:bg-background transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary">{item.workItemNumber}</p>
                      <p className="text-sm text-gray-800 line-clamp-2">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.projectName || 'No project'}</p>
                    </div>
                    <span className="text-xs text-red-500 shrink-0">{formatDate(item.dueDate)}</span>
                  </div>
                </Link>
              ))}
            </AttentionCard>

            <AttentionCard
              title="Blocked tasks"
              count={blocked.length}
              tone="warning"
              emptyText="Nothing blocked"
            >
              {blocked.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={`/tasks/${item.taskId}`}
                  className="block p-3 rounded-lg bg-background/80 hover:bg-background transition-colors"
                >
                  <p className="text-xs text-gray-500">{item.workItemNumber}</p>
                  <p className="text-sm text-gray-800 line-clamp-1">{item.taskTitle}</p>
                  <p className="text-xs text-orange-600 mt-1 line-clamp-2">{item.blockedReason}</p>
                </Link>
              ))}
            </AttentionCard>

            <AttentionCard
              title="Due in next 3 days"
              count={dueSoonTasks.length}
              tone="info"
              emptyText="Nothing due soon"
            >
              {dueSoonTasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="block p-3 rounded-lg bg-background/80 hover:bg-background transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2">{task.taskTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.workItemNumber} · {task.projectName || 'No project'}
                      </p>
                    </div>
                    <span className="text-xs text-amber-600 shrink-0 flex items-center gap-1">
                      <FiCalendar size={12} />
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </Link>
              ))}
            </AttentionCard>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WorkItemsPanel items={workItems} />
        <TasksPanel items={tasks} />
      </div>

      <RecentTimePanel logs={recentLogs} hoursThisWeek={Number(data.totalHoursThisWeek ?? 0)} />
    </div>
  );
}

function AttentionCard({
  title,
  count,
  tone,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  tone: 'danger' | 'warning' | 'info';
  emptyText: string;
  children: React.ReactNode;
}) {
  const tones = {
    danger: 'border-red-500/30 bg-red-500/5',
    warning: 'border-orange-500/30 bg-orange-500/5',
    info: 'border-amber-500/30 bg-amber-500/5',
  };

  return (
    <div className={`border rounded-xl p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">{count}</span>
      </div>
      <div className="space-y-2">
        {count > 0 ? children : <p className="text-sm text-gray-500 py-4 text-center">{emptyText}</p>}
      </div>
    </div>
  );
}

function WorkItemsPanel({ items }: { items: WorkItem[] }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-primary">Assigned work items</h2>
          <p className="text-xs text-gray-500 mt-0.5">Work you own as the primary assignee</p>
        </div>
        <Link to="/work-items" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Open list <FiArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-2 max-h-[28rem] overflow-y-auto">
        {items.map((item) => {
          const overdue = isOverdueDate(item.dueDate) && !item.completedDate;
          return (
            <Link
              key={item.id}
              to={`/work-items/${item.id}`}
              className="block p-3 rounded-lg bg-background border border-transparent hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-primary">{item.workItemNumber}</span>
                    {item.workItemTypeName && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-border/60 text-gray-600">
                        {item.workItemTypeName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.projectName || 'No project'}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <span className="inline-block text-xs bg-border px-2 py-0.5 rounded">{item.statusName}</span>
                  <p className="text-xs text-gray-500">{item.priorityName}</p>
                  {item.dueDate && (
                    <p className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      Due {formatDate(item.dueDate)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{item.percentComplete ?? 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, item.percentComplete ?? 0))}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">No work items are assigned to you yet.</p>
        )}
      </div>
    </section>
  );
}

function TasksPanel({ items }: { items: Task[] }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-primary">Assigned tasks</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tasks you need to complete</p>
        </div>
        <Link to="/tasks" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Open list <FiArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-2 max-h-[28rem] overflow-y-auto">
        {items.map((task) => {
          const overdue = isOverdueDate(task.dueDate) && !task.completedDate;
          return (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="block p-3 rounded-lg bg-background border border-transparent hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.hasActiveBlocker && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600">
                        Blocked
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{task.workItemNumber}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{task.taskTitle}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {task.workItemTitle}
                    {task.projectName ? ` · ${task.projectName}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <span className="inline-block text-xs bg-border px-2 py-0.5 rounded">{task.statusName}</span>
                  <p className="text-xs text-gray-500">{task.priorityName}</p>
                  {task.dueDate && (
                    <p className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      Due {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                  <span>Complete</span>
                  <span>{task.percentComplete ?? 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, task.percentComplete ?? 0))}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">No tasks are assigned to you yet.</p>
        )}
      </div>
    </section>
  );
}

function RecentTimePanel({ logs, hoursThisWeek }: { logs: TimeLog[]; hoursThisWeek: number }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-primary">Recent time logged</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDuration(hoursThisWeek)} recorded this week
          </p>
        </div>
        <Link to="/timesheet" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Open timesheet <FiArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-2">
        {logs.slice(0, 8).map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{log.taskTitle}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                {log.workItemNumber}
                {log.workItemTitle ? ` — ${log.workItemTitle}` : ''}
                {log.projectName ? ` · ${log.projectName}` : ''}
              </p>
              {log.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{log.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-primary">
                {formatDuration(Number(log.effectiveHours ?? log.hours ?? 0))}
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(log.logDate)}</p>
              {log.entryType && <p className="text-[11px] text-gray-400 mt-0.5">{log.entryType}</p>}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No time logged yet. Use Timesheet to record your hours.
          </p>
        )}
      </div>
    </section>
  );
}
