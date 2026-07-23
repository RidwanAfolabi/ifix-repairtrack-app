import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield, CheckCircle2, XCircle, AlertCircle, Clock,
  ChevronLeft, Search, ArrowRight, User,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { maskWhatsapp } from '../../lib/phone';
import { useLanguage } from '../../hooks/useLanguage';

// warranty.status has no server-provided display label — same rationale as
// the equivalent map on RepairStatusPage. All four states from the contract
// are covered (the Figma export only had three; not_started is new here).
const STATUS_CONFIG = {
  not_started: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'NOT STARTED', labelMs: 'BELUM BERMULA' },
  active: { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', label: 'ACTIVE', labelMs: 'AKTIF' },
  expired: { icon: XCircle, color: 'text-accent', bg: 'bg-red-50', border: 'border-red-200', label: 'EXPIRED', labelMs: 'TAMAT' },
  claimed: { icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'CLAIMED', labelMs: 'TELAH DITUNTUT' },
};

export default function WarrantyPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { language: lang } = useLanguage();
  const [lookupValue, setLookupValue] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!jobId) return undefined;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setLoadError('');
      setData(null);

      try {
        const { data: res } = await api.get(`/api/warranty/${jobId}`);
        if (!cancelled) setData(res);
      } catch (err) {
        if (cancelled) return;
        if (err.code === 'JOB_NOT_FOUND') setNotFound(true);
        else setLoadError(err.error || 'Something went wrong loading this warranty.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [jobId]);

  // ── Lookup form ──────────────────────────────────────────────────────────
  if (!jobId) {
    return (
      <div className="min-h-screen bg-[#FBFBFB]">
        <section className="bg-primary text-white py-14 px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-5">
            <Shield className="size-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {lang === 'en' ? 'Warranty Status' : 'Status Jaminan'}
          </h1>
          <p className="text-blue-200 text-sm max-w-sm mx-auto">
            {lang === 'en'
              ? 'Verify your repair warranty instantly using your job number'
              : 'Semak jaminan pembaikan anda seketika menggunakan nombor kerja anda'}
          </p>
        </section>

        <section className="px-4 -mt-6 pb-12">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const v = lookupValue.trim().toUpperCase();
                if (v) navigate(`/warranty/${v.startsWith('IFX-') ? v : `IFX-${v}`}`);
              }}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'en' ? 'Job Number' : 'Nombor Kerja'}
                </label>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    value={lookupValue}
                    onChange={(e) => setLookupValue(e.target.value)}
                    placeholder="e.g. IFX-00234"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <button type="submit" className="w-full bg-primary text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                  <Shield className="size-4" />
                  {lang === 'en' ? 'Check Warranty' : 'Semak Jaminan'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                <Link to="/track" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1">
                  {lang === 'en' ? 'Track my repair instead' : 'Jejak pembaikan saya sebaliknya'}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <p className="text-gray-400 text-sm">{lang === 'en' ? 'Loading...' : 'Memuatkan...'}</p>
      </div>
    );
  }

  // ── Not found / error ────────────────────────────────────────────────────
  if (notFound || loadError || !data) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {notFound
            ? (lang === 'en' ? 'Warranty Not Found' : 'Jaminan Tidak Dijumpai')
            : (lang === 'en' ? 'Something Went Wrong' : 'Ralat Berlaku')}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {notFound
            ? (lang === 'en' ? `No warranty found for "${jobId}".` : `Tiada jaminan untuk "${jobId}".`)
            : loadError}
        </p>
        <button onClick={() => navigate('/warranty')} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
          {lang === 'en' ? 'Try Again' : 'Cuba Lagi'}
        </button>
      </div>
    );
  }

  // ── Warranty detail ──────────────────────────────────────────────────────
  const { warranty } = data;
  const cfg = STATUS_CONFIG[warranty.status];
  const StatusIcon = cfg.icon;
  const firstName = data.customer_name.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <div className="bg-primary text-white px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/warranty')} className="p-1.5 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-blue-200">{lang === 'en' ? 'Warranty Status' : 'Status Jaminan'}</p>
            <p className="font-mono font-bold text-sm">{data.job_id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Status badge */}
        <div className={`rounded-2xl border p-6 text-center ${cfg.bg} ${cfg.border}`}>
          <StatusIcon className={`size-12 mx-auto mb-3 ${cfg.color}`} />
          <span className={`text-2xl font-black tracking-widest ${cfg.color}`}>
            {lang === 'en' ? cfg.label : cfg.labelMs}
          </span>
          {warranty.status === 'active' && warranty.days_remaining !== null && (
            <div className="mt-3">
              <span className="inline-block bg-green-700 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                {warranty.days_remaining} {lang === 'en' ? 'days remaining' : 'hari berbaki'}
              </span>
              {warranty.expiry_soon && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  ⚠️ {lang === 'en' ? 'Warranty expiring soon — claim before it lapses' : 'Jaminan hampir tamat — tuntut sebelum tamat'}
                </p>
              )}
            </div>
          )}
          {warranty.status === 'not_started' && (
            <p className={`text-sm mt-2 ${cfg.color} opacity-80`}>
              {lang === 'en' ? 'Starts once the device is collected' : 'Bermula sebaik sahaja peranti diambil'}
            </p>
          )}
          <p className="text-sm mt-2 text-gray-600">
            {data.device_brand} {data.device_model}
          </p>
        </div>

        {/* Warranty details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-800">{lang === 'en' ? 'Warranty Details' : 'Butiran Jaminan'}</h2>

          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{lang === 'en' ? 'Registered Customer' : 'Pelanggan Berdaftar'}</p>
              <p className="text-sm font-semibold text-gray-800">
                {firstName} · <span className="font-mono font-normal text-gray-600">{maskWhatsapp(data.customer_whatsapp)}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">{lang === 'en' ? 'Start Date' : 'Tarikh Mula'}</p>
              <p className="font-semibold text-gray-800 mt-0.5">{formatDate(warranty.warranty_start_date) || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{lang === 'en' ? 'Expiry Date' : 'Tarikh Tamat'}</p>
              <p className="font-semibold text-gray-800 mt-0.5">{formatDate(warranty.expiry_date) || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{lang === 'en' ? 'Duration' : 'Tempoh'}</p>
              <p className="font-semibold text-gray-800 mt-0.5">{warranty.warranty_days} {lang === 'en' ? 'days' : 'hari'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{lang === 'en' ? 'Branch' : 'Cawangan'}</p>
              <p className="font-semibold text-gray-800 mt-0.5 text-xs leading-snug">{data.branch_name}</p>
            </div>
          </div>

          {/* Claim details — only once claimed */}
          {warranty.status === 'claimed' && warranty.claim && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                {lang === 'en' ? 'Claim Details' : 'Butiran Tuntutan'}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">{lang === 'en' ? 'Claimed On' : 'Dituntut Pada'}</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{formatDate(warranty.claim.claimed_at) || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{lang === 'en' ? 'Handled By' : 'Dikendalikan Oleh'}</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{warranty.claim.claimed_by || '—'}</p>
                </div>
              </div>
              {warranty.claim.note && (
                <p className="text-xs text-gray-600 mt-3 bg-amber-50/50 rounded-lg px-3 py-2 border border-amber-100 leading-relaxed">
                  {warranty.claim.note}
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="border-t border-gray-100 pt-4">
            <Link
              to={data.repair_card_path}
              className="flex items-center justify-between w-full border border-primary/20 bg-primary/5 text-primary rounded-xl px-4 py-3 text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              <span>{lang === 'en' ? 'View Repair Card / Job Details' : 'Lihat Kad Pembaikan / Butiran Kerja'}</span>
              <ArrowRight className="size-4 flex-shrink-0" />
            </Link>
          </div>
        </div>

        <div className="text-center py-2">
          <p className="text-xs text-gray-400">
            {lang === 'en'
              ? 'Both customers and iFix Express staff can use this page to verify warranty status quickly.'
              : 'Pelanggan dan kakitangan iFix Express boleh menggunakan halaman ini untuk mengesahkan status jaminan dengan cepat.'}
          </p>
        </div>
      </div>
    </div>
  );
}
