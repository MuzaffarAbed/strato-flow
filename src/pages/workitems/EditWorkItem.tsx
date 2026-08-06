import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft } from 'react-icons/fi';
import { workItemsApi } from '../../services/stratoApi';
import { useWorkItemLookups } from '../../hooks/useWorkItemLookups';
import WorkItemForm from '../../components/workitems/WorkItemForm';
import { emptyWorkItemForm, toUpdatePayload } from '../../utils/workItemForm';
import { getApiErrorMessage } from '../../utils/apiError';

export default function EditWorkItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workItemId = Number(id);
  const [form, setForm] = useState(emptyWorkItemForm());
  const [error, setError] = useState('');
  const lookups = useWorkItemLookups();

  const { data: item, isLoading } = useQuery({
    queryKey: ['workitems', workItemId],
    queryFn: () => workItemsApi.getById(workItemId),
    enabled: !Number.isNaN(workItemId),
  });

  useEffect(() => {
    if (!item) return;
    setForm({
      title: item.title,
      description: item.description ?? '',
      businessReason: item.businessReason ?? '',
      priorityId: item.priorityId,
      statusId: item.statusId,
      workItemTypeId: item.workItemTypeId,
      assignedToId: item.assignedToId,
      estimatedHours: item.estimatedHours,
      actualHours: item.actualHours,
      percentComplete: item.percentComplete,
      startDate: item.startDate?.slice(0, 10) ?? '',
      dueDate: item.dueDate?.slice(0, 10) ?? '',
      goalId: item.goalId,
      projectId: item.projectId,
    });
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: () => workItemsApi.update(workItemId, toUpdatePayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workitems'] });
      queryClient.invalidateQueries({ queryKey: ['workitems', workItemId] });
      navigate(`/work-items/${workItemId}`);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Failed to update work item.')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Work item not found.</p>
        <Link to="/work-items" className="text-primary hover:underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to={`/work-items/${workItemId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2">
          <FiArrowLeft /> Back to Details
        </Link>
        <p className="text-primary text-sm">{item.workItemNumber}</p>
        <h1 className="text-2xl font-bold">Edit Work Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}

        {lookups.isLoading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <WorkItemForm
            form={form}
            onChange={setForm}
            isEdit
            priorities={lookups.priorities}
            statuses={lookups.statuses}
            workItemTypes={lookups.workItemTypes}
            projects={lookups.projects}
            goals={lookups.goals}
            users={lookups.users}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={updateMutation.isPending} className="px-5 py-2.5 bg-primary text-background rounded-lg font-medium text-sm disabled:opacity-50">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <Link to={`/work-items/${workItemId}`} className="px-5 py-2.5 border border-border rounded-lg text-sm hover:border-primary inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
