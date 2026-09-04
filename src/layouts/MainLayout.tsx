import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FiHome, FiBriefcase, FiGrid, FiCheckSquare, FiFolder, FiTarget,
  FiBarChart2, FiUsers, FiBell, FiSettings, FiUser, FiLogOut, FiList, FiClock, FiShield,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/stratoApi';
import { useState } from 'react';
import NotificationToasts from '../components/notifications/NotificationToasts';
import { useNotificationPollingInterval } from '../contexts/NotificationContext';
import type { Notification } from '../types';

const navItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/my-work', icon: FiBriefcase, label: 'My Work' },
  { to: '/work-items', icon: FiList, label: 'Work Items' },
  { to: '/kanban', icon: FiGrid, label: 'Kanban Board' },
  { to: '/tasks', icon: FiCheckSquare, label: 'Tasks' },
  { to: '/projects', icon: FiFolder, label: 'Projects', adminOnly: true },
  { to: '/goals', icon: FiTarget, label: 'Goals', adminOnly: true },
  { to: '/reports', icon: FiBarChart2, label: 'Reports', adminOnly: true },
  { to: '/timesheet', icon: FiClock, label: 'Timesheet' },
  { to: '/capacity', icon: FiUsers, label: 'Team Capacity', adminOnly: true },
  { to: '/users', icon: FiUser, label: 'Users', adminOnly: true },
  { to: '/roles', icon: FiShield, label: 'Roles', adminOnly: true },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.roleName?.toLowerCase() === 'admin';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const pollingInterval = useNotificationPollingInterval();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: () => notificationsApi.getAll(true),
    enabled: showNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openNotification = (notification: Notification) => {
    if (!notification.isRead)
      markReadMutation.mutate(notification.id);

    setShowNotifications(false);

    if (notification.relatedEntityType === 'Task' && notification.relatedEntityId) {
      navigate(`/tasks/${notification.relatedEntityId}`);
      return;
    }

    navigate('/notifications');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <NotificationToasts />

      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">SF</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-primary font-bold text-lg leading-tight">StratoFlow</h1>
                <p className="text-xs text-gray-500">Work Management</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.filter((item) => !item.adminOnly || isAdmin).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-gray-600 hover:bg-border hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-primary transition-colors"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-800">StratoFlow</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-primary transition-colors"
                aria-label="Notifications"
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="font-medium text-primary">Notifications</span>
                    <button
                      type="button"
                      onClick={() => navigate('/notifications')}
                      className="text-xs text-gray-500 hover:text-primary"
                    >
                      View all
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-gray-500 text-sm text-center">No unread notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => openNotification(n)}
                          className="w-full text-left p-3 border-b border-border/50 hover:bg-border/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatNotificationTime(n.createdAt)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-primary text-sm font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.roleName}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-500 transition-colors" title="Logout">
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
