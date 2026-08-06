import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { workItemsApi } from '../services/stratoApi';
import type { KanbanColumn, KanbanWorkItem } from '../types';

function moveItem(columns: KanbanColumn[], sourceStatusId: number, destStatusId: number, sourceIndex: number, destIndex: number): KanbanColumn[] {
  const next = columns.map((col) => ({ ...col, items: [...col.items] }));
  const sourceCol = next.find((c) => c.statusId === sourceStatusId);
  const destCol = next.find((c) => c.statusId === destStatusId);
  if (!sourceCol || !destCol) return columns;

  const [moved] = sourceCol.items.splice(sourceIndex, 1);
  if (!moved) return columns;

  const updated: KanbanWorkItem = {
    ...moved,
    statusId: destStatusId,
    statusName: destCol.statusName,
  };
  destCol.items.splice(destIndex, 0, updated);
  return next;
}

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['kanban'],
    queryFn: () => workItemsApi.getKanban(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ workItemId, statusId }: { workItemId: number; statusId: number }) =>
      workItemsApi.updateStatus(workItemId, statusId),
    onSuccess: () => {
      setError('');
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['workitems'] });
    },
    onError: () => {
      setError('Failed to update status. Board has been refreshed.');
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;

    const sourceStatusId = +source.droppableId;
    const destStatusId = +destination.droppableId;
    if (sourceStatusId === destStatusId && source.index === destination.index) return;

    const sourceCol = columns.find((c) => c.statusId === sourceStatusId);
    const item = sourceCol?.items[source.index];
    if (!item) return;

    if (sourceStatusId !== destStatusId) {
      queryClient.setQueryData<KanbanColumn[]>(['kanban'], (current) =>
        current ? moveItem(current, sourceStatusId, destStatusId, source.index, destination.index) : current
      );
      updateMutation.mutate({ workItemId: item.id, statusId: destStatusId });
    } else {
      queryClient.setQueryData<KanbanColumn[]>(['kanban'], (current) =>
        current ? moveItem(current, sourceStatusId, destStatusId, source.index, destination.index) : current
      );
    }
  }, [columns, queryClient, updateMutation]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-gray-500 text-sm">Drag work items between status columns — changes are saved automatically</p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</div>
      )}

      {updateMutation.isPending && (
        <div className="text-xs text-gray-500">Saving status change...</div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumnView key={column.statusId} column={column} />
          ))}
        </div>
      </DragDropContext>

      {columns.length === 0 && (
        <p className="text-gray-500 text-sm">No statuses configured. Add statuses to the database to build the board.</p>
      )}
    </div>
  );
}

function KanbanColumnView({ column }: { column: KanbanColumn }) {
  return (
    <div className="min-w-[280px] w-[280px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color || '#6B7280' }} />
        <h3 className="font-semibold text-sm text-gray-300">{column.statusName}</h3>
        <span className="text-xs bg-border text-gray-500 px-2 py-0.5 rounded-full ml-auto">{column.items.length}</span>
      </div>

      <Droppable droppableId={String(column.statusId)} isDropDisabled={false}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[240px] rounded-xl p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary/10 border border-primary/30' : 'bg-card/50 border border-border'
            }`}
          >
            {column.items.map((item, index) => (
              <KanbanCard key={item.id} item={item} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function KanbanCard({ item, index }: { item: KanbanWorkItem; index: number }) {
  return (
    <Draggable draggableId={String(item.id)} index={index} isDragDisabled={false}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-card border border-border rounded-lg p-3 ${
            snapshot.isDragging ? 'shadow-lg border-primary/50 rotate-1 cursor-grabbing' : 'hover:border-primary/30 cursor-grab'
          }`}
        >
          <Link to={`/work-items/${item.id}`} className="block" onClick={(e) => snapshot.isDragging && e.preventDefault()}>
            <p className="text-xs text-primary font-medium">{item.workItemNumber}</p>
            <p className="text-sm font-medium mt-1 line-clamp-2">{item.title}</p>
            <div className="flex items-center justify-between mt-2">
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: `${item.priorityColor || '#6B7280'}33`, color: item.priorityColor || '#9CA3AF' }}
              >
                {item.priorityName}
              </span>
              <span className="text-xs text-gray-500">{item.percentComplete}%</span>
            </div>
            {item.assignedToName && <p className="text-xs text-gray-500 mt-2">{item.assignedToName}</p>}
            {item.dueDate && <p className="text-xs text-orange-400 mt-1">Due: {item.dueDate}</p>}
          </Link>
        </div>
      )}
    </Draggable>
  );
}
