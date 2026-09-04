import type { Task } from '../../types';import type { TimeLogFormState } from '../../utils/timeLogForm';
import { ENTRY_TYPES, formDurationHours } from '../../utils/timeLogForm';
import { formatDuration } from '../../utils/timesheetUtils';
import TaskPicker from './TaskPicker';
interface LogTimeModalProps {
  open: boolean;
  title: string;
  form: TimeLogFormState;
  tasks: Task[];
  tasksLoading?: boolean;
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
  tasksLoading,
  loading,
  error,
  onChange,
  onSubmit,
  onCancel,
}: LogTimeModalProps) {
  if (!open) return null;
  const inputClass = 'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary';
  const labelClass = 'block text-sm text-gray-400 mb-1';
  const duration = formDurationHours(form);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className={labelClass}>Entry Type</label>
            <select
              className={inputClass}
              value={form.entryType}
              onChange={(e) => onChange({ ...form, entryType: e.target.value as TimeLogFormState['entryType'] })}
            >
              {ENTRY_TYPES.filter((type) => type !== 'Timer').map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Task *</label>
            <TaskPicker
              tasks={tasks}
              value={form.taskId}
              loading={tasksLoading}
              disabled={loading}
              onChange={(taskId) => onChange({ ...form, taskId })}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Time *</label>
              <input
                type="time"
                className={inputClass}
                value={form.startTime}
                onChange={(e) => onChange({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>End Time *</label>
              <input
                type="time"
                className={inputClass}
                value={form.endTime}
                onChange={(e) => onChange({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {duration > 0 && (
            <p className="text-sm text-gray-500">
              Duration: <span className="font-medium text-primary">{formatDuration(duration)}</span>
            </p>
          )}

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
            <button type="submit" disabled={loading || tasksLoading} className="px-4 py-2 text-sm bg-primary text-background rounded-lg font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
