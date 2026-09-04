import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft } from 'react-icons/fi';
import { tasksApi } from '../../services/stratoApi';
import { useTaskLookups } from '../../hooks/useTaskLookups';
import TaskForm from '../../components/tasks/TaskForm';
import { emptyTaskForm, toUpdatePayload } from '../../utils/taskForm';
import { getApiErrorMessage } from '../../utils/apiError';

export default function EditTask() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const taskId = Number(id);
  const [form, setForm] = useState(emptyTaskForm());
  const [error, setError] = useState('');
  const lookups = useTaskLookups();

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getById(taskId),
    enabled: !Number.isNaN(taskId),
  });

  useEffect(() => {
    if (!task) return;
    setForm({
      workItemId: task.workItemId,
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription ?? '',
      assignedToId: task.assignedToId,
      assignedUserIds: task.assignedUserIds ?? [],
      statusId: task.statusId,
      priorityId: task.priorityId,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      percentComplete: task.percentComplete,
      startDate: task.startDate?.slice(0, 10) ?? '',
      dueDate: task.dueDate?.slice(0, 10) ?? '',
    });
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: () => tasksApi.update(taskId, toUpdatePayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      navigate(`/tasks/${taskId}`);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Failed to update task.')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.taskTitle.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!form.workItemId) {
      setError('Work item is required.');
      return;
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Task not found.</p>
        <Link to="/tasks" className="text-primary hover:underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to={`/tasks/${taskId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2">
          <FiArrowLeft /> Back to Details
        </Link>
        <Link to={`/work-items/${task.workItemId}`} className="block mb-1 group">
          <p className="text-primary text-sm font-semibold group-hover:underline">
            {task.workItemNumber} — {task.workItemTitle}
          </p>
          <p className="text-xs text-gray-500">
            {[task.workItemTypeName, task.projectName].filter(Boolean).join(' · ') || 'No project'}
          </p>
        </Link>
        <h1 className="text-2xl font-bold">Edit Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}

        {lookups.isLoading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <TaskForm
            form={form}
            onChange={setForm}
            isEdit
            priorities={lookups.priorities}
            statuses={lookups.statuses}
            users={lookups.users}
            workItems={lookups.workItems}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={updateMutation.isPending} className="px-5 py-2.5 bg-primary text-background rounded-lg font-medium text-sm disabled:opacity-50">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <Link to={`/tasks/${taskId}`} className="px-5 py-2.5 border border-border rounded-lg text-sm hover:border-primary inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
