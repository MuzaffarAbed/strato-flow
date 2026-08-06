import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft } from 'react-icons/fi';
import { workItemsApi } from '../../services/stratoApi';
import { useWorkItemLookups } from '../../hooks/useWorkItemLookups';
import WorkItemForm from '../../components/workitems/WorkItemForm';
import { emptyWorkItemForm, toCreatePayload } from '../../utils/workItemForm';
import { getApiErrorMessage } from '../../utils/apiError';

export default function CreateWorkItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyWorkItemForm());
  const [error, setError] = useState('');
  const lookups = useWorkItemLookups();

  const createMutation = useMutation({
    mutationFn: () => workItemsApi.create(toCreatePayload(form)),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['workitems'] });
      navigate(`/work-items/${item.id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Failed to create work item. Please check required fields.')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to="/work-items" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2">
          <FiArrowLeft /> Back to Work Items
        </Link>
        <h1 className="text-2xl font-bold">Create Work Item</h1>
        <p className="text-gray-500 text-sm mt-1">Add a new work item to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}

        {lookups.isLoading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <WorkItemForm
            form={form}
            onChange={setForm}
            priorities={lookups.priorities}
            statuses={lookups.statuses}
            workItemTypes={lookups.workItemTypes}
            projects={lookups.projects}
            goals={lookups.goals}
            users={lookups.users}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={createMutation.isPending} className="px-5 py-2.5 bg-primary text-background rounded-lg font-medium text-sm disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Work Item'}
          </button>
          <Link to="/work-items" className="px-5 py-2.5 border border-border rounded-lg text-sm hover:border-primary inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
