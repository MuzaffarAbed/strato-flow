import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiDownload, FiX } from 'react-icons/fi';
import DataTable, { type DataTableColumn } from '../../components/common/DataTable';
import MultiSelectFilter from '../../components/common/MultiSelectFilter';
import TableRowActions from '../../components/common/TableRowActions';
import { workItemsApi } from '../../services/stratoApi';
import { useWorkItemLookups } from '../../hooks/useWorkItemLookups';
import DeleteConfirmModal from '../../components/workitems/DeleteConfirmModal';
import { getApiErrorMessage } from '../../utils/apiError';
import type { WorkItem } from '../../types';

const SORT_FIELD_MAP: Record<string, string> = {
  workItemNumber: 'workItemNumber',
  title: 'title',
  workItemTypeName: 'workItemType',
  statusName: 'status',
  priorityName: 'priority',
  assignedToName: 'assignedTo',
  dueDate: 'dueDate',
  percentComplete: 'percentComplete',
  createdAt: 'createdAt',
};

const API_SORT_TO_COLUMN: Record<string, string> = Object.fromEntries(
  Object.entries(SORT_FIELD_MAP).map(([column, apiField]) => [apiField, column]),
);

const formatDate = (value?: string | null) => (value ? value.slice(0, 10) : '—');

export default function WorkItemsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const projectIdFromUrl = Number(searchParams.get('projectId'));
  const initialProjectId = !Number.isNaN(projectIdFromUrl) && projectIdFromUrl > 0 ? projectIdFromUrl : '';

  const [search, setSearch] = useState('');
  const [statusIds, setStatusIds] = useState<number[]>([]);
  const [priorityId, setPriorityId] = useState<number | ''>('');
  const [assignedToId, setAssignedToId] = useState<number | ''>('');
  const [typeId, setTypeId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>(initialProjectId);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDescending, setSortDescending] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<WorkItem | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { statuses, priorities, workItemTypes, projects, users } = useWorkItemLookups();

  const assigneesSorted = useMemo(
    () => [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' })),
    [users],
  );

  useEffect(() => {
    const nextProjectId = Number(searchParams.get('projectId'));
    setProjectId(!Number.isNaN(nextProjectId) && nextProjectId > 0 ? nextProjectId : '');
  }, [searchParams]);

  const filterParams = useMemo(() => ({
    search: search.trim() || undefined,
    statusIds: statusIds.length > 0 ? statusIds : undefined,
    priorityId: priorityId || undefined,
    assignedToId: assignedToId || undefined,
    workItemTypeId: typeId || undefined,
    projectId: projectId || undefined,
  }), [search, statusIds, priorityId, assignedToId, typeId, projectId]);

  useEffect(() => {
    setPage(1);
  }, [filterParams]);

  const selectedProject = projects.find((project) => project.id === projectId);

  const updateProjectFilter = (nextProjectId: number | '') => {
    setProjectId(nextProjectId);
    const nextParams = new URLSearchParams(searchParams);
    if (nextProjectId) nextParams.set('projectId', String(nextProjectId));
    else nextParams.delete('projectId');
    setSearchParams(nextParams, { replace: true });
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['workitems', page, pageSize, sortBy, sortDescending, filterParams],
    queryFn: () => workItemsApi.getAll({
      page,
      pageSize,
      sortBy,
      sortDescending,
      ...filterParams,
    }),
  });

  const listError = error ? getApiErrorMessage(error, 'Failed to load work items.') : '';

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workItemsApi.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      setDeleteError('');
      queryClient.invalidateQueries({ queryKey: ['workitems'] });
    },
    onError: (err) => setDeleteError(getApiErrorMessage(err, 'Failed to delete work item.')),
  });

  const handleSortChange = (columnKey: string) => {
    const apiField = SORT_FIELD_MAP[columnKey] ?? columnKey;
    if (sortBy === apiField) {
      setSortDescending((current) => !current);
    } else {
      setSortBy(apiField);
      setSortDescending(false);
    }
    setPage(1);
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const params = new URLSearchParams({ format: 'csv' });
    if (search) params.set('search', search);
    if (statusIds.length) statusIds.forEach((id) => params.append('statusIds', String(id)));
    if (priorityId) params.set('priorityId', String(priorityId));
    if (assignedToId) params.set('assignedToId', String(assignedToId));
    if (projectId) params.set('projectId', String(projectId));
    if (typeId) params.set('workItemTypeId', String(typeId));
    fetch(`${base}/workitems/export?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workitems.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const sortColumn = API_SORT_TO_COLUMN[sortBy] ?? sortBy;

  const columns: DataTableColumn<WorkItem>[] = [
    { key: 'workItemNumber', header: 'Number', width: '120px', sortable: true },
    { key: 'title', header: 'Title', sortable: true },
    {
      key: 'projectName',
      header: 'Project',
      width: '180px',
      render: (row) => (
        <span className="text-sm" title={row.projectName || 'No project'}>
          {row.projectName?.trim() || '—'}
        </span>
      ),
    },
    { key: 'workItemTypeName', header: 'Type', width: '120px' },
    { key: 'statusName', header: 'Status', width: '140px', sortable: true },
    { key: 'priorityName', header: 'Priority', width: '100px', sortable: true },
    { key: 'assignedToName', header: 'Assigned To', width: '150px', sortable: true, render: (row) => row.assignedToName ?? '—' },
    { key: 'dueDate', header: 'Due Date', width: '110px', sortable: true, render: (row) => formatDate(row.dueDate) },
    { key: 'percentComplete', header: '%', width: '70px', sortable: true, render: (row) => `${row.percentComplete ?? 0}` },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (row) => (
        <TableRowActions
          onView={() => navigate(`/work-items/${row.id}`)}
          onEdit={() => navigate(`/work-items/${row.id}/edit`)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Work Items</h1>
          <p className="text-gray-500 text-sm">
            {selectedProject
              ? `Showing work items for ${selectedProject.name}`
              : 'Manage features, bugs, support requests, and more'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary text-sm">
            <FiDownload /> Export
          </button>
          <button type="button" onClick={() => navigate('/work-items/new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm">
            <FiPlus /> New Work Item
          </button>
        </div>
      </div>

      {selectedProject && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
          <p className="text-sm">
            Filtered by project: <span className="font-semibold text-primary">{selectedProject.name}</span>
          </p>
          <button
            type="button"
            onClick={() => updateProjectFilter('')}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <FiX size={14} /> Clear project filter
          </button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <input
          type="search"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <select
          value={projectId}
          onChange={(e) => updateProjectFilter(e.target.value ? +e.target.value : '')}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <MultiSelectFilter
          label="Statuses"
          allLabel="All Statuses"
          options={statuses.map((s) => ({ id: s.id, name: s.name }))}
          value={statusIds}
          onChange={setStatusIds}
        />
        <select value={priorityId} onChange={(e) => setPriorityId(e.target.value ? +e.target.value : '')} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">All Priorities</option>
          {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value ? +e.target.value : '')} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">All Assignees</option>
          {assigneesSorted.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <select value={typeId} onChange={(e) => setTypeId(e.target.value ? +e.target.value : '')} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          {workItemTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {listError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{listError}</div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isLoading || isFetching}
          emptyMessage={selectedProject ? `No work items found for ${selectedProject.name}` : 'No work items found'}
          onRowClick={(row) => navigate(`/work-items/${row.id}`)}
          sortBy={sortColumn}
          sortDescending={sortDescending}
          onSortChange={handleSortChange}
          page={page}
          pageSize={pageSize}
          totalCount={data?.totalCount ?? 0}
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
        title="Delete Work Item"
        message={`Are you sure you want to delete "${deleteTarget?.title}" (${deleteTarget?.workItemNumber})? This action cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
      />

      {deleteError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{deleteError}</div>
      )}
    </div>
  );
}
