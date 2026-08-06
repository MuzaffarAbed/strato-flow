import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/stratoApi';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 text-sm">Stay updated on assignments, comments, and changes</p>
        </div>
        <button onClick={() => markAllMutation.mutate()} className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary">
          Mark All Read
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
              className={`bg-card border rounded-xl p-4 cursor-pointer transition-colors ${
                n.isRead ? 'border-border opacity-60' : 'border-primary/30 hover:border-primary'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{n.type}</span>
                  <h3 className="font-medium mt-2">{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-gray-500 text-center py-12">No notifications</p>}
        </div>
      )}
    </div>
  );
}
