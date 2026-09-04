import { useNavigate } from 'react-router-dom';
import { FiBell, FiX } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Notification } from '../../types';

export default function NotificationToasts() {
  const navigate = useNavigate();
  const { toasts, dismissToast } = useNotifications();

  const openNotification = (notification: Notification) => {
    dismissToast(notification.id);
    if (notification.relatedEntityType === 'Task' && notification.relatedEntityId) {
      navigate(`/tasks/${notification.relatedEntityId}`);
      return;
    }
    navigate('/notifications');
  };

  if (toasts.length === 0)
    return null;

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((notification) => (
        <div
          key={notification.id}
          className="bg-card border border-primary/30 rounded-xl shadow-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <FiBell className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss notification"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <button
                type="button"
                onClick={() => openNotification(notification)}
                className="mt-3 text-xs font-medium text-primary hover:underline"
              >
                View details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
