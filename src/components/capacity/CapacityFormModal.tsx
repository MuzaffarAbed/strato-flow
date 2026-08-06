import type { CapacityFormState } from '../../utils/capacityForm';

interface CapacityFormModalProps {
  open: boolean;
  title: string;
  form: CapacityFormState;
  users: { id: number; fullName: string }[];
  isEdit?: boolean;
  loading?: boolean;
  error?: string;
  onChange: (form: CapacityFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function CapacityFormModal({
  open,
  title,
  form,
  users,
  isEdit = false,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: CapacityFormModalProps) {
  if (!open) return null;

  const inputClass = 'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary';
  const labelClass = 'block text-sm text-gray-400 mb-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>
          )}

          {!isEdit && (
            <div>
              <label className={labelClass}>User *</label>
              <select
                className={inputClass}
                value={form.userId || ''}
                onChange={(e) => onChange({ ...form, userId: +e.target.value })}
                required
              >
                <option value="">Select user...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Week Start Date *</label>
            <input
              type="date"
              className={inputClass}
              value={form.weekStartDate}
              onChange={(e) => onChange({ ...form, weekStartDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Available Hours *</label>
            <input
              type="number"
              min="0.5"
              max="168"
              step="0.5"
              className={inputClass}
              value={form.availableHours}
              onChange={(e) => onChange({ ...form, availableHours: +e.target.value })}
              required
            />
          </div>

          <p className="text-xs text-gray-500">
            Allocated and actual hours are calculated automatically from assigned tasks and time logs.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary text-background rounded-lg font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
