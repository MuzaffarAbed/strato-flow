import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { tasksApi } from '../../services/stratoApi';
import DeleteConfirmModal from '../workitems/DeleteConfirmModal';
import { useState } from 'react';
import type { Task } from '../../types';

interface WorkItemTasksProps {
  workItemId: number;
  workItemNumber: string;
}

export default function WorkItemTasks({ workItemId, workItemNumber }: WorkItemTasksProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { workItemId }],
    queryFn: () => tasksApi.getAll({ workItemId, pageSize: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTarget(null);
    },
  });

  const tasks = data?.items ?? [];

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-primary">Tasks</h2>
          <p className="text-xs text-gray-500 mt-0.5">{tasks.length} task(s) under {workItemNumber}</p>
        </div>
        <Link
          to={`/tasks/new?workItemId=${workItemId}`}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-background rounded-lg text-sm font-medium"
        >
          <FiPlus size={14} /> Add Task
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No tasks yet for this work item.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-gray-500">
                <th className="pb-3 pr-4">Task</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Priority</th>
                <th className="pb-3 pr-4">Assigned To</th>
                <th className="pb-3 pr-4">Est.</th>
                <th className="pb-3 pr-4">Actual</th>
                <th className="pb-3 pr-4">%</th>
                <th className="pb-3 pr-4">Due</th>
                <th className="pb-3 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-border/50 hover:bg-background/30">
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="text-left hover:text-primary font-medium"
                    >
                      {task.taskTitle}
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{task.statusName}</td>
                  <td className="py-3 pr-4 text-gray-400">{task.priorityName}</td>
                  <td className="py-3 pr-4 text-gray-400">{task.assignedToName ?? '—'}</td>
                  <td className="py-3 pr-4">{task.estimatedHours ?? '—'}</td>
                  <td className="py-3 pr-4">{task.actualHours ?? '—'}</td>
                  <td className="py-3 pr-4">{task.percentComplete}%</td>
                  <td className="py-3 pr-4 text-gray-400">{task.dueDate?.slice(0, 10) ?? '—'}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => navigate(`/tasks/${task.id}`)} className="p-1.5 text-gray-500 hover:text-primary rounded" title="View">
                        <FiExternalLink size={14} />
                      </button>
                      <button type="button" onClick={() => navigate(`/tasks/${task.id}/edit`)} className="p-1.5 text-gray-500 hover:text-primary rounded" title="Edit">
                        <FiEdit2 size={14} />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(task)} className="p-1.5 text-gray-500 hover:text-red-400 rounded" title="Delete">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Task"
        message={`Delete "${deleteTarget?.taskTitle}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
