import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft } from 'react-icons/fi';
import { tasksApi } from '../../services/stratoApi';
import { useTaskLookups } from '../../hooks/useTaskLookups';
import TaskForm from '../../components/tasks/TaskForm';
import { emptyTaskForm, toCreatePayload } from '../../utils/taskForm';
import { getApiErrorMessage } from '../../utils/apiError';

export default function CreateTask() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyTaskForm());
  const [error, setError] = useState('');
  const lookups = useTaskLookups();

  const workItemIdParam = Number(searchParams.get('workItemId'));
  const backLink = !Number.isNaN(workItemIdParam) && workItemIdParam > 0
    ? `/work-items/${workItemIdParam}`
    : '/tasks';

  useEffect(() => {
    if (!Number.isNaN(workItemIdParam) && workItemIdParam > 0) {
      setForm((prev) => ({ ...prev, workItemId: workItemIdParam }));
    }
  }, [workItemIdParam]);

  const createMutation = useMutation({
    mutationFn: () => tasksApi.create(toCreatePayload(form)),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate(`/tasks/${task.id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Failed to create task. Please check required fields.')),
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
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to={backLink} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2">
          <FiArrowLeft /> Back
        </Link>
        <h1 className="text-2xl font-bold">Create Task</h1>
        <p className="text-gray-500 text-sm mt-1">Add a new task to a work item</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}

        {lookups.isLoading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <TaskForm
            form={form}
            onChange={setForm}
            priorities={lookups.priorities}
            statuses={lookups.statuses}
            users={lookups.users}
            workItems={lookups.workItems}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={createMutation.isPending} className="px-5 py-2.5 bg-primary text-background rounded-lg font-medium text-sm disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Task'}
          </button>
          <Link to={backLink} className="px-5 py-2.5 border border-border rounded-lg text-sm hover:border-primary inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
