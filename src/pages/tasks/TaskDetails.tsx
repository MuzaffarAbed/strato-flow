import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { tasksApi } from '../../services/stratoApi';
import DeleteConfirmModal from '../../components/workitems/DeleteConfirmModal';
import CommentTimeline from '../../components/comments/CommentTimeline';
import { useState } from 'react';

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="py-3 border-b border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-1">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm sm:col-span-2">{value ?? '—'}</dd>
    </div>
  );
}

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const taskId = Number(id);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getById(taskId),
    enabled: !Number.isNaN(taskId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate(task?.workItemId ? `/work-items/${task.workItemId}` : '/tasks');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Task not found.</p>
        <Link to="/tasks" className="text-primary hover:underline">Back to tasks</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2">
            <FiArrowLeft /> Back to Tasks
          </Link>
          <Link to={`/work-items/${task.workItemId}`} className="block group">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-primary text-sm font-semibold group-hover:underline">{task.workItemNumber}</span>
              {task.workItemTypeName && (
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-border/60 text-gray-600">
                  {task.workItemTypeName}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-0.5 group-hover:text-primary">{task.workItemTitle}</p>
            <p className="text-xs text-gray-500 mt-0.5">{task.projectName?.trim() || 'No project'}</p>
          </Link>
          <h1 className="text-2xl font-bold mt-2">{task.taskTitle}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(`/tasks/${task.id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary text-sm">
            <FiEdit2 /> Edit
          </button>
          <button type="button" onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 text-sm">
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <dl>
          <DetailRow label="Work Item" value={`${task.workItemNumber} — ${task.workItemTitle}`} />
          <DetailRow label="Work Item Type" value={task.workItemTypeName} />
          <DetailRow label="Project" value={task.projectName} />
          <DetailRow label="Status" value={task.statusName} />
          <DetailRow label="Priority" value={task.priorityName} />
          <DetailRow label="Assigned To" value={task.assignedToName} />
          <DetailRow label="Additional Assignees" value={task.assignedUserNames?.filter((n) => n !== task.assignedToName).join(', ') || undefined} />
          <DetailRow label="Percent Complete" value={`${task.percentComplete}%`} />
          <DetailRow label="Estimated Hours" value={task.estimatedHours} />
          <DetailRow label="Actual Hours" value={task.actualHours} />
          <DetailRow label="Start Date" value={task.startDate?.slice(0, 10)} />
          <DetailRow label="Due Date" value={task.dueDate?.slice(0, 10)} />
          <DetailRow label="Completed Date" value={task.completedDate?.slice(0, 10)} />
          <DetailRow label="Blocked" value={task.hasActiveBlocker ? 'Yes' : 'No'} />
        </dl>
      </div>

      {task.taskDescription && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-primary mb-2">Description</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.taskDescription}</p>
        </div>
      )}

      <CommentTimeline entityType="Task" entityId={task.id} />

      <DeleteConfirmModal
        open={showDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.taskTitle}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
