import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Shield, User as UserIcon, Wrench } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const ROLES = ['admin', 'technician', 'staff'];
const MIN_PASSWORD_LENGTH = 10;

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white';

const ROLE_ICON = { admin: Shield, technician: Wrench, staff: UserIcon };

function RoleBadge({ role }) {
  const Icon = ROLE_ICON[role] || UserIcon;
  const color = role === 'admin' ? 'bg-primary/10 text-primary' : role === 'technician' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${color}`}>
      <Icon className="size-3" />
      {role}
    </span>
  );
}

function CreateStaffModal({ branches, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', branch_id: branches[0]?.id ?? '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const { data } = await api.post('/api/staff', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        branch_id: Number(form.branch_id),
      });
      onCreated(data);
    } catch (err) {
      if (err.code === 'EMAIL_TAKEN') setError(err.error || 'A staff account already uses that email.');
      else if (err.fields) setFieldErrors(err.fields);
      else setError(err.error || 'Could not create the account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900">Add Staff Account</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="size-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
            {fieldErrors.name && <p className="text-xs text-accent mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls} />
            {fieldErrors.email && <p className="text-xs text-accent mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={form.password} onChange={(e) => update('password', e.target.value)} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">At least {MIN_PASSWORD_LENGTH} characters. Handed to the staff member — they can change it later via an admin reset.</p>
            {fieldErrors.password && <p className="text-xs text-accent mt-1">{fieldErrors.password}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => update('role', e.target.value)} className={inputCls}>
                {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
              <select value={form.branch_id} onChange={(e) => update('branch_id', e.target.value)} className={inputCls}>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {fieldErrors.branch_id && <p className="text-xs text-accent mt-1">{fieldErrors.branch_id}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
            <button type="button" onClick={onClose} className="px-5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStaffModal({ member, branches, isSelf, onClose, onUpdated }) {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [branchId, setBranchId] = useState(member.branch_id);
  const [isActive, setIsActive] = useState(Boolean(member.is_active));
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});

    const body = {};
    if (name.trim() !== member.name) body.name = name.trim();
    if (role !== member.role) body.role = role;
    if (Number(branchId) !== member.branch_id) body.branch_id = Number(branchId);
    if (isActive !== Boolean(member.is_active)) body.is_active = isActive;
    if (newPassword) body.password = newPassword;

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    try {
      const { data } = await api.patch(`/api/staff/${member.id}`, body);
      onUpdated(data);
    } catch (err) {
      if (err.code === 'LAST_ADMIN') setError(err.error || 'Cannot deactivate the last active admin — promote another admin first.');
      else if (err.fields) setFieldErrors(err.fields);
      else setError(err.error || 'Could not update this account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900">Edit Staff Account</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="size-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            {fieldErrors.name && <p className="text-xs text-accent mt-1">{fieldErrors.name}</p>}
          </div>
          <p className="text-xs text-gray-400 -mt-2">{member.email}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSelf}
                className={inputCls + (isSelf ? ' bg-gray-50 text-gray-400 cursor-not-allowed' : '')}
              >
                {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
              {isSelf && <p className="text-xs text-gray-400 mt-1">You cannot change your own role.</p>}
              {fieldErrors.role && <p className="text-xs text-accent mt-1">{fieldErrors.role}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputCls}>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {fieldErrors.branch_id && <p className="text-xs text-accent mt-1">{fieldErrors.branch_id}</p>}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                disabled={isSelf}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active — can log in
            </label>
            {isSelf && <p className="text-xs text-gray-400 mt-1">You cannot deactivate your own account.</p>}
            {fieldErrors.is_active && <p className="text-xs text-accent mt-1">{fieldErrors.is_active}</p>}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reset Password</label>
            <input
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">
              This is the only password-reset path in the system — there's no email recovery.
            </p>
            {fieldErrors.password && <p className="text-xs text-accent mt-1">{fieldErrors.password}</p>}
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="px-5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { staff: me } = useAuth();
  const [branches, setBranches] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [branchFilter, setBranchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    api.get('/api/branches').then(({ data }) => setBranches(data.branches)).catch(() => {});
  }, []);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = {};
    if (branchFilter) params.branch_id = branchFilter;
    if (roleFilter) params.role = roleFilter;
    if (includeInactive) params.include_inactive = 'true';
    try {
      const { data } = await api.get('/api/staff', { params });
      setStaffList(data.staff);
    } catch (err) {
      setError(err.error || 'Could not load staff.');
    } finally {
      setLoading(false);
    }
  }, [branchFilter, roleFilter, includeInactive]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Mirrors loadStaff, but respects `cancelled` so a fast filter change
      // can't let a stale response overwrite a newer one.
      setLoading(true);
      setError('');
      const params = {};
      if (branchFilter) params.branch_id = branchFilter;
      if (roleFilter) params.role = roleFilter;
      if (includeInactive) params.include_inactive = 'true';
      try {
        const { data } = await api.get('/api/staff', { params });
        if (!cancelled) setStaffList(data.staff);
      } catch (err) {
        if (!cancelled) setError(err.error || 'Could not load staff.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [branchFilter, roleFilter, includeInactive]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-widest font-medium">iFix RepairTrack</p>
            <h1 className="text-xl font-bold mt-0.5">Staff Management</h1>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-white text-primary px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            <Plus className="size-4" />
            Add Staff
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-2 items-center">
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
            <option value="">All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
            Show deactivated
          </label>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading staff...</div>}
          {!loading && error && <div className="text-center py-12 text-accent text-sm">{error}</div>}
          {!loading && !error && staffList.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No staff accounts match your filters</div>
          )}
          {!loading && !error && staffList.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Branch</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffList.map((member) => (
                  <tr key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {member.name}
                      {member.id === me?.id && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{member.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={member.role} /></td>
                    <td className="px-4 py-3 text-gray-500">{member.branch_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {member.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(member)} className="text-primary text-xs font-semibold hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateStaffModal
          branches={branches}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); loadStaff(); }}
        />
      )}

      {editing && (
        <EditStaffModal
          member={editing}
          branches={branches}
          isSelf={editing.id === me?.id}
          onClose={() => setEditing(null)}
          onUpdated={() => { setEditing(null); loadStaff(); }}
        />
      )}
    </div>
  );
}
