import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { userCapacityApi, usersApi } from '../services/stratoApi';
import CapacityFormModal from '../components/capacity/CapacityFormModal';
import DeleteConfirmModal from '../components/workitems/DeleteConfirmModal';
import {
  emptyCapacityForm,
  getUtilizationBarColor,
  getUtilizationColor,
  getUtilizationRowClass,
  type CapacityFormState,
} from '../utils/capacityForm';
import { getApiErrorMessage } from '../utils/apiError';
import type { UserCapacity } from '../types';

export default function CapacityPage() {
  const queryClient = useQueryClient();
  const [weekFilter, setWeekFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserCapacity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserCapacity | null>(null);
  const [form, setForm] = useState<CapacityFormState>(emptyCapacityForm());
  const [formError, setFormError] = useState('');

  const { data: capacities = [], isLoading, isError } = useQuery({
    queryKey: ['usercapacity', weekFilter],
    queryFn: () => userCapacityApi.getAll(weekFilter || undefined),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['usercapacity'] });

  const createMutation = useMutation({
    mutationFn: () => userCapacityApi.create(form),
    onSuccess: () => {
      setFormOpen(false);
      setFormError('');
      refresh();
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Failed to create capacity record.')),
  });

  const updateMutation = useMutation({
    mutationFn: () => userCapacityApi.update(editTarget!.id, {
      weekStartDate: form.weekStartDate,
      availableHours: form.availableHours,
    }),
    onSuccess: () => {
      setEditTarget(null);
      setFormError('');
      refresh();
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Failed to update capacity record.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userCapacityApi.delete(id),
    onSuccess: () => {
      setDeleteTarget(null);
      refresh();
    },
  });

  const openCreate = () => {
    setForm(emptyCapacityForm());
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (item: UserCapacity) => {
    setForm({
      userId: item.userId,
      weekStartDate: item.weekStartDate.slice(0, 10),
      availableHours: item.availableHours,
    });
    setFormError('');
    setEditTarget(item);
  };

  const handleSubmit = () => {
    if (!form.userId && !editTarget) {
      setFormError('Please select a user.');
      return;
    }
    if (!form.weekStartDate) {
      setFormError('Week start date is required.');
      return;
    }
    if (editTarget) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Capacity</h1>
          <p className="text-gray-500 text-sm">Monitor workload, allocation, and utilization</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm"
        >
          <FiPlus /> Add Capacity
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Filter by week start</label>
          <input
            type="date"
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {weekFilter && (
          <button type="button" onClick={() => setWeekFilter('')} className="text-sm text-gray-500 hover:text-primary px-2 py-2">
            Clear filter
          </button>
        )}
        <div className="flex gap-4 text-xs text-gray-500 ml-auto">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> &lt; 80%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 80–100%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &gt; 100%</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : isError ? (
        <p className="text-red-400 text-center py-12">Failed to load capacity data.</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-gray-500 bg-background/50">
                <th className="p-4">User</th>
                <th className="p-4">Week Start</th>
                <th className="p-4">Available</th>
                <th className="p-4">Allocated</th>
                <th className="p-4">Actual</th>
                <th className="p-4">Remaining</th>
                <th className="p-4">Utilization</th>
                <th className="p-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {capacities.map((c) => {
                const utilization = c.utilizationPercentage ?? c.capacityPercentage;
                return (
                  <tr key={c.id} className={`border-b border-border/50 ${getUtilizationRowClass(utilization)}`}>
                    <td className="p-4 font-medium">{c.userName}</td>
                    <td className="p-4 text-gray-400">{c.weekStartDate?.slice(0, 10)}</td>
                    <td className="p-4">{c.availableHours}h</td>
                    <td className="p-4">{c.allocatedHours}h</td>
                    <td className="p-4">{c.actualHours}h</td>
                    <td className={`p-4 font-medium ${getUtilizationColor(utilization)}`}>
                      {(c.remainingHours ?? c.remainingCapacity)}h
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border rounded-full h-2 max-w-[100px]">
                          <div
                            className={`h-2 rounded-full ${getUtilizationBarColor(utilization)}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className={`font-medium ${getUtilizationColor(utilization)}`}>{utilization}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => openEdit(c)} className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-primary/10" title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(c)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10" title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {capacities.length === 0 && (
            <p className="text-gray-500 text-center py-12">No capacity records. Click &quot;Add Capacity&quot; to create one.</p>
          )}
        </div>
      )}

      <CapacityFormModal
        open={formOpen}
        title="Add Capacity"
        form={form}
        users={users}
        loading={createMutation.isPending}
        error={formError}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => { setFormOpen(false); setFormError(''); }}
      />

      <CapacityFormModal
        open={!!editTarget}
        title={`Edit Capacity — ${editTarget?.userName ?? ''}`}
        form={form}
        users={users}
        isEdit
        loading={updateMutation.isPending}
        error={formError}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => { setEditTarget(null); setFormError(''); }}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Capacity Record"
        message={`Delete capacity record for ${deleteTarget?.userName} (week of ${deleteTarget?.weekStartDate?.slice(0, 10)})?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
