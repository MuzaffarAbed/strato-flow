import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { rolesApi } from '../services/stratoApi';
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
import type { CreateRoleDto, Role } from '../types';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [validation, setValidation] = useState<FormValidationState>(emptyValidation);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState<CreateRoleDto>({ name: '', isActive: true });

  const fieldErrors = validation.fields;

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setValidation(emptyValidation);
  };

  const createMutation = useMutation({
    mutationFn: () => rolesApi.create({ ...form, name: form.name.trim() }),
    onSuccess: () => {
      closeModal();
      setSuccessMessage('Role created successfully.');
      refresh();
    },
    onError: (err) => setValidation(getApiFormValidation(err, 'Could not create role. Please check the form and try again.')),
  });

  const updateMutation = useMutation({
    mutationFn: () => rolesApi.update(editTarget!.id, { name: form.name.trim(), isActive: form.isActive ?? true }),
    onSuccess: () => {
      closeModal();
      setSuccessMessage('Role updated successfully.');
      refresh();
    },
    onError: (err) => setValidation(getApiFormValidation(err, 'Could not update role. Please check the form and try again.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      setPageError('');
      setSuccessMessage('Role deleted successfully.');
      refresh();
    },
    onError: (err) => setPageError(getApiErrorMessages(err, 'Could not delete role.')[0]),
  });

  const openCreate = () => {
    setSuccessMessage('');
    setPageError('');
    setForm({ name: '', isActive: true });
    setValidation(emptyValidation);
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setSuccessMessage('');
    setPageError('');
    setForm({ name: role.name, isActive: role.isActive });
    setValidation(emptyValidation);
    setEditTarget(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setValidation(createFormValidation([{ field: 'name', message: 'Role name is required.' }]));
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
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-gray-500 text-sm">Define access roles for your organization</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm"
        >
          <FiPlus /> New Role
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
          {roles.map((role) => (
            <div key={role.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{role.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${role.isActive ? 'bg-primary/20 text-primary' : 'bg-gray-500/15 text-gray-500'}`}>
                  {role.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Users assigned</span>
                  <span>{role.userCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span>{new Date(role.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => openEdit(role)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-border rounded hover:border-primary text-gray-700"
                >
                  <FiEdit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => { setPageError(''); setDeleteTarget(role); }}
                  disabled={role.userCount > 0}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-400/40 rounded hover:bg-red-500/10 text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
          {roles.length === 0 && <p className="text-gray-500 col-span-full text-center py-12">No roles yet</p>}
        </div>
      )}

      {(modalOpen || !!editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-primary mb-4">{editTarget ? 'Edit Role' : 'Create Role'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {validation.messages.length > 0 && (
                <FormAlert variant="error" title="Please fix the following" messages={validation.messages} />
              )}

              <FormField label="Role Name" required error={fieldErrors.name}>
                <input
                  className={inputFieldClass(!!fieldErrors.name)}
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    setValidation((prev) => withClearedField(prev, 'name'));
                  }}
                />
              </FormField>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active role
              </label>

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
        title="Delete Role"
        message={`Delete "${deleteTarget?.name}"? Roles with assigned users cannot be deleted.`}
        error={pageError && !!deleteTarget ? pageError : undefined}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => { setDeleteTarget(null); setPageError(''); }}
      />
    </div>
  );
}
