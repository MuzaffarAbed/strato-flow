import type { TaskFormState } from '../../utils/taskForm';

interface TaskFormProps {
  form: TaskFormState;
  onChange: (form: TaskFormState) => void;
  isEdit?: boolean;
  priorities: { id: number; name: string }[];
  statuses: { id: number; name: string }[];
  users: { id: number; fullName: string }[];
  workItems: { id: number; workItemNumber: string; title: string; projectName?: string; workItemTypeName?: string }[];
}

export default function TaskForm({
  form,
  onChange,
  isEdit = false,
  priorities,
  statuses,
  users,
  workItems,
}: TaskFormProps) {
  const set = <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) =>
    onChange({ ...form, [key]: value });

  const toggleUser = (userId: number) => {
    const current = form.assignedUserIds ?? [];
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    const assignedToId = form.assignedToId === userId && !next.includes(userId)
      ? next[0]
      : (!form.assignedToId && next.length > 0 ? next[0] : form.assignedToId);
    onChange({ ...form, assignedUserIds: next, assignedToId });
  };

  const inputClass = 'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary';
  const labelClass = 'block text-sm text-gray-400 mb-1';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={labelClass}>Work Item *</label>
        <select
          className={inputClass}
          value={form.workItemId || ''}
          onChange={(e) => set('workItemId', +e.target.value)}
          required
        >
          <option value="">Select work item...</option>
          {workItems.map((w) => (
            <option key={w.id} value={w.id}>
              {w.workItemNumber} — {w.title}
              {w.workItemTypeName ? ` [${w.workItemTypeName}]` : ''}
              {w.projectName ? ` · ${w.projectName}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Task Title *</label>
        <input className={inputClass} value={form.taskTitle} onChange={(e) => set('taskTitle', e.target.value)} required />
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Description</label>
        <textarea className={`${inputClass} h-24`} value={form.taskDescription ?? ''} onChange={(e) => set('taskDescription', e.target.value)} />
      </div>

      <div>
        <label className={labelClass}>Status *</label>
        <select className={inputClass} value={form.statusId} onChange={(e) => set('statusId', +e.target.value)}>
          {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Priority *</label>
        <select className={inputClass} value={form.priorityId} onChange={(e) => set('priorityId', +e.target.value)}>
          {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Primary Assignee</label>
        <select
          className={inputClass}
          value={form.assignedToId ?? ''}
          onChange={(e) => {
            const id = e.target.value ? +e.target.value : undefined;
            set('assignedToId', id);
            if (id && !(form.assignedUserIds ?? []).includes(id)) {
              set('assignedUserIds', [...(form.assignedUserIds ?? []), id]);
            }
          }}
        >
          <option value="">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Estimated Hours</label>
        <input
          type="number"
          min="0"
          step="0.5"
          className={inputClass}
          value={form.estimatedHours ?? ''}
          onChange={(e) => set('estimatedHours', e.target.value ? +e.target.value : undefined)}
        />
      </div>

      <div>
        <label className={labelClass}>Due Date</label>
        <input type="date" className={inputClass} value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || undefined)} />
      </div>

      <div>
        <label className={labelClass}>Start Date</label>
        <input type="date" className={inputClass} value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value || undefined)} />
      </div>

      {isEdit && (
        <>
          <div>
            <label className={labelClass}>Percent Complete</label>
            <input
              type="number"
              min="0"
              max="100"
              className={inputClass}
              value={form.percentComplete ?? 0}
              onChange={(e) => set('percentComplete', +e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Actual Hours</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className={inputClass}
              value={form.actualHours ?? ''}
              onChange={(e) => set('actualHours', e.target.value ? +e.target.value : undefined)}
            />
          </div>
        </>
      )}

      <div className="md:col-span-2">
        <label className={labelClass}>Assigned Users</label>
        <div className="bg-background border border-border rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(form.assignedUserIds ?? []).includes(u.id)}
                onChange={() => toggleUser(u.id)}
                className="rounded border-border"
              />
              {u.fullName}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
