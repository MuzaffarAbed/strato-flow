import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { timeLogsApi, tasksApi, usersApi, projectsApi } from '../services/stratoApi';
import { useAuth } from '../contexts/AuthContext';
import LogTimeModal from '../components/timelogs/LogTimeModal';
import DeleteConfirmModal from '../components/workitems/DeleteConfirmModal';
import {
  emptyTimeLogForm,
  getMonthDateRange,
  timeLogToForm,
  toCreatePayload,
  toUpdatePayload,
  type TimeLogFormState,
} from '../utils/timeLogForm';
import { getApiErrorMessage } from '../utils/apiError';
import type { TimeLog, TimeLogFilterParams } from '../types';

const CHART_COLORS = ['#D0021B', '#2563EB', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B', '#A855F7'];

export default function TimesheetPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const defaultRange = getMonthDateRange();

  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [userId, setUserId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeLog | null>(null);
  const [form, setForm] = useState<TimeLogFormState>(emptyTimeLogForm());
  const [formError, setFormError] = useState('');

  const filterParams = useMemo<TimeLogFilterParams>(() => ({
    startDate,
    endDate,
    userId: userId || undefined,
    projectId: projectId || undefined,
  }), [startDate, endDate, userId, projectId]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['timelogs', filterParams],
    queryFn: () => timeLogsApi.getAll(filterParams),
  });

  const { data: summary } = useQuery({
    queryKey: ['timelogs', 'summary', filterParams],
    queryFn: () => timeLogsApi.getSummary(filterParams),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'lookup'],
    queryFn: () => tasksApi.getAll({ page: 1, pageSize: 100 }),
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
    if (!form.taskId) {
      setFormError('Task is required.');
      return;
    }
    if (form.hours <= 0) {
      setFormError('Hours must be greater than zero.');
      return;
    }
    if (editTarget) updateMutation.mutate();
    else createMutation.mutate();
  };

  const canModify = (log: TimeLog) => user?.id === log.userId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <p className="text-gray-500 text-sm">Log and review time across tasks and projects</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm"
        >
          <FiPlus /> Log Time
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <FiClock className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-xl font-bold">{summary?.grandTotalHours?.toFixed(1) ?? '0.0'}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 md:col-span-3">
          <p className="text-xs text-gray-500 mb-2">Quick totals for selected period</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><strong>{summary?.hoursByUser.length ?? 0}</strong> users</span>
            <span><strong>{summary?.hoursByMonth.length ?? 0}</strong> months</span>
            <span><strong>{summary?.hoursByProject.length ?? 0}</strong> projects</span>
          </div>
        </div>
      </div>

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
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12">No time entries for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-gray-500">
                  <th className="p-3">Date</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Task</th>
                  <th className="p-3">Work Item</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-background/30">
                    <td className="p-3">{log.logDate.slice(0, 10)}</td>
                    <td className="p-3 text-gray-400">{log.userName}</td>
                    <td className="p-3">{log.taskTitle}</td>
                    <td className="p-3 text-gray-400">{log.workItemNumber}</td>
                    <td className="p-3 text-gray-400">{log.projectName ?? '—'}</td>
                    <td className="p-3 font-medium">{log.hours}</td>
                    <td className="p-3 text-gray-400 max-w-xs truncate">{log.description ?? '—'}</td>
                    <td className="p-3">
                      {canModify(log) && (
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openEdit(log)} className="p-1.5 text-gray-500 hover:text-primary rounded" title="Edit">
                            <FiEdit2 size={14} />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(log)} className="p-1.5 text-gray-500 hover:text-red-400 rounded" title="Delete">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LogTimeModal
        open={modalOpen || !!editTarget}
        title={editTarget ? 'Edit Time Entry' : 'Log Time'}
        form={form}
        tasks={tasks}
        loading={createMutation.isPending || updateMutation.isPending}
        error={formError}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditTarget(null); setFormError(''); }}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Time Entry"
        message={`Delete ${deleteTarget?.hours}h logged on ${deleteTarget?.logDate.slice(0, 10)}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
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
