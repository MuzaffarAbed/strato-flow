import type { CreateWorkItemDto } from '../../types';

interface WorkItemFormProps {
  form: CreateWorkItemDto & { percentComplete?: number; actualHours?: number };
  onChange: (form: CreateWorkItemDto & { percentComplete?: number; actualHours?: number }) => void;
  isEdit?: boolean;
  priorities: { id: number; name: string }[];
  statuses: { id: number; name: string }[];
  workItemTypes: { id: number; name: string }[];
  projects: { id: number; name: string }[];
  goals: { id: number; name: string }[];
  users: { id: number; fullName: string }[];
}

export default function WorkItemForm({
  form,
  onChange,
  isEdit = false,
  priorities,
  statuses,
  workItemTypes,
  projects,
  goals,
  users,
}: WorkItemFormProps) {
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    onChange({ ...form, [key]: value });

  const inputClass = 'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary';
  const labelClass = 'block text-sm text-gray-400 mb-1';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={labelClass}>Title *</label>
        <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} required />
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Description</label>
        <textarea className={`${inputClass} h-24`} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Business Reason</label>
        <textarea className={`${inputClass} h-20`} value={form.businessReason ?? ''} onChange={(e) => set('businessReason', e.target.value)} />
      </div>

      <div>
        <label className={labelClass}>Type *</label>
        <select className={inputClass} value={form.workItemTypeId} onChange={(e) => set('workItemTypeId', +e.target.value)}>
          {workItemTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Priority *</label>
        <select className={inputClass} value={form.priorityId} onChange={(e) => set('priorityId', +e.target.value)}>
          {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Status *</label>
        <select className={inputClass} value={form.statusId} onChange={(e) => set('statusId', +e.target.value)}>
          {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Assigned To</label>
        <select className={inputClass} value={form.assignedToId ?? ''} onChange={(e) => set('assignedToId', e.target.value ? +e.target.value : undefined)}>
          <option value="">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Project</label>
        <select className={inputClass} value={form.projectId ?? ''} onChange={(e) => set('projectId', e.target.value ? +e.target.value : undefined)}>
          <option value="">None</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Goal</label>
        <select className={inputClass} value={form.goalId ?? ''} onChange={(e) => set('goalId', e.target.value ? +e.target.value : undefined)}>
          <option value="">None</option>
          {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Estimated Hours</label>
        <input type="number" min="0" step="0.5" className={inputClass} value={form.estimatedHours ?? ''} onChange={(e) => set('estimatedHours', e.target.value ? +e.target.value : undefined)} />
      </div>

      <div>
        <label className={labelClass}>Start Date</label>
        <input type="date" className={inputClass} value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value || undefined)} />
      </div>

      <div>
        <label className={labelClass}>Due Date</label>
        <input type="date" className={inputClass} value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || undefined)} />
      </div>

      {isEdit && (
        <>
          <div>
            <label className={labelClass}>Percent Complete</label>
            <input type="number" min="0" max="100" className={inputClass} value={form.percentComplete ?? 0} onChange={(e) => set('percentComplete', +e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Actual Hours</label>
            <input type="number" min="0" step="0.5" className={inputClass} value={form.actualHours ?? ''} onChange={(e) => set('actualHours', e.target.value ? +e.target.value : undefined)} />
          </div>
        </>
      )}
    </div>
  );
}
