import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const BASE_NAV_ITEMS = [
  { to: '/admin/jobs', label: 'Jobs', end: true },
  { to: '/admin/jobs/new', label: 'New Job', end: true },
];

export default function StaffLayout() {
  const { staff, logout } = useAuth();
  const navItems =
    staff?.role === 'admin'
      ? [...BASE_NAV_ITEMS, { to: '/admin/staff', label: 'Staff', end: true }]
      : BASE_NAV_ITEMS;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 flex-shrink-0 bg-[#204093] text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">
            iFix RepairTrack
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-xs text-blue-100 space-y-3">
          <div>
            <p className="font-semibold text-white text-sm">{staff?.name}</p>
            <p className="text-blue-200 mt-0.5">
              {staff?.branch_name ?? `Branch #${staff?.branch_id ?? '—'}`}
              {' · '}
              <span className="capitalize">{staff?.role}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
