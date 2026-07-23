import { useAuth } from '../hooks/useAuth';

// Guards admin-only pages (e.g. /admin/staff) for staff who are logged in
// but not admins. The backend already 403s the underlying data calls; this
// just keeps a non-admin who navigates here directly from seeing a broken
// page full of failed requests.
export default function AdminRoute({ children }) {
  const { staff } = useAuth();

  if (staff?.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Access restricted</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          This page is only available to admin accounts. Contact an admin if you need
          access.
        </p>
      </div>
    );
  }

  return children;
}
