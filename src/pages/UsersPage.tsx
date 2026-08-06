import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { usersApi, rolesApi, lookupsApi } from '../services/stratoApi';
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
import type { CreateUserDto, UserDetail } from '../types';

const emptyForm = (): CreateUserDto & { password: string } => ({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  departmentId: undefined,
  roleId: 0,
  isActive: true,
});

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDetail | null>(null);
  const [validation, setValidation] = useState<FormValidationState>(emptyValidation);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState(emptyForm());

  const fieldErrors = validation.fields;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => usersApi.getAll({ activeOnly: false }),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  const { data: lookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: () => lookupsApi.getAll(),
  });

  const departments = lookups?.departments ?? [];
  const activeRoles = roles.filter((r) => r.isActive);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setValidation(emptyValidation);
  };

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidation((prev) => withClearedField(prev, String(key)));
  };

  const createMutation = useMutation({
    mutationFn: () => usersApi.create({
      ...form,
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      departmentId: form.departmentId || undefined,
    }),
    onSuccess: () => {
      closeModal();
      setSuccessMessage('User created successfully.');
      refresh();
    },
    onError: (err) => setValidation(getApiFormValidation(err, 'Could not create user. Please check the form and try again.')),
  });

  const updateMutation = useMutation({
    mutationFn: () => usersApi.update(editTarget!.id, {
      email: form.email.trim(),
      password: form.password.trim() || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      departmentId: form.departmentId || undefined,
      roleId: form.roleId,
      isActive: form.isActive ?? true,
    }),
    onSuccess: () => {
      closeModal();
      setSuccessMessage('User updated successfully.');
      refresh();
    },
    onError: (err) => setValidation(getApiFormValidation(err, 'Could not update user. Please check the form and try again.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      setPageError('');
      setSuccessMessage('User deactivated successfully.');
      refresh();
    },
    onError: (err) => setPageError(getApiErrorMessages(err, 'Could not deactivate user.')[0]),
  });

  const openCreate = () => {
    setSuccessMessage('');
    setPageError('');
    setForm({
      ...emptyForm(),
      roleId: activeRoles[0]?.id ?? 0,
    });
    setValidation(emptyValidation);
    setModalOpen(true);
  };

  const openEdit = (user: UserDetail) => {
    setSuccessMessage('');
    setPageError('');
    setForm({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId ?? undefined,
      roleId: user.roleId ?? activeRoles[0]?.id ?? 0,
      isActive: user.isActive,
    });
    setValidation(emptyValidation);
    setEditTarget(user);
  };

  const validateForm = (): FormValidationState => {
    const items: Array<{ field?: string; message: string }> = [];

    if (!form.firstName.trim()) items.push({ field: 'firstName', message: 'First name is required.' });
    if (!form.lastName.trim()) items.push({ field: 'lastName', message: 'Last name is required.' });
    if (!form.email.trim()) items.push({ field: 'email', message: 'Email address is required.' });
    if (!form.roleId) items.push({ field: 'roleId', message: 'Please select a role.' });

    if (!editTarget) {
      if (!form.password.trim()) items.push({ field: 'password', message: 'Password is required for new users.' });
      else if (form.password.length < 6) {
        items.push({ field: 'password', message: 'Password must be at least 6 characters.' });
      }
    } else if (form.password.trim() && form.password.length < 6) {
      items.push({ field: 'password', message: 'New password must be at least 6 characters.' });
    }

    return createFormValidation(items);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm();
    if (result.messages.length) {
      setValidation(result);
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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-500 text-sm">Manage team members, roles, and access</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm"
        >
          <FiPlus /> New User
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
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/70 hover:bg-background/30">
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">{user.roleName}</td>
                    <td className="px-4 py-3 text-gray-600">{user.departmentName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${user.isActive ? 'bg-green-500/15 text-green-600' : 'bg-gray-500/15 text-gray-500'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-border rounded hover:border-primary text-gray-700"
                        >
                          <FiEdit2 size={12} /> Edit
                        </button>
                        {user.isActive && (
                          <button
                            type="button"
                            onClick={() => { setPageError(''); setDeleteTarget(user); }}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-400/40 rounded hover:bg-red-500/10 text-red-500"
                          >
                            <FiTrash2 size={12} /> Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(modalOpen || !!editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-primary mb-4">{editTarget ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {validation.messages.length > 0 && (
                <FormAlert
                  variant="error"
                  title="Please fix the following"
                  messages={validation.messages}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="First Name" required error={fieldErrors.firstName}>
                  <input
                    className={inputFieldClass(!!fieldErrors.firstName)}
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                  />
                </FormField>
                <FormField label="Last Name" required error={fieldErrors.lastName}>
                  <input
                    className={inputFieldClass(!!fieldErrors.lastName)}
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Email" required error={fieldErrors.email}>
                <input
                  type="email"
                  className={inputFieldClass(!!fieldErrors.email)}
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </FormField>

              <FormField
                label={editTarget ? 'Password (leave blank to keep current)' : 'Password'}
                required={!editTarget}
                error={fieldErrors.password}
                hint="Must be at least 6 characters."
              >
                <input
                  type="password"
                  className={inputFieldClass(!!fieldErrors.password)}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Role" required error={fieldErrors.roleId}>
                  <select
                    className={inputFieldClass(!!fieldErrors.roleId)}
                    value={form.roleId}
                    onChange={(e) => updateField('roleId', Number(e.target.value))}
                  >
                    <option value={0}>Select role</option>
                    {activeRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Department" error={fieldErrors.departmentId}>
                  <select
                    className={inputFieldClass(!!fieldErrors.departmentId)}
                    value={form.departmentId ?? ''}
                    onChange={(e) => updateField('departmentId', e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">None</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {editTarget && (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateField('isActive', e.target.checked)}
                  />
                  Active account
                </label>
              )}

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
        title="Deactivate User"
        message={`Deactivate "${deleteTarget?.fullName}"? They will no longer be able to sign in.`}
        error={pageError && !!deleteTarget ? pageError : undefined}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => { setDeleteTarget(null); setPageError(''); }}
      />
    </div>
  );
}
