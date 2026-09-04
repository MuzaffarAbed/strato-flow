import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HubConnection } from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { notificationsApi } from '../services/stratoApi';
import {
  createNotificationHubConnection,
  type Notification,
} from '../services/notificationHub';

interface NotificationContextValue {
  toasts: Notification[];
  dismissToast: (id: number) => void;
  isRealtimeConnected: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);
  const connectionRef = useRef<HubConnection | null>(null);

  const pushToast = useCallback((notification: Notification) => {
    if (seenIdsRef.current.has(notification.id))
      return;

    seenIdsRef.current.add(notification.id);
    setToasts((prev) => [notification, ...prev].slice(0, 4));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      initializedRef.current = false;
      seenIdsRef.current = new Set();
      setToasts([]);
      setIsRealtimeConnected(false);
      return;
    }

    const connection = createNotificationHubConnection();
    connectionRef.current = connection;

    connection.on('ReceiveNotification', (notification: Notification) => {
      pushToast(notification);
    });

    connection.onreconnected(() => setIsRealtimeConnected(true));
    connection.onclose(() => setIsRealtimeConnected(false));

    let cancelled = false;

    const startConnection = async () => {
      try {
        await connection.start();
        if (!cancelled)
          setIsRealtimeConnected(true);
      } catch {
        if (!cancelled)
          setIsRealtimeConnected(false);
      }
    };

    void startConnection();

    return () => {
      cancelled = true;
      setIsRealtimeConnected(false);
      void connection.stop();
      connectionRef.current = null;
    };
  }, [isAuthenticated, pushToast]);

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['notifications', 'live'],
    queryFn: () => notificationsApi.getAll(true),
    enabled: isAuthenticated,
    refetchInterval: isRealtimeConnected ? 60000 : 3000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (!isAuthenticated)
      return;

    if (!initializedRef.current) {
      unreadNotifications.forEach((notification) => seenIdsRef.current.add(notification.id));
      initializedRef.current = true;
      return;
    }

    const incoming = unreadNotifications.filter((notification) => !seenIdsRef.current.has(notification.id));
    incoming.forEach(pushToast);
  }, [isAuthenticated, unreadNotifications, pushToast]);

  useEffect(() => {
    if (toasts.length === 0)
      return;

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  return (
    <NotificationContext.Provider value={{ toasts, dismissToast, isRealtimeConnected }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error('useNotifications must be used within NotificationProvider');

  return context;
}

export function useNotificationPollingInterval() {
  const context = useContext(NotificationContext);
  return context?.isRealtimeConnected ? 60000 : 3000;
}
