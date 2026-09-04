import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiSearch } from 'react-icons/fi';
import type { Task } from '../../types';
import { groupTasksForPicker, taskMatchesSearch } from '../../utils/timeLogForm';

interface TaskPickerProps {
  tasks: Task[];
  value: number;
  loading?: boolean;
  disabled?: boolean;
  onChange: (taskId: number) => void;
}

export default function TaskPicker({ tasks, value, loading, disabled, onChange }: TaskPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedTask = tasks.find((task) => task.id === value);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const groups = groupTasksForPicker(tasks);

    if (!query) return groups;

    return groups
      .map((group) => ({
        ...group,
        tasks: group.tasks.filter((task) => taskMatchesSearch(task, query)),
      }))
      .filter((group) => group.tasks.length > 0);
  }, [tasks, search]);

  const resultCount = filteredGroups.reduce((sum, group) => sum + group.tasks.length, 0);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = (taskId: number) => {
    onChange(taskId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((current) => !current)}
        className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
          open ? 'border-primary ring-2 ring-primary/15' : 'border-border hover:border-gray-300'
        } ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'bg-background'}`}
      >
        {loading ? (
          <p className="text-sm text-gray-500">Loading tasks...</p>
        ) : selectedTask ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {selectedTask.projectName || 'No Project'}
              </span>
              <p className="text-sm font-medium text-gray-800 truncate">{selectedTask.taskTitle}</p>
              <p className="text-xs text-gray-500 truncate">
                <span className="font-mono text-gray-600">{selectedTask.workItemNumber}</span>
                {' · '}
                {selectedTask.workItemTitle}
              </p>
            </div>
            <FiChevronDown className={`shrink-0 text-gray-400 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{tasks.length === 0 ? 'No tasks available' : 'Choose a task to log time against...'}</p>
            <FiChevronDown className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        )}
      </button>

      {open && !loading && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border bg-background/80 p-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project, work item, or task..."
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              {resultCount} task{resultCount === 1 ? '' : 's'} found
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredGroups.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">No tasks match your search.</p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.projectName} className="mb-2 last:mb-0">
                  <div className="sticky top-0 z-10 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-card/95 backdrop-blur-sm">
                    {group.projectName}
                  </div>
                  <div className="space-y-1">
                    {group.tasks.map((task) => {
                      const selected = task.id === value;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleSelect(task.id)}
                          className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-transparent hover:border-border hover:bg-background/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-md bg-background border border-border px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-700">
                                  {task.workItemNumber}
                                </span>
                                {task.statusName && (
                                  <span className="text-[10px] text-gray-400">{task.statusName}</span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-gray-500 truncate">{task.workItemTitle}</p>
                              <p className="mt-0.5 text-sm font-medium text-gray-800 truncate">{task.taskTitle}</p>
                            </div>
                            {selected && <FiCheck className="shrink-0 text-primary mt-1" size={16} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
