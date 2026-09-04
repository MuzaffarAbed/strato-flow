import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus } from 'react-icons/fi';
import DataTable, { type DataTableColumn } from '../../components/common/DataTable';
import MultiSelectFilter from '../../components/common/MultiSelectFilter';
import TableRowActions from '../../components/common/TableRowActions';
import { tasksApi } from '../../services/stratoApi';
import { useTaskLookups } from '../../hooks/useTaskLookups';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmModal from '../../components/workitems/DeleteConfirmModal';
import { getApiErrorMessage } from '../../utils/apiError';
import type { Task } from '../../types';

const formatDate = (value?: string | null) => (value ? value.slice(0, 10) : '—');

export default function TasksList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.roleName?.toLowerCase() === 'admin';
  const [search, setSearch] = useState('');
  const [statusIds, setStatusIds] = useState<number[]>([]);
  const [priorityIds, setPriorityIds] = useState<number[]>([]);
  const [assignedToId, setAssignedToId] = useState<number | ''>('');
  const [workItemId, setWorkItemId] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { statuses, priorities, workItems, users } = useTaskLookups();

  const assigneesSorted = useMemo(
    () => [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' })),
    [users],
  );

  const filterParams = useMemo(() => ({
    page: 1,
    pageSize: 100,
    search: search || undefined,
    statusIds: statusIds.length > 0 ? statusIds : undefined,
    priorityIds: priorityIds.length > 0 ? priorityIds : undefined,
    assignedToId: assignedToId || undefined,
    workItemId: workItemId || undefined,
  }), [search, statusIds, priorityIds, assignedToId, workItemId]);

  useEffect(() => {
    setPage(1);
  }, [filterParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['tasks', filterParams],
    queryFn: () => tasksApi.getAll(filterParams),
  });

  const allItems = data?.items ?? [];
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allItems.slice(start, start + pageSize);
  }, [allItems, page, pageSize]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTarget(null);
      setDeleteError('');
    },
    onError: (err) => setDeleteError(getApiErrorMessage(err, 'Failed to delete task.')),
  });

  const columns: DataTableColumn<Task>[] = [
    {
      key: 'workItemNumber',
      header: 'Work Item',
      width: '260px',
      minWidth: 160,
      wrap: true,
      render: (row) => (
        <div className="min-w-0 py-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-primary whitespace-nowrap">{row.workItemNumber}</span>
            {row.workItemTypeName && (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-border/60 text-gray-600">
                {row.workItemTypeName}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-800 mt-0.5 break-words" title={row.workItemTitle}>
            {row.workItemTitle || 'Untitled work item'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 break-words" title={row.projectName || 'No project'}>
            {row.projectName?.trim() || 'No project'}
          </p>
        </div>
      ),
    },
    {
      key: 'taskTitle',
      header: 'Task',
      width: '240px',
      minWidth: 140,
      wrap: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900 break-words" title={row.taskTitle}>{row.taskTitle}</p>
          {row.assignedUserNames?.length > 1 && (
            <p className="text-xs text-gray-500 mt-0.5 break-words" title={row.assignedUserNames.join(', ')}>
              Team: {row.assignedUserNames.join(', ')}
            </p>
          )}
        </div>
      ),
    },
    { key: 'statusName', header: 'Status', width: '120px', minWidth: 90, wrap: true },
    { key: 'priorityName', header: 'Priority', width: '100px', minWidth: 80, wrap: true },
    {
      key: 'assignedToName',
      header: 'Assigned To',
      width: '150px',
      minWidth: 100,
      wrap: true,
      render: (row) => row.assignedToName ?? '—',
    },
    { key: 'estimatedHours', header: 'Est. Hrs', width: '90px', minWidth: 70, render: (row) => row.estimatedHours ?? '—' },
    { key: 'actualHours', header: 'Act. Hrs', width: '90px', minWidth: 70, render: (row) => row.actualHours ?? '—' },
    { key: 'dueDate', header: 'Due Date', width: '110px', minWidth: 90, render: (row) => formatDate(row.dueDate) },
    { key: 'percentComplete', header: '%', width: '70px', minWidth: 56, render: (row) => `${row.percentComplete ?? 0}` },
    {
      key: 'hasActiveBlocker',
      header: 'Blocked',
      width: '80px',
      minWidth: 70,
      render: (row) => (row.hasActiveBlocker ? 'Yes' : 'No'),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      minWidth: 120,
      render: (row) => (
        <TableRowActions
          onView={() => navigate(`/tasks/${row.id}`)}
          onEdit={() => navigate(`/tasks/${row.id}/edit`)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-gray-500 text-sm">
            {isAdmin ? 'Manage tasks within work items' : 'Tasks assigned to you'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tasks/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm"
        >
          <FiPlus /> New Task
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          type="search"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <select value={workItemId} onChange={(e) => setWorkItemId(e.target.value ? +e.target.value : '')} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">All Work Items</option>
          {workItems.map((w) => (
            <option key={w.id} value={w.id}>
              {w.workItemNumber} — {w.title}{w.projectName ? ` · ${w.projectName}` : ''}
            </option>
          ))}
        </select>
        <MultiSelectFilter
          label="Statuses"
          allLabel="All Statuses"
          options={statuses.map((s) => ({ id: s.id, name: s.name }))}
          value={statusIds}
          onChange={setStatusIds}
        />
        <MultiSelectFilter
          label="Priorities"
          allLabel="All Priorities"
          options={priorities.map((p) => ({ id: p.id, name: p.name }))}
          value={priorityIds}
          onChange={setPriorityIds}
        />
        {isAdmin && (
          <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value ? +e.target.value : '')} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
            <option value="">All Assignees</option>
            {assigneesSorted.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        )}
      </div>

      {deleteError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{deleteError}</div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={pagedItems}
          rowKey={(row) => row.id}
          loading={isLoading || isFetching}
          emptyMessage="No tasks found"
          onRowClick={(row) => navigate(`/tasks/${row.id}`)}
          resizableColumns
          page={page}
          pageSize={pageSize}
          totalCount={allItems.length}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.taskTitle}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
      />
    </div>
  );
}
