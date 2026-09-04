import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiPlay, FiSquare, FiCopy, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { timeLogsApi, tasksApi, usersApi, projectsApi } from '../services/stratoApi';
import { useAuth } from '../contexts/AuthContext';
import LogTimeModal from '../components/timelogs/LogTimeModal';
import DeleteConfirmModal from '../components/workitems/DeleteConfirmModal';
import {
  emptyTimeLogForm,
  filterTasksForTimeLogPicker,
  timeLogToForm,
  toCreatePayload,
  toUpdatePayload,
  validateTimeLogForm,
  type TimeLogFormState,
} from '../utils/timeLogForm';
import type { Task, TimeLog, TimeLogFilterParams } from '../types';
import {
  addDays,
  dayTotalHours,
  formatDayLabel,
  entryTypeLabel,
  formatClockTime,
  formatDuration,
  formatElapsedCounter,
  formatTimeRange,
  formatWeekLabel,
  getWeekDateRange,
  getWeekDays,
  getWeekStart,
  groupLogsByDay,
  isTimerInstant,
  parseLocalDate,
  toIsoDate,
} from '../utils/timesheetUtils';
import { getApiErrorMessage } from '../utils/apiError';

const CHART_COLORS = ['#D0021B', '#2563EB', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B', '#A855F7'];
type ViewMode = 'day' | 'week' | 'list';

function taskStubFromTimeLog(log: TimeLog): Task {
  return {
    id: log.taskId,
    workItemId: log.workItemId,
    workItemNumber: log.workItemNumber,
    workItemTitle: log.workItemTitle ?? '',
    projectId: log.projectId,
    projectName: log.projectName,
    taskTitle: log.taskTitle,
    statusId: 0,
    statusName: 'Completed',
    priorityId: 0,
    priorityName: '',
    percentComplete: 100,
    completedDate: log.logDate,
    assignedUserIds: [],
    assignedUserNames: [],
    hasActiveBlocker: false,
  };
}

export default function TimesheetPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [userId, setUserId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeLog | null>(null);
  const [form, setForm] = useState<TimeLogFormState>(emptyTimeLogForm());
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [tick, setTick] = useState(0);

  const weekRange = useMemo(() => getWeekDateRange(weekStart), [weekStart]);

  const filterParams = useMemo<TimeLogFilterParams>(() => {
    if (viewMode === 'day') {
      return {
        startDate: selectedDate,
        endDate: selectedDate,
        userId: userId || undefined,
        projectId: projectId || undefined,
      };
    }
    if (viewMode === 'week') {
      return {
        startDate: weekRange.startDate,
        endDate: weekRange.endDate,
        userId: userId || undefined,
        projectId: projectId || undefined,
      };
    }
    return {
      startDate: weekRange.startDate,
      endDate: weekRange.endDate,
      userId: userId || undefined,
      projectId: projectId || undefined,
    };
  }, [viewMode, selectedDate, weekRange, userId, projectId]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['timelogs', filterParams],
    queryFn: () => timeLogsApi.getAll(filterParams),
  });

  const { data: runningTimer } = useQuery({
    queryKey: ['timelogs', 'running'],
    queryFn: () => timeLogsApi.getRunning(),
    refetchInterval: 30000,
  });

  const { data: summary } = useQuery({
    queryKey: ['timelogs', 'summary', filterParams],
    queryFn: () => timeLogsApi.getSummary(filterParams),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'lookup', 'time-log'],
    queryFn: () => tasksApi.getAll({ page: 1, pageSize: 100, excludeCompleted: true }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  const tasks = tasksData?.items ?? [];
  const pickerTasks = useMemo(() => {
    const selectedTaskId = form.taskId || editTarget?.taskId || null;
    let list = tasks;

    // Keep the current task visible when editing an entry tied to a completed task
    // (those are excluded from the lookup query).
    if (selectedTaskId && editTarget && !list.some((task) => task.id === selectedTaskId)) {
      list = [...list, taskStubFromTimeLog(editTarget)];
    }

    return filterTasksForTimeLogPicker(list, selectedTaskId);
  }, [tasks, form.taskId, editTarget]);
  const groupedLogs = useMemo(() => groupLogsByDay(logs), [logs]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    const hasRunning = runningTimer?.isRunning || logs.some((log) => log.isRunning);
    if (!hasRunning) return undefined;
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [runningTimer?.isRunning, runningTimer?.id, logs]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['timelogs'] });
  };

  const createMutation = useMutation({
    mutationFn: () => timeLogsApi.create(toCreatePayload(form)),
    onSuccess: () => {
      setModalOpen(false);
      setFormError('');
      refresh();
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Failed to log time.')),
  });

  const updateMutation = useMutation({
    mutationFn: () => timeLogsApi.update(editTarget!.id, toUpdatePayload(form)),
    onSuccess: () => {
      setEditTarget(null);
      setFormError('');
      refresh();
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Failed to update time log.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => timeLogsApi.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      refresh();
    },
  });

  const stopMutation = useMutation({
    mutationFn: (id: number) => timeLogsApi.stopTimer(id),
    onSuccess: () => {
      setActionError('');
      refresh();
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to stop timer.')),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => timeLogsApi.duplicate(id),
    onSuccess: () => {
      setActionError('');
      refresh();
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to duplicate time entry.')),
  });

  const duplicateStartMutation = useMutation({
    mutationFn: (log: TimeLog) =>
      timeLogsApi.startTimer({
        taskId: log.taskId,
        description: log.description,
      }),
    onSuccess: () => {
      setTick(0);
      setActionError('');
      refresh();
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Failed to start timer.')),
  });

  const openCreate = () => {
    setForm(emptyTimeLogForm());
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (log: TimeLog) => {
    setForm(timeLogToForm(log));
    setFormError('');
    setEditTarget(log);
  };

  const handleSubmit = () => {
    const validationError = validateTimeLogForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (editTarget) updateMutation.mutate();
    else createMutation.mutate();
  };

  const canModify = (log: TimeLog) => user?.id === log.userId;

  const runningCounter = runningTimer?.isRunning && runningTimer.startedAt
    ? formatElapsedCounter(runningTimer.startedAt, Date.now(), true)
    : null;
  void tick;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <p className="text-gray-500 text-sm">Track time with timers, manual entries, and day/week views</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm"
        >
          <FiPlus /> Log Time
        </button>
      </div>

      {actionError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center justify-between gap-3">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError('')} className="text-red-300 hover:text-red-200 shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {runningTimer && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary">Timer running</p>
            <p className="font-semibold">{runningTimer.taskTitle}</p>
            <p className="text-sm text-gray-500">{runningTimer.description || 'No notes'}</p>
            {runningTimer.startedAt && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <span>Started</span>
                <span className="inline-flex items-center rounded-md bg-background/80 border border-border px-2.5 py-1 font-mono text-sm font-semibold text-gray-800 tabular-nums">
                  {formatClockTime(runningTimer.startedAt, true)}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-mono font-bold text-primary tabular-nums tracking-wider">
              {runningCounter ?? '00:00:00'}
            </span>
            <button
              type="button"
              onClick={() => stopMutation.mutate(runningTimer.id)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium"
            >
              <FiSquare /> Stop
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['day', 'week', 'list'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              viewMode === mode ? 'bg-primary text-background' : 'bg-card border border-border text-gray-400'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {viewMode === 'day' && (
          <div className="sm:col-span-2 flex items-center gap-2">
            <button type="button" onClick={() => setSelectedDate(toIsoDate(addDays(parseLocalDate(selectedDate), -1)))} className="p-2 border border-border rounded-lg">
              <FiChevronLeft />
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm" />
            <button type="button" onClick={() => setSelectedDate(toIsoDate(addDays(parseLocalDate(selectedDate), 1)))} className="p-2 border border-border rounded-lg">
              <FiChevronRight />
            </button>
          </div>
        )}
        {viewMode === 'week' && (
          <div className="sm:col-span-2 flex items-center gap-2">
            <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 border border-border rounded-lg">
              <FiChevronLeft />
            </button>
            <div className="flex-1 text-sm font-medium text-center">{formatWeekLabel(weekStart)}</div>
            <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 border border-border rounded-lg">
              <FiChevronRight />
            </button>
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-500 mb-1">User</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value ? +e.target.value : '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
            <option value="">All Users</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Project</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value ? +e.target.value : '')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
          </select>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${viewMode === 'week' ? '' : 'md:grid-cols-4'}`}>
        <div className={`bg-card border border-border rounded-xl p-4 flex items-center gap-3 ${viewMode === 'week' ? '' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <FiClock className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-xl font-bold">{summary?.grandTotalHours?.toFixed(1) ?? '0.0'}</p>
          </div>
        </div>
        {viewMode !== 'week' && (
          <div className="bg-card border border-border rounded-xl p-4 md:col-span-3">
            <p className="text-xs text-gray-500 mb-2">Quick totals for selected period</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>{summary?.hoursByUser.length ?? 0}</strong> users</span>
              <span><strong>{summary?.hoursByMonth.length ?? 0}</strong> months</span>
              <span><strong>{summary?.hoursByProject.length ?? 0}</strong> projects</span>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'week' && (
        <div className="space-y-4">
          <WeekHoursChart weekDays={weekDays} groupedLogs={groupedLogs} />

          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="overflow-x-auto pb-1 -mx-1 px-1">
              <div className="grid grid-cols-7 gap-3 min-w-[72rem] xl:min-w-0">
                {weekDays.map((day) => {
                  const key = toIsoDate(day);
                  const dayLogs = groupedLogs[key] ?? [];
                  const isToday = key === toIsoDate(new Date());

                  return (
                    <WeekDayColumn
                      key={key}
                      day={day}
                      dayLogs={dayLogs}
                      isToday={isToday}
                      tick={tick}
                      canModify={canModify}
                      onSelectDay={() => {
                        setSelectedDate(key);
                        setViewMode('day');
                      }}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onDuplicate={(id) => duplicateMutation.mutate(id)}
                      onPlay={(log) => duplicateStartMutation.mutate(log)}
                      onStop={(id) => stopMutation.mutate(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'day' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-primary mb-4">{formatDayLabel(parseLocalDate(selectedDate))}</h2>
          {isLoading ? (
            <LoadingState />
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-12">No time entries for this day.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <TimeEntryRow
                  key={log.id}
                  log={log}
                  tick={tick}
                  canModify={canModify(log)}
                  onEdit={() => openEdit(log)}
                  onDelete={() => setDeleteTarget(log)}
                  onDuplicate={() => duplicateMutation.mutate(log.id)}
                  onPlay={() => duplicateStartMutation.mutate(log)}
                  onStop={() => stopMutation.mutate(log.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SummaryChart title="Hours Per User" data={summary?.hoursByUser ?? []} />
            <SummaryChart title="Hours Per Month" data={summary?.hoursByMonth ?? []} />
            <SummaryChart title="Hours Per Project" data={summary?.hoursByProject ?? []} />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-primary">Time Entries</h2>
            </div>
            {isLoading ? (
              <LoadingState />
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-12">No time entries for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-gray-500">
                      <th className="p-3">Date</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Task</th>
                      <th className="p-3">Start – End</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-background/30">
                        <td className="p-3">{log.logDate.slice(0, 10)}</td>
                        <td className="p-3 text-gray-400">{log.userName}</td>
                        <td className="p-3 text-gray-400">{entryTypeLabel(log.entryType)}</td>
                        <td className="p-3">{log.taskTitle}</td>
                        <td className="p-3 text-gray-600 font-medium">
                          {formatTimeRange(log)}
                        </td>
                        <td className="p-3 font-medium">
                          {displayEntryDuration(log, tick)}
                        </td>
                        <td className="p-3 text-gray-400 max-w-xs truncate">{log.description ?? '—'}</td>
                        <td className="p-3">
                          {canModify(log) && (
                            <EntryActions
                              log={log}
                              onEdit={() => openEdit(log)}
                              onDelete={() => setDeleteTarget(log)}
                              onDuplicate={() => duplicateMutation.mutate(log.id)}
                              onPlay={() => duplicateStartMutation.mutate(log)}
                              onStop={() => stopMutation.mutate(log.id)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <LogTimeModal
        open={modalOpen || !!editTarget}
        title={editTarget ? 'Edit Time Entry' : 'Log Time'}
        form={form}
        tasks={pickerTasks}
        tasksLoading={tasksLoading}
        loading={createMutation.isPending || updateMutation.isPending}
        error={formError}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditTarget(null); setFormError(''); }}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Time Entry"
        message={`Delete ${formatDuration(deleteTarget?.hours ?? 0)} logged on ${deleteTarget?.logDate.slice(0, 10)}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center p-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EntryActions({
  log,
  onEdit,
  onDelete,
  onDuplicate,
  onPlay,
  onStop,
  compact,
}: {
  log: TimeLog;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPlay: () => void;
  onStop: () => void;
  compact?: boolean;
}) {
  const buttonClass = compact ? 'p-1 rounded' : 'p-1.5 rounded';
  return (
    <div className={`flex ${compact ? 'gap-0' : 'gap-1'}`}>
      {log.isRunning ? (
        <ActionButton title="Stop" onClick={onStop} className={buttonClass}><FiSquare size={compact ? 12 : 14} /></ActionButton>
      ) : (
        <ActionButton title="Start timer" onClick={onPlay} className={buttonClass}><FiPlay size={compact ? 12 : 14} /></ActionButton>
      )}
      <ActionButton title="Duplicate" onClick={onDuplicate} className={buttonClass}><FiCopy size={compact ? 12 : 14} /></ActionButton>
      <ActionButton title="Edit" onClick={onEdit} className={buttonClass}><FiEdit2 size={compact ? 12 : 14} /></ActionButton>
      <ActionButton title="Delete" onClick={onDelete} danger className={buttonClass}><FiTrash2 size={compact ? 12 : 14} /></ActionButton>
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  children,
  danger,
  className = 'p-1.5 rounded',
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} ${danger ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-primary'}`}
      title={title}
    >
      {children}
    </button>
  );
}

function displayEntryDuration(log: TimeLog, liveTick = 0): string {
  void liveTick;
  if (log.isRunning && log.startedAt) {
    return formatElapsedCounter(log.startedAt, Date.now(), isTimerInstant(log));
  }
  return formatDuration(log.hours);
}

function WeekHoursChart({
  weekDays,
  groupedLogs,
}: {
  weekDays: Date[];
  groupedLogs: Record<string, TimeLog[]>;
}) {
  const data = weekDays.map((day) => {
    const key = toIsoDate(day);
    const hours = dayTotalHours(groupedLogs[key] ?? []);
    return {
      key,
      label: day.toLocaleDateString([], { weekday: 'short' }),
      dayNum: day.getDate(),
      hours,
      isToday: key === toIsoDate(new Date()),
    };
  });

  const maxHours = Math.max(...data.map((d) => d.hours), 0.25);
  const weekTotal = data.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-800">Week at a glance</p>
        <span className="text-sm font-bold text-primary tabular-nums">{formatDuration(weekTotal)} total</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {data.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-1.5 min-w-0">
            <div className="w-full h-20 flex items-end justify-center">
              <div
                className={`w-full max-w-10 rounded-t-md transition-all ${
                  day.isToday ? 'bg-primary' : day.hours > 0 ? 'bg-primary/70' : 'bg-gray-200'
                }`}
                style={{ height: `${Math.max((day.hours / maxHours) * 100, day.hours > 0 ? 12 : 4)}%` }}
              />
            </div>
            <div className="text-center min-w-0">
              <p className={`text-[10px] font-medium uppercase tracking-wide truncate ${day.isToday ? 'text-primary' : 'text-gray-500'}`}>
                {day.label}
              </p>
              <p className={`text-xs font-bold tabular-nums ${day.isToday ? 'text-primary' : 'text-gray-800'}`}>
                {day.dayNum}
              </p>
              <p className="text-[10px] text-gray-500 tabular-nums">
                {day.hours > 0 ? formatDuration(day.hours) : '—'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekDayColumn({
  day,
  dayLogs,
  isToday,
  tick,
  canModify,
  onSelectDay,
  onEdit,
  onDelete,
  onDuplicate,
  onPlay,
  onStop,
}: {
  day: Date;
  dayLogs: TimeLog[];
  isToday: boolean;
  tick: number;
  canModify: (log: TimeLog) => boolean;
  onSelectDay: () => void;
  onEdit: (log: TimeLog) => void;
  onDelete: (log: TimeLog) => void;
  onDuplicate: (id: number) => void;
  onPlay: (log: TimeLog) => void;
  onStop: (id: number) => void;
}) {
  const total = dayTotalHours(dayLogs);

  return (
    <div
      className={`flex flex-col rounded-xl border min-h-[240px] overflow-hidden ${
        isToday ? 'border-primary/40 bg-primary/[0.02] ring-1 ring-primary/20' : 'border-border bg-card'
      }`}
    >
      <button
        type="button"
        onClick={onSelectDay}
        className={`flex items-center justify-between px-3 py-2.5 border-b text-left transition-colors ${
          isToday ? 'border-primary/20 bg-primary/5 hover:bg-primary/10' : 'border-border/70 hover:bg-background/60'
        }`}
      >
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-gray-500'}`}>
            {day.toLocaleDateString([], { weekday: 'short' })}
          </span>
          <span className={`text-base font-bold leading-none ${isToday ? 'text-primary' : 'text-gray-900'}`}>
            {day.getDate()}
          </span>
        </div>
        <span
          className={`text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full shrink-0 ${
            total > 0 ? 'bg-primary/10 text-primary' : 'text-gray-400'
          }`}
        >
          {total > 0 ? formatDuration(total) : '—'}
        </span>
      </button>

      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[28rem]">
        {dayLogs.length === 0 ? (
          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border/80">
            <p className="text-[11px] text-gray-400">No time logged</p>
          </div>
        ) : (
          dayLogs.map((log) => (
            <WeekEntryCard
              key={log.id}
              log={log}
              tick={tick}
              canModify={canModify(log)}
              onEdit={() => onEdit(log)}
              onDelete={() => onDelete(log)}
              onDuplicate={() => onDuplicate(log.id)}
              onPlay={() => onPlay(log)}
              onStop={() => onStop(log.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WeekEntryCard({
  log,
  tick,
  canModify,
  onEdit,
  onDelete,
  onDuplicate,
  onPlay,
  onStop,
}: {
  log: TimeLog;
  tick: number;
  canModify: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <div
      className={`group relative rounded-lg border p-2 transition-all ${
        log.isRunning
          ? 'border-primary/40 bg-primary/5 shadow-sm'
          : 'border-border/70 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <p className="text-[11px] font-medium text-gray-900 truncate leading-tight">{log.taskTitle}</p>
      <p className="text-[10px] text-gray-500 font-mono tabular-nums mt-0.5">{formatTimeRange(log)}</p>
      <div className="flex items-center justify-between mt-1.5 gap-1">
        <span className={`text-[11px] font-bold text-primary ${log.isRunning ? 'font-mono tabular-nums' : ''}`}>
          {displayEntryDuration(log, tick)}
        </span>
        {log.isRunning && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-primary/80">Live</span>
        )}
      </div>
      {canModify && (
        <div className="mt-1.5 pt-1.5 border-t border-border/50 flex justify-end opacity-70 group-hover:opacity-100 transition-opacity">
          <EntryActions
            log={log}
            compact
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPlay={onPlay}
            onStop={onStop}
          />
        </div>
      )}
    </div>
  );
}

function TimeEntryRow({
  log,
  tick,
  canModify,
  onEdit,
  onDelete,
  onDuplicate,
  onPlay,
  onStop,
}: {
  log: TimeLog;
  tick: number;
  canModify: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg p-4">
      <div>
        <p className="font-medium">{log.taskTitle}</p>
        <p className="text-sm font-medium text-gray-600 font-mono tabular-nums">
          {log.isRunning && log.startedAt ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-gray-500 font-sans">Started</span>
              <span className="inline-flex rounded-md bg-background border border-border px-2 py-0.5 font-mono text-sm font-semibold text-gray-800">
                {formatClockTime(log.startedAt, true)}
              </span>
            </span>
          ) : (
            formatTimeRange(log)
          )}
        </p>
        <p className="text-sm text-gray-500">{entryTypeLabel(log.entryType)}</p>
        <p className="text-sm text-gray-400 mt-1">{log.description || 'No notes'}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-lg font-bold text-primary ${log.isRunning ? 'font-mono tabular-nums' : ''}`}>
          {displayEntryDuration(log, tick)}
        </span>
        {canModify && (
          <EntryActions
            log={log}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPlay={onPlay}
            onStop={onStop}
          />
        )}
      </div>
    </div>
  );
}

function SummaryChart({ title, data }: { title: string; data: { label: string; totalHours: number }[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-primary mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No data</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="totalHours" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1 max-h-24 overflow-y-auto">
            {data.map((item) => (
              <div key={item.label} className="flex justify-between text-xs text-gray-600">
                <span className="truncate pr-2">{item.label}</span>
                <span className="font-medium text-gray-800 shrink-0">{item.totalHours.toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
