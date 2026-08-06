interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  error?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ open, title, message, error, loading, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-red-400 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        {error && (
          <div className="text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4" role="alert">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50">
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
