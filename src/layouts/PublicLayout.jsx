import { Link, Outlet } from 'react-router-dom';

// Minimal shell for customer-facing pages — brand colors only, no staff nav.
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary text-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/track" className="font-bold text-lg tracking-tight">
            iFix Express
          </Link>
          <span className="text-xs text-blue-200 font-semibold uppercase tracking-widest">
            RepairTrack
          </span>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 text-center text-xs py-6 px-4">
        <p>&copy; {new Date().getFullYear()} iFix Express. All rights reserved.</p>
      </footer>
    </div>
  );
}
