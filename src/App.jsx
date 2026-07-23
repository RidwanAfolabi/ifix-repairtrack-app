import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import PublicLayout from './layouts/PublicLayout';
import StaffLayout from './layouts/StaffLayout';

import TrackPage from './pages/public/TrackPage';
import RepairStatusPage from './pages/public/RepairStatusPage';
import WarrantyPage from './pages/public/WarrantyPage';
import ReviewsPage from './pages/public/ReviewsPage';
import NotFoundPage from './pages/NotFoundPage';

import LoginPage from './pages/admin/LoginPage';
import JobsPage from './pages/admin/JobsPage';
import NewJobPage from './pages/admin/NewJobPage';
import JobDetailPage from './pages/admin/JobDetailPage';
import StaffPage from './pages/admin/StaffPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Navigate to="/track" replace />} />
          <Route path="track" element={<TrackPage />} />
          <Route path="track/:jobId" element={<RepairStatusPage />} />
          <Route path="warranty" element={<WarrantyPage />} />
          <Route path="warranty/:jobId" element={<WarrantyPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
        </Route>

        <Route path="admin/login" element={<LoginPage />} />

        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="jobs" replace />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/new" element={<NewJobPage />} />
          <Route path="jobs/:jobId" element={<JobDetailPage />} />
          <Route
            path="staff"
            element={
              <AdminRoute>
                <StaffPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
