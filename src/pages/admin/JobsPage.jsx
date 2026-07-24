import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, AlertTriangle, Smartphone, User, MapPin, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { hoursSinceUtc } from '../../lib/format';
import { JOB_STATUSES } from '../../lib/jobStatus';
import { useAuth } from '../../hooks/useAuth';

// A job hasn't moved in a while — frontend-only judgment call, since the
// backend doesn't compute or expose any "stuck" flag. 24h is a reasonable
// default for a same-day-turnaround repair shop; adjust if that's not right.
const STUCK_THRESHOLD_HOURS = 24;

export default function JobsPage() {
  const navigate = useNavigate();
  const { staff } = useAuth();
  const isAdmin = staff?.role === 'admin';

  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/api/branches')
      .then(({ data }) => setBranches(data.branches))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (isAdmin && branchFilter) params.branch_id = branchFilter;

      try {
        const { data } = await api.get('/api/jobs', { params });
        if (cancelled) return;
        setJobs(data.jobs);
        setMeta(data.meta);
      } catch (err) {
        if (!cancelled) setError(err.error || 'Could not load jobs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Debounce the free-text search so every keystroke doesn't fire a request.
    const t = setTimeout(load, search ? 300 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, status, branchFilter, isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#204093] text-white px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-widest font-medium">iFix RepairTrack</p>
            <h1 className="text-xl font-bold mt-0.5">Job Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/admin/jobs/new')}
            className="flex items-center gap-2 bg-white text-primary px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            <Plus className="size-4" />
            Create New Job
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-5">
        {/* Search + filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job number, customer, or device..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="size-4 text-gray-400" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none bg-white">
              <option value="">All Status</option>
              {JOB_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {isAdmin && (
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none bg-white">
                <option value="">All Branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>
          {!loading && <p className="text-xs text-gray-400">{meta.total} job{meta.total !== 1 ? 's' : ''} found</p>}
        </div>

        {/* Job cards */}
        <div className="space-y-2">
          {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading jobs...</div>}

          {!loading && error && <div className="text-center py-12 text-accent text-sm">{error}</div>}

          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Smartphone className="size-10 mx-auto mb-3 text-gray-200" />
              <p>No jobs match your filters</p>
            </div>
          )}

          {!loading && !error && jobs.map((job) => {
            const hours = hoursSinceUtc(job.updated_at);
            const stuck = job.current_status !== 'collected' && hours !== null && hours >= STUCK_THRESHOLD_HOURS;
            return (
              <button
                key={job.job_id}
                onClick={() => navigate(`/admin/jobs/${job.job_id}`)}
                className="w-full bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-gray-900 text-sm">{job.job_id}</span>
                      {stuck && (
                        <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="size-3" /> Stuck {Math.floor(hours)}h
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {job.current_status_label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="size-3" />{job.customer_name}</span>
                      <span className="flex items-center gap-1"><Smartphone className="size-3" />{job.device_brand} {job.device_model}</span>
                      <span className="flex items-center gap-1"><MapPin className="size-3" />{job.branch_name}</span>
                      {job.technician_name && (
                        <span className="flex items-center gap-1"><User className="size-3 opacity-60" />Tech: {job.technician_name}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-gray-300 group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
