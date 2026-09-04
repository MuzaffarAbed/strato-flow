import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiClock, FiFile, FiFileText, FiLayers, FiUsers } from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { projectsApi, timeLogsApi, usersApi } from '../../services/stratoApi';
import StatCard from '../StatCard';
import type { TimeLog, TimeLogFilterParams } from '../../types';
import {
  entryTypeLabel,
  formatTimeRange,
} from '../../utils/timesheetUtils';
import {
  buildDailyHours,
  buildEntryTypeHours,
  formatReportHours,
  formatReportPeriod,
  getDateRangeForPreset,
  groupLogsByDateDesc,
  logDisplayHours,
  type DatePreset,
} from '../../utils/timesheetReportUtils';

const CHART_COLORS = ['#D0021B', '#2563EB', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B', '#A855F7'];

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom', label: 'Custom Range' },
];

function SummaryChart({
  title,
  data,
  valueKey = 'totalHours',
}: {
  title: string;
  data: { label: string; totalHours: number }[];
  valueKey?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 h-full">
      <h3 className="text-sm font-semibold text-primary mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No data for this period</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}h`, 'Hours']}
                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1 max-h-28 overflow-y-auto">
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

function displayDuration(log: TimeLog): string {
  return formatReportHours(logDisplayHours(log));
}

export default function TimesheetReport() {
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [userId, setUserId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');

  const dateRange = useMemo(
    () => getDateRangeForPreset(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );

  const filterParams = useMemo<TimeLogFilterParams>(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    userId: userId || undefined,
    projectId: projectId || undefined,
  }), [dateRange, userId, projectId]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['timelogs', 'report', filterParams],
    queryFn: () => timeLogsApi.getAll(filterParams),
  });

  const { data: summary } = useQuery({
    queryKey: ['timelogs', 'report-summary', filterParams],
    queryFn: () => timeLogsApi.getSummary(filterParams),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const usersSorted = useMemo(
    () => [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' })),
    [users],
  );

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  const dailyHours = useMemo(() => buildDailyHours(logs), [logs]);
  const entryTypeHours = useMemo(() => buildEntryTypeHours(logs), [logs]);
  const groupedDays = useMemo(() => groupLogsByDateDesc(logs), [logs]);

  const uniqueUsers = useMemo(() => new Set(logs.map((log) => log.userId)).size, [logs]);
  const uniqueProjects = useMemo(
    () => new Set(logs.map((log) => log.projectName).filter(Boolean)).size,
    [logs],
  );

  const selectedUserLabel = userId
    ? users.find((user) => user.id === userId)?.fullName ?? 'Selected user'
    : 'All users';
  const selectedProjectLabel = projectId
    ? projects.find((project) => project.id === projectId)?.projectName ?? 'Selected project'
    : 'All projects';

  const exportOptions = useMemo(() => ({
    logs,
    meta: {
      periodLabel: formatReportPeriod(dateRange.startDate, dateRange.endDate),
      userLabel: selectedUserLabel,
      projectLabel: selectedProjectLabel,
      totalHours: summary?.grandTotalHours ?? 0,
      entryCount: logs.length,
      contributorCount: uniqueUsers,
      projectCount: uniqueProjects,
    },
    hoursByUser: summary?.hoursByUser ?? [],
    hoursByProject: summary?.hoursByProject ?? [],
    filenameBase: `timesheet-${formatReportPeriod(dateRange.startDate, dateRange.endDate).replace(/\s+/g, '-')}`,
  }), [
    logs,
    dateRange,
    selectedUserLabel,
    selectedProjectLabel,
    summary,
    uniqueUsers,
    uniqueProjects,
  ]);

  const handleExportPdf = async () => {
    const { exportTimesheetPdf } = await import('../../utils/timesheetExport');
    exportTimesheetPdf(exportOptions);
  };

  const handleExportExcel = async () => {
    const { exportTimesheetExcel } = await import('../../utils/timesheetExport');
    exportTimesheetExcel(exportOptions);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-semibold text-primary">Timesheet Report</h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatReportPeriod(dateRange.startDate, dateRange.endDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:border-primary disabled:opacity-50"
            >
              <FiFile size={14} />
              Export PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-background rounded-lg font-medium disabled:opacity-50"
            >
              <FiFileText size={14} />
              Export Excel
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {DATE_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                preset === item.id ? 'bg-primary text-background' : 'bg-background border border-border text-gray-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value ? +e.target.value : '')}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Users</option>
              {usersSorted.map((user) => (
                <option key={user.id} value={user.id}>{user.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value ? +e.target.value : '')}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.projectName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Hours" value={formatReportHours(summary?.grandTotalHours ?? 0)} icon={<FiClock size={22} />} />
        <StatCard title="Time Entries" value={logs.length} icon={<FiFileText size={22} />} />
        <StatCard title="Contributors" value={uniqueUsers} icon={<FiUsers size={22} />} />
        <StatCard title="Projects" value={uniqueProjects} icon={<FiLayers size={22} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryChart title="Hours by User" data={summary?.hoursByUser ?? []} />
        <SummaryChart title="Hours by Project" data={summary?.hoursByProject ?? []} />
        <SummaryChart title="Daily Trend" data={dailyHours} />
        <SummaryChart title="Hours by Entry Type" data={entryTypeHours} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary">Detailed Time Entries</h3>
            <p className="text-xs text-gray-500 mt-1">Grouped by work date with project, work item, and task context</p>
          </div>
          <span className="text-sm font-medium text-gray-600">{logs.length} entries</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groupedDays.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12">No time entries found for the selected filters.</p>
        ) : (
          <div className="divide-y divide-border/70">
            {groupedDays.map((day) => (
              <div key={day.date}>
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-background/95 backdrop-blur-sm px-4 py-3 border-b border-border/60">
                  <p className="text-sm font-semibold text-gray-800">{day.label}</p>
                  <span className="text-sm font-bold text-primary tabular-nums">{formatReportHours(day.totalHours)}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-border/50">
                        <th className="p-3 font-medium">User</th>
                        <th className="p-3 font-medium">Project</th>
                        <th className="p-3 font-medium">Work Item</th>
                        <th className="p-3 font-medium">Task</th>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Time</th>
                        <th className="p-3 font-medium">Duration</th>
                        <th className="p-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.logs.map((log) => (
                        <tr key={log.id} className="border-b border-border/40 hover:bg-background/40">
                          <td className="p-3 text-gray-700">{log.userName}</td>
                          <td className="p-3 text-gray-600">{log.projectName || '—'}</td>
                          <td className="p-3">
                            <p className="font-mono text-xs text-gray-500">{log.workItemNumber}</p>
                            <p className="text-gray-700">{log.workItemTitle || '—'}</p>
                          </td>
                          <td className="p-3 font-medium text-gray-800">{log.taskTitle}</td>
                          <td className="p-3 text-gray-500">{entryTypeLabel(log.entryType)}</td>
                          <td className="p-3 font-mono text-xs text-gray-600 tabular-nums">{formatTimeRange(log)}</td>
                          <td className="p-3 font-semibold text-primary tabular-nums">{displayDuration(log)}</td>
                          <td className="p-3 text-gray-500 max-w-xs truncate">{log.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
