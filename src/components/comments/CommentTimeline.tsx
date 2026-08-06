import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiTrash2, FiSend, FiX, FiCheck } from 'react-icons/fi';
import { commentsApi } from '../../services/stratoApi';
import { useAuth } from '../../contexts/AuthContext';
import type { Comment } from '../../types';

interface CommentTimelineProps {
  entityType: 'WorkItem' | 'Task';
  entityId: number;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function CommentTimeline({ entityType, entityId }: CommentTimelineProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['comments', entityType, entityId];

  const [newComment, setNewComment] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => commentsApi.getByEntity(entityType, entityId),
    enabled: entityId > 0,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: () => commentsApi.create({ entityType, entityId, comment: newComment.trim() }),
    onSuccess: () => {
      setNewComment('');
      setAddError('');
      invalidate();
    },
    onError: () => setAddError('Failed to add comment.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      commentsApi.update(id, entityType, { comment: text }),
    onSuccess: () => {
      setEditingId(null);
      setEditText('');
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => commentsApi.delete(id, entityType),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setAddError('Comment cannot be empty.');
      return;
    }
    createMutation.mutate();
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
  };

  const saveEdit = (id: number) => {
    if (!editText.trim()) return;
    updateMutation.mutate({ id, text: editText.trim() });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <h2 className="text-sm font-semibold text-primary">Comments</h2>

      <form onSubmit={handleAdd} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-y"
        />
        {addError && <p className="text-xs text-red-400">{addError}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createMutation.isPending || !newComment.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <FiSend /> {createMutation.isPending ? 'Posting...' : 'Add Comment'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No comments yet. Be the first to comment.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => {
            const isOwner = user?.id === comment.userId;
            const isEditing = editingId === comment.id;

            return (
              <li key={comment.id} className="border border-border/60 rounded-lg p-4 bg-background/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-primary">{comment.userName}</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(comment.createdAt)}</span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(comment.id)}
                            disabled={updateMutation.isPending || !editText.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-background rounded-lg disabled:opacity-50"
                          >
                            <FiCheck /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); setEditText(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:border-primary"
                          >
                            <FiX /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.comment}</p>
                    )}
                  </div>

                  {isOwner && !isEditing && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(comment)}
                        className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-primary/10"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(comment)}
                        className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Comment</h3>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to delete this comment? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
