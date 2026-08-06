import type { TimeLogFormState } from '../../utils/timeLogForm';

interface LogTimeModalProps {
  open: boolean;
  title: string;
  form: TimeLogFormState;
  tasks: { id: number; taskTitle: string; workItemNumber: string }[];
  loading?: boolean;
  error?: string;
  onChange: (form: TimeLogFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function LogTimeModal({
  open,
  title,
  form,
  tasks,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: LogTimeModalProps) {
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

          <div>
            <label className={labelClass}>Task *</label>
            <select
              className={inputClass}
              value={form.taskId || ''}
              onChange={(e) => onChange({ ...form, taskId: +e.target.value })}
              required
            >
              <option value="">Select task...</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.workItemNumber} — {t.taskTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Hours Worked *</label>
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              className={inputClass}
              value={form.hours}
              onChange={(e) => onChange({ ...form, hours: +e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Work Date *</label>
            <input
              type="date"
              className={inputClass}
              value={form.logDate}
              onChange={(e) => onChange({ ...form, logDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              className={`${inputClass} h-24`}
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="What did you work on?"
            />
          </div>

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
