import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { projectsApi } from '../services/stratoApi';
import DeleteConfirmModal from '../components/workitems/DeleteConfirmModal';
import FormAlert from '../components/common/FormAlert';
import FormField from '../components/common/FormField';
import {
  createFormValidation,
  emptyValidation,
  getApiErrorMessages,
  getApiFormValidation,
  inputFieldClass,
  withClearedField,
  type FormValidationState,
} from '../utils/apiError';
import type { CreateProjectDto, Project } from '../types';

const statusOptions = ['Active', 'On Hold', 'Completed', 'Cancelled'] as const;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [validation, setValidation] = useState<FormValidationState>(emptyValidation);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState<CreateProjectDto>({
    projectName: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Active',
  });

  const fieldErrors = validation.fields;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const openProjectWorkItems = (project: Project) => {
    navigate(`/work-items?projectId=${project.id}`);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setValidation(emptyValidation);
  };

  const updateField = <K extends keyof CreateProjectDto>(key: K, value: CreateProjectDto[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidation((prev) => withClearedField(prev, String(key)));
  };

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create({
      ...form,
      description: form.description?.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }),
    onSuccess: () => {
      closeModal();
      setSuccessMessage('Project created successfully.');
      refresh();
    },
    onError: (err) => setValidation(getApiFormValidation(err, 'Could not create project. Please check the form and try again.')),
  });

  const updateMutation = useMutation({
    mutationFn: () => projectsApi.update(editTarget!.id, {
      ...form,
      description: form.description?.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }),
    onSuccess: () => {
      closeModal();
      setSuccessMessage('Project updated successfully.');
      refresh();
    },
    onError: (err) => setValidation(getApiFormValidation(err, 'Could not update project. Please check the form and try again.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      setPageError('');
      setSuccessMessage('Project deleted successfully.');
      refresh();
    },
    onError: (err) => setPageError(getApiErrorMessages(err, 'Could not delete project.')[0]),
  });

  const openCreate = () => {
    setSuccessMessage('');
    setPageError('');
    setForm({
      projectName: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'Active',
    });
    setValidation(emptyValidation);
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setSuccessMessage('');
    setPageError('');
    setForm({
      projectName: project.projectName,
      description: project.description ?? '',
      startDate: project.startDate?.slice(0, 10) ?? '',
      endDate: project.endDate?.slice(0, 10) ?? '',
      status: project.status || 'Active',
    });
    setValidation(emptyValidation);
    setEditTarget(project);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const items: Array<{ field?: string; message: string }> = [];

    if (!form.projectName.trim()) {
      items.push({ field: 'projectName', message: 'Project name is required.' });
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      items.push({ field: 'endDate', message: 'End date cannot be before start date.' });
    }

    if (items.length) {
      setValidation(createFormValidation(items));
      return;
    }

    setValidation(emptyValidation);
    if (editTarget) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500 text-sm">Track project progress and work items</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm"
        >
          <FiPlus /> New Project
        </button>
      </div>

      {successMessage && (
        <FormAlert variant="success" title="Success" message={successMessage} />
      )}

      {pageError && !deleteTarget && (
        <FormAlert variant="error" title="Action failed" message={pageError} />
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => openProjectWorkItems(p)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openProjectWorkItems(p);
                }
              }}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer text-left"
              aria-label={`View work items for ${p.projectName}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{p.projectName}</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{p.status}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{p.description || 'No description'}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Work Items</span>
                  <span>{p.workItemCount}</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${p.progressPercent}%` }} />
                </div>
                <p className="text-xs text-gray-500 text-right">{Math.round(p.progressPercent)}% complete</p>
              </div>
              <p className="text-xs text-primary mt-3">Click to view work items</p>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/70">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEdit(p);
                  }}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-border rounded hover:border-primary text-gray-700"
                >
                  <FiEdit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPageError('');
                    setDeleteTarget(p);
                  }}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-400/40 rounded hover:bg-red-500/10 text-red-500"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-gray-500 col-span-full text-center py-12">No projects yet</p>}
        </div>
      )}

      {(modalOpen || !!editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-semibold text-primary mb-4">{editTarget ? 'Edit Project' : 'Create Project'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {validation.messages.length > 0 && (
                <FormAlert variant="error" title="Please fix the following" messages={validation.messages} />
              )}

              <FormField label="Project Name" required error={fieldErrors.projectName}>
                <input
                  className={inputFieldClass(!!fieldErrors.projectName)}
                  value={form.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                />
              </FormField>

              <FormField label="Description" error={fieldErrors.description}>
                <textarea
                  className={inputFieldClass(!!fieldErrors.description, 'h-24')}
                  value={form.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Start Date" error={fieldErrors.startDate}>
                  <input
                    type="date"
                    className={inputFieldClass(!!fieldErrors.startDate)}
                    value={form.startDate ?? ''}
                    onChange={(e) => updateField('startDate', e.target.value)}
                  />
                </FormField>
                <FormField label="End Date" error={fieldErrors.endDate}>
                  <input
                    type="date"
                    className={inputFieldClass(!!fieldErrors.endDate)}
                    value={form.endDate ?? ''}
                    onChange={(e) => updateField('endDate', e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Status" required error={fieldErrors.status}>
                <select
                  className={inputFieldClass(!!fieldErrors.status)}
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </FormField>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary text-background rounded-lg font-medium disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Project"
        message={`Delete "${deleteTarget?.projectName}"? Projects with linked work items cannot be deleted.`}
        error={pageError && !!deleteTarget ? pageError : undefined}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => { setDeleteTarget(null); setPageError(''); }}
      />
    </div>
  );
}
