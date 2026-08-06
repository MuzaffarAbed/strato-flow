import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { workItemsApi } from '../../services/stratoApi';
import DeleteConfirmModal from '../../components/workitems/DeleteConfirmModal';
import CommentTimeline from '../../components/comments/CommentTimeline';
import WorkItemTasks from '../../components/tasks/WorkItemTasks';
import { useState } from 'react';

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="py-3 border-b border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-1">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm sm:col-span-2">{value ?? '—'}</dd>
    </div>
  );
}

export default function WorkItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const workItemId = Number(id);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['workitems', workItemId],
    queryFn: () => workItemsApi.getById(workItemId),
    enabled: !Number.isNaN(workItemId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => workItemsApi.delete(workItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workitems'] });
      navigate('/work-items');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (error || !item) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Work item not found.</p>
        <Link to="/work-items" className="text-primary hover:underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/work-items" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2">
            <FiArrowLeft /> Back to Work Items
          </Link>
          <p className="text-primary font-medium">{item.workItemNumber}</p>
          <h1 className="text-2xl font-bold mt-1">{item.title}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(`/work-items/${item.id}/edit`)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary text-sm">
            <FiEdit2 /> Edit
          </button>
          <button type="button" onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 text-sm">
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <dl>
          <DetailRow label="Type" value={item.workItemTypeName} />
          <DetailRow label="Status" value={item.statusName} />
          <DetailRow label="Priority" value={item.priorityName} />
          <DetailRow label="Assigned To" value={item.assignedToName} />
          <DetailRow label="Project" value={item.projectName} />
          <DetailRow label="Goal" value={item.goalTitle} />
          <DetailRow label="Percent Complete" value={`${item.percentComplete}%`} />
          <DetailRow label="Estimated Hours" value={item.estimatedHours} />
          <DetailRow label="Actual Hours" value={item.actualHours} />
          <DetailRow label="Start Date" value={item.startDate} />
          <DetailRow label="Due Date" value={item.dueDate} />
          <DetailRow label="Completed Date" value={item.completedDate} />
          <DetailRow label="Created" value={new Date(item.createdAt).toLocaleString()} />
        </dl>
      </div>

      {item.description && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-primary mb-2">Description</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.description}</p>
        </div>
      )}

      {item.businessReason && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-primary mb-2">Business Reason</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.businessReason}</p>
        </div>
      )}

      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 text-xs bg-primary/15 text-primary rounded-full">{tag}</span>
          ))}
        </div>
      )}

      <WorkItemTasks workItemId={item.id} workItemNumber={item.workItemNumber} />

      <CommentTimeline entityType="WorkItem" entityId={item.id} />

      <DeleteConfirmModal
        open={showDelete}
        title="Delete Work Item"
        message={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
