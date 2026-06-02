import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Setting from '../pages/Setting';
import System from '../pages/System';
import Students from '../pages/Students';
import Attendance from '../pages/Attendance';
import Scores from '../pages/Scores';
import Teachers from '../pages/Teachers';
import LandingPage from '../pages/LandingPage';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'students',
            element: <Students />,
          },
          {
            path: 'attendance',
            element: <Attendance />,
          },
          {
            path: 'scores',
            element: <Scores />,
          },
          {
            path: 'teachers',
            element: (
              <RoleRoute forbiddenRoles={['LECTURER']}>
                <Teachers />
              </RoleRoute>
            ),
          },
          {
            path: 'users',
            element: <Users />,
          },
          {
            path: 'settings',
            element: (
              <RoleRoute forbiddenRoles={['LECTURER']}>
                <Setting />
              </RoleRoute>
            ),
          },
          {
            path: 'system',
            element: (
              <RoleRoute forbiddenRoles={['LECTURER']}>
                <System />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
