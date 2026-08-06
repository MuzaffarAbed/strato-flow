import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/stratoApi';
import StatCard from '../components/StatCard';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';

export default function MyWorkPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-work'],
    queryFn: () => reportsApi.getMyWork(),
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Work</h1>
        <p className="text-gray-500 text-sm">Your assigned work items, tasks, and activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Assigned Work Items" value={data?.assignedWorkItems?.length ?? 0} />
        <StatCard title="Assigned Tasks" value={data?.assignedTasks?.length ?? 0} />
        <StatCard title="Hours This Week" value={data?.totalHoursThisWeek ?? 0} icon={<FiClock className="w-6 h-6" />} />
      </div>

      {((data?.overdueWork?.length ?? 0) > 0) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-red-400 font-semibold mb-3"><FiAlertTriangle /> Overdue Work ({data?.overdueWork?.length})</h3>
          <div className="space-y-2">
            {data?.overdueWork?.map((w) => (
              <div key={w.id} className="flex justify-between text-sm">
                <span className="text-primary">{w.workItemNumber}</span>
                <span>{w.title}</span>
                <span className="text-red-400">{w.dueDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkList title="Assigned Work Items" items={data?.assignedWorkItems ?? []} />
        <TaskList title="Assigned Tasks" items={data?.assignedTasks ?? []} />
      </div>
    </div>
  );
}

function WorkList({ title, items }: { title: string; items: { id: number; workItemNumber: string; title: string; statusName: string; dueDate?: string }[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-primary mb-4">{title}</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.map((w) => (
          <div key={w.id} className="flex justify-between items-center p-3 bg-background rounded-lg text-sm">
            <div>
              <p className="text-primary font-medium">{w.workItemNumber}</p>
              <p className="text-gray-300">{w.title}</p>
            </div>
            <span className="text-xs bg-border px-2 py-1 rounded">{w.statusName}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No items assigned</p>}
      </div>
    </div>
  );
}

function TaskList({ title, items }: { title: string; items: { id: number; taskTitle: string; workItemNumber: string; statusName: string; percentComplete: number }[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-primary mb-4">{title}</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.map((t) => (
          <div key={t.id} className="flex justify-between items-center p-3 bg-background rounded-lg text-sm">
            <div>
              <p className="text-xs text-gray-500">{t.workItemNumber}</p>
              <p className="text-gray-300">{t.taskTitle}</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-border px-2 py-1 rounded">{t.statusName}</span>
              <p className="text-xs text-gray-500 mt-1">{t.percentComplete}%</p>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No tasks assigned</p>}
      </div>
    </div>
  );
}
