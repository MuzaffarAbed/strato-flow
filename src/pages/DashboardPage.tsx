import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { FiAlertCircle, FiCheckCircle, FiClock, FiFolder, FiAlertTriangle } from 'react-icons/fi';
import { dashboardApi } from '../services/stratoApi';
import StatCard from '../components/StatCard';

const CHART_COLORS = ['#D0021B', '#2563EB', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B', '#A855F7'];

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load dashboard data.</p>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Live overview of work management metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard className="dashboard-card dashboard-card-delay-1" title="Open Work Items" value={stats?.openWorkItems ?? 0} icon={<FiCheckCircle className="w-6 h-6" />} />
        <StatCard className="dashboard-card dashboard-card-delay-2" title="Completed This Month" value={stats?.completedThisMonth ?? 0} color="text-green-400" icon={<FiCheckCircle className="w-6 h-6" />} />
        <StatCard className="dashboard-card dashboard-card-delay-3" title="Blocked Tasks" value={stats?.blockedTasks ?? 0} color="text-red-400" icon={<FiAlertCircle className="w-6 h-6" />} />
        <StatCard className="dashboard-card dashboard-card-delay-4" title="Total Hours Logged" value={Number(stats?.totalHoursLogged ?? 0).toLocaleString()} icon={<FiClock className="w-6 h-6" />} />
        <StatCard className="dashboard-card dashboard-card-delay-5" title="Overdue Items" value={stats?.overdueItems ?? 0} color="text-orange-400" icon={<FiAlertTriangle className="w-6 h-6" />} />
        <StatCard className="dashboard-card dashboard-card-delay-6" title="Active Projects" value={stats?.activeProjects ?? 0} icon={<FiFolder className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Work Items by Status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data?.workItemsByStatus ?? []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                {(data?.workItemsByStatus ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
          {(data?.workItemsByStatus ?? []).length === 0 && <p className="text-gray-500 text-sm text-center">No data</p>}
        </ChartCard>

        <ChartCard title="Work Items by Priority">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.workItemsByPriority ?? []}>
              <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {(data?.workItemsByPriority ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hours Logged per User">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.hoursLoggedPerUser ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis dataKey="label" type="category" width={100} tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {(data?.hoursLoggedPerUser ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {(data?.hoursLoggedPerUser ?? []).length === 0 && <p className="text-gray-500 text-sm text-center">No time logs yet</p>}
        </ChartCard>

        <ChartCard title="Monthly Completion Trend">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.monthlyCompletionTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Recent Activity" className="lg:col-span-1">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(data?.recentActivity ?? []).map((a, i) => (
              <div key={i} className="flex gap-3 text-sm border-b border-border/50 pb-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-gray-700">{a.action} <span className="text-primary">{a.entityName}</span></p>
                  <p className="text-xs text-gray-500">{a.userName} · {new Date(a.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(data?.recentActivity ?? []).length === 0 && <p className="text-gray-500 text-sm">No recent activity</p>}
          </div>
        </ChartCard>

        <ChartCard title="Recent Comments">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(data?.recentComments ?? []).map((c) => (
              <div key={c.id} className="text-sm border-b border-border/50 pb-2">
                <p className="text-primary text-xs">{c.entityName}</p>
                <p className="text-gray-700 mt-1">{c.comment}</p>
                <p className="text-xs text-gray-500 mt-1">{c.userName}</p>
              </div>
            ))}
            {(data?.recentComments ?? []).length === 0 && <p className="text-gray-500 text-sm">No recent comments</p>}
          </div>
        </ChartCard>

        <ChartCard title="Recent Work Items">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(data?.recentWorkItems ?? []).map((w) => (
              <div key={w.id} className="flex justify-between items-start text-sm border-b border-border/50 pb-2">
                <div>
                  <p className="text-primary font-medium">{w.workItemNumber}</p>
                  <p className="text-gray-700">{w.title}</p>
                </div>
                <span className="text-xs bg-border px-2 py-1 rounded">{w.statusName}</span>
              </div>
            ))}
            {(data?.recentWorkItems ?? []).length === 0 && <p className="text-gray-500 text-sm">No work items</p>}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`dashboard-card bg-card border border-border rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
}
