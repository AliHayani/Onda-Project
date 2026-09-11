import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import AdminLayout from '../layouts/AdminLayout';

import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProcedureListPage from '../pages/procedures/ProcedureListPage';
import ProcedureDetailsPage from '../pages/procedures/ProcedureDetailsPage';
import ProcedureEditPage from '../pages/procedures/ProcedureEditPage';
import ProcedureHistoryPage from '../pages/procedures/ProcedureHistoryPage';
import ChatPage from '../pages/chatbot/ChatPage';
import ChatHistoryPage from '../pages/chatbot/ChatHistoryPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/profile/SettingsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminProceduresPage from '../pages/admin/AdminProceduresPage';
import AdminChatLogsPage from '../pages/admin/AdminChatLogsPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';

import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';

const AppRoutes: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/procedures"
        element={
          <PrivateRoute>
            <AppLayout>
              <ProcedureListPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/procedures/new"
        element={
          <PrivateRoute>
            <AppLayout>
              <ProcedureEditPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/procedures/:id"
        element={
          <PrivateRoute>
            <AppLayout>
              <ProcedureDetailsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/procedures/:id/edit"
        element={
          <PrivateRoute>
            <AppLayout>
              <ProcedureEditPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/procedures/:id/history"
        element={
          <PrivateRoute>
            <AppLayout>
              <ProcedureHistoryPage />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <AppLayout>
              <ChatPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/chat/history"
        element={
          <PrivateRoute>
            <AppLayout>
              <ChatHistoryPage />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminUsersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/procedures"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProceduresPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/chat-logs"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminChatLogsPage />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Router>
);

export default AppRoutes;
