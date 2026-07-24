import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ExternalLink, History, X, RefreshCw, Camera, ImagePlus, Trash2,
  CheckCircle2, MessageSquare, Shield,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/format';
import { JOB_STATUSES, statusRank } from '../../lib/jobStatus';

const WARRANTY_BADGE = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  expired: { label: 'Expired', color: 'bg-red-100 text-accent border-red-200' },
  claimed: { label: 'Claimed', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

function Row({ label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-400 w-32 flex-shrink-0">{label}</span>
      <span className="text-gray-800 flex-1">{value}</span>
    </div>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InvoiceLink({ job, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(job.niagawan_invoice_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/api/jobs/${job.job_id}`, {
        niagawan_invoice_url: value.trim() || null,
      });
      onSaved(data.niagawan_invoice_url);
      setEditing(false);
    } catch (err) {
      setError(err.error || 'Could not save the invoice link.');
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://niagawan.com/invoice/..."
          className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={handleSave} disabled={saving} className="text-xs font-semibold text-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-gray-400">Cancel</button>
        {error && <p className="text-xs text-accent w-full">{error}</p>}
      </div>
    );
  }

  if (job.niagawan_invoice_url) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <a href={job.niagawan_invoice_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
          Invoice: <span className="underline underline-offset-2">View in Niagawan ↗</span>
        </a>
        <button onClick={() => { setValue(job.niagawan_invoice_url); setEditing(true); }} className="text-gray-400 hover:text-gray-600 underline">
          Edit
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
      + Add Niagawan invoice link
    </button>
  );
}

function WarrantyCard({ job, onClaimed }) {
  const { warranty } = job;
  const badge = WARRANTY_BADGE[warranty.status];
  const [claiming, setClaiming] = useState(false);
  const [note, setNote] = useState('');
  const [allowExpired, setAllowExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canClaim = warranty.status === 'active' || warranty.status === 'expired';

  async function handleSubmit() {
    if (warranty.status === 'expired' && !allowExpired) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.patch(`/api/jobs/${job.job_id}/warranty-claim`, {
        note: note.trim() || undefined,
        allow_expired: warranty.status === 'expired' ? true : undefined,
      });
      onClaimed(data.warranty);
      setClaiming(false);
      setNote('');
      setAllowExpired(false);
    } catch (err) {
      setError(err.error || 'Could not record the claim.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Shield className="size-4 text-gray-400" />
          Warranty
        </h2>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>{badge.label}</span>
      </div>

      {warranty.status !== 'not_started' && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">From</p>
            <p className="font-medium text-gray-700">{formatDate(warranty.warranty_start_date) || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Until</p>
            <p className="font-medium text-gray-700">{formatDate(warranty.expiry_date) || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Duration</p>
            <p className="font-medium text-gray-700">{warranty.warranty_days} days</p>
          </div>
          {warranty.status === 'active' && warranty.days_remaining !== null && (
            <div>
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="font-medium text-gray-700">
                {warranty.days_remaining} days{warranty.expiry_soon ? ' ⚠️' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {warranty.status === 'not_started' && (
        <p className="text-sm text-gray-500">Starts once the device is marked collected.</p>
      )}

      {warranty.status === 'claimed' && warranty.claim && (
        <div className="border-t border-gray-100 pt-3 text-sm">
          <p className="text-xs text-gray-400">Claimed</p>
          <p className="font-medium text-gray-700">{formatDate(warranty.claim.claimed_at)} · {warranty.claim.claimed_by || '—'}</p>
          {warranty.claim.note && (
            <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{warranty.claim.note}</p>
          )}
        </div>
      )}

      {canClaim && !claiming && (
        <button
          onClick={() => setClaiming(true)}
          className="text-sm font-semibold text-amber-700 border border-amber-200 bg-amber-50 rounded-xl px-4 py-2 hover:bg-amber-100 transition-colors"
        >
          Mark Warranty as Claimed
        </button>
      )}

      {canClaim && claiming && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
          {warranty.status === 'expired' && (
            <label className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100 rounded-lg p-2.5">
              <input type="checkbox" checked={allowExpired} onChange={(e) => setAllowExpired(e.target.checked)} className="mt-0.5" />
              This warranty has expired. I confirm this is a goodwill claim outside the normal window.
            </label>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error && <p className="text-xs text-accent">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || (warranty.status === 'expired' && !allowExpired)}
              className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Confirm Claim'}
            </button>
            <button onClick={() => setClaiming(false)} className="px-4 border border-gray-200 rounded-lg text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusUpdateModal({ job, onClose, onUpdated }) {
  const currentRank = statusRank(job.current_status);
  const forwardOptions = JOB_STATUSES.filter((s) => statusRank(s.value) > currentRank);
  const backwardOptions = JOB_STATUSES.filter((s) => statusRank(s.value) < currentRank);
  const initialMode = forwardOptions.length > 0 ? 'forward' : 'backward';

  const [mode, setMode] = useState(initialMode);
  const [selected, setSelected] = useState((initialMode === 'forward' ? forwardOptions[0] : backwardOptions[backwardOptions.length - 1])?.value ?? '');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [backwardConfirmed, setBackwardConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  function switchMode(next) {
    setMode(next);
    setBackwardConfirmed(false);
    const list = next === 'forward' ? forwardOptions : backwardOptions;
    setSelected(list[0]?.value ?? '');
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (mode === 'backward' && !backwardConfirmed) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('status', selected);
      if (note.trim()) formData.append('note', note.trim());
      formData.append('notify_customer', String(notify));
      if (mode === 'backward') formData.append('allow_backward', 'true');
      if (photoFile) formData.append('photo', photoFile);

      const { data } = await api.patch(`/api/jobs/${job.job_id}/status`, formData);
      onUpdated(data);
    } catch (err) {
      setError(err.error || 'Could not update status.');
    } finally {
      setSubmitting(false);
    }
  }

  const options = mode === 'forward' ? forwardOptions : backwardOptions;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900">Update Job Status</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">New Status</label>
              {mode === 'forward' && backwardOptions.length > 0 && (
                <button onClick={() => switchMode('backward')} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Need to move backward instead?
                </button>
              )}
              {mode === 'backward' && forwardOptions.length > 0 && (
                <button onClick={() => switchMode('forward')} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Cancel backward move
                </button>
              )}
            </div>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {options.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {mode === 'backward' && (
              <label className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                <input type="checkbox" checked={backwardConfirmed} onChange={(e) => setBackwardConfirmed(e.target.checked)} className="mt-0.5" />
                I understand this moves the job backward and will be recorded as a correction on the customer's timeline.
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note for customer (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Appears on the tracking page and WhatsApp notification..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Camera className="size-4 text-gray-400" />
              Proof Photo <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Proof" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1.5 rounded-lg shadow-sm transition-colors"
                >
                  <Trash2 className="size-4 text-accent" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-blue-50/30 transition-colors group"
              >
                <ImagePlus className="size-6 text-gray-300 group-hover:text-primary/50 transition-colors" />
                <span className="text-sm text-gray-400 group-hover:text-gray-600">Tap to attach a proof photo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              onClick={() => setNotify((n) => !n)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${notify ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${notify ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Notify customer via Alia</span>
            </div>
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || !selected || (mode === 'backward' && !backwardConfirmed)}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            {submitting ? 'Updating...' : 'Confirm Update'}
          </button>
          <button onClick={onClose} className="px-5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [warningBanner, setWarningBanner] = useState('');

  const reload = useCallback(async () => {
    const { data } = await api.get(`/api/jobs/${jobId}`);
    setJob(data);
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setLoadError('');
      setJob(null);

      try {
        const { data } = await api.get(`/api/jobs/${jobId}`);
        if (!cancelled) setJob(data);
      } catch (err) {
        if (cancelled) return;
        if (err.code === 'JOB_NOT_FOUND' || err.code === 'FORBIDDEN') setNotFound(true);
        else setLoadError(err.error || 'Something went wrong loading this job.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [jobId]);

  async function handleStatusUpdated(data) {
    setModalOpen(false);
    setWarningBanner(data.notified === false ? (data.warning || 'Customer was not notified automatically.') : '');
    await reload();
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  }

  if (notFound || loadError || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{notFound ? 'Job Not Found' : 'Something Went Wrong'}</h2>
        <p className="text-gray-500 text-sm mb-6">
          {notFound ? `No job record for "${jobId}", or it belongs to another branch.` : loadError}
        </p>
        <button onClick={() => navigate('/admin/jobs')} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white px-4 py-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/admin/jobs')} className="p-1.5 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-200">Job Detail</p>
            <p className="font-mono font-bold">{job.job_id}</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15">{job.current_status_label}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {warningBanner && (
          <div className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
            <span>⚠️ {warningBanner}</span>
            <button onClick={() => setWarningBanner('')} className="text-amber-600 hover:text-amber-800">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="size-4" />
            Update Status
          </button>
          <Link
            to={`/track/${job.job_id}`}
            target="_blank"
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="size-4" />
            View Repair Card
          </Link>
        </div>

        <InvoiceLink job={job} onSaved={(url) => setJob((prev) => ({ ...prev, niagawan_invoice_url: url }))} />

        {/* Job details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          <SectionBlock title="Customer">
            <Row label="Name" value={job.customer_name} />
            <Row label="WhatsApp" value={job.customer_whatsapp} />
          </SectionBlock>
          <SectionBlock title="Device">
            <Row label="Device" value={`${job.device_brand} ${job.device_model}`} />
            <Row label="Issue" value={job.issue_summary} />
          </SectionBlock>
          <SectionBlock title="Assignment">
            <Row label="Branch" value={job.branch_name} />
            <Row label="Technician" value={job.technician_name || '—'} />
            <Row label="Created" value={formatDateTime(job.created_at)} />
            <Row label="Est. Completion" value={job.estimated_completion_date ? formatDate(job.estimated_completion_date) : '—'} />
          </SectionBlock>
        </div>

        <WarrantyCard job={job} onClaimed={(warranty) => setJob((prev) => ({ ...prev, warranty }))} />

        {/* Photos */}
        {job.photos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-3">Intake Photos</h2>
            <div className="flex gap-2 flex-wrap">
              {job.photos.map((p) => (
                <img key={p.photo_url} src={p.photo_url} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-100" />
              ))}
            </div>
          </div>
        )}

        {/* History log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <History className="size-4 text-gray-400" />
            Job History Log
          </h2>
          <div className="space-y-4">
            {job.status_history.length === 0 && <p className="text-sm text-gray-400">No status updates yet.</p>}
            {job.status_history.map((entry, i) => (
              <div key={`${entry.status}-${entry.timestamp}-${i}`} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{entry.status_label}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(entry.timestamp)} · {entry.updated_by_name || '—'}</p>
                  {entry.note && <p className="text-xs text-gray-600 mt-0.5 bg-gray-50 px-2 py-1 rounded-lg">{entry.note}</p>}
                  {entry.photo_url && (
                    <div className="mt-2">
                      <img src={entry.photo_url} alt="Status proof" className="h-24 w-auto rounded-lg border border-gray-200 object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <StatusUpdateModal
          job={job}
          onClose={() => setModalOpen(false)}
          onUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
