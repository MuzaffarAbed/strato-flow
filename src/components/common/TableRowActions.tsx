interface TableRowActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TableRowActions({ onView, onEdit, onDelete }: TableRowActionsProps) {
  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => handleClick(e, onView)}
        className="px-2 py-1 text-xs text-primary hover:underline"
      >
        View
      </button>
      <button
        type="button"
        onClick={(e) => handleClick(e, onEdit)}
        className="px-2 py-1 text-xs text-primary hover:underline"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={(e) => handleClick(e, onDelete)}
        className="px-2 py-1 text-xs text-red-500 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}
