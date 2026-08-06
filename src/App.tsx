import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MyWorkPage from './pages/MyWorkPage';
import WorkItemsList from './pages/workitems/WorkItemsList';
import WorkItemDetails from './pages/workitems/WorkItemDetails';
import CreateWorkItem from './pages/workitems/CreateWorkItem';
import EditWorkItem from './pages/workitems/EditWorkItem';
import KanbanPage from './pages/KanbanPage';
import TaskDetails from './pages/tasks/TaskDetails';
import TasksList from './pages/tasks/TasksList';
import CreateTask from './pages/tasks/CreateTask';
import EditTask from './pages/tasks/EditTask';
import ProjectsPage from './pages/ProjectsPage';
import GoalsPage from './pages/GoalsPage';
import ReportsPage from './pages/ReportsPage';
import CapacityPage from './pages/CapacityPage';
import TimesheetPage from './pages/TimesheetPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/my-work" element={<MyWorkPage />} />
                <Route path="/work-items" element={<WorkItemsList />} />
                <Route path="/work-items/new" element={<CreateWorkItem />} />
                <Route path="/work-items/:id/edit" element={<EditWorkItem />} />
                <Route path="/work-items/:id" element={<WorkItemDetails />} />
                <Route path="/kanban" element={<KanbanPage />} />
                <Route path="/tasks" element={<TasksList />} />
                <Route path="/tasks/new" element={<CreateTask />} />
                <Route path="/tasks/:id/edit" element={<EditTask />} />
                <Route path="/tasks/:id" element={<TaskDetails />} />
                <Route path="/timesheet" element={<TimesheetPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/capacity" element={<CapacityPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/roles" element={<RolesPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
