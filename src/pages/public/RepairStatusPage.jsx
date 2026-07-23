import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, MapPin, User, Clock, Smartphone,
  ExternalLink, Shield, Star, ChevronLeft, ChevronRight, Share2,
  Phone, Navigation,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/format';
import { useLanguage } from '../../hooks/useLanguage';

// warranty.status has no server-provided display label (unlike job
// current_status_label / status_label) — this is a small, fixed 4-value map,
// not a duplicate of anything the API already sends.
const WARRANTY_BADGE = {
  active: { label: 'ACTIVE', labelMs: 'AKTIF', color: 'bg-green-100 text-green-700 border-green-200' },
  expired: { label: 'EXPIRED', labelMs: 'TAMAT', color: 'bg-red-100 text-accent border-red-200' },
  claimed: { label: 'CLAIMED', labelMs: 'TELAH DITUNTUT', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

function DevicePhotoGallery({ photos, deviceModel }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="w-full h-52 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-300">
        <Smartphone className="size-8 mb-2" />
        <p className="text-xs text-gray-400">No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div
          className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
          onClick={() => setLightbox(true)}
        >
          <img src={photos[active]} alt={`${deviceModel} photo ${active + 1}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {photos.length > 1 && (
            <>
              <span className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                {active + 1} / {photos.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + photos.length) % photos.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % photos.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2">
            {photos.map((photo, i) => (
              <button
                key={photo}
                onClick={() => setActive(i)}
                className={`flex-1 h-16 rounded-lg overflow-hidden border-2 transition-colors ${active === i ? 'border-primary' : 'border-transparent'}`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setLightbox(false)}>
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + photos.length) % photos.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <img src={photos[active]} alt={deviceModel} className="max-h-[85vh] max-w-full rounded-xl shadow-2xl" />
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % photos.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

function ReviewForm({ jobId, deviceType, lang }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (result) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-2">🎉</div>
        <p className="font-semibold text-gray-800">
          {result.edited
            ? (lang === 'en' ? 'Your review has been updated!' : 'Ulasan anda telah dikemas kini!')
            : (lang === 'en' ? 'Thanks for your review!' : 'Terima kasih atas ulasan anda!')}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {lang === 'en' ? 'Your feedback helps others choose iFix Express.' : 'Maklum balas anda membantu orang lain memilih iFix Express.'}
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/api/reviews', {
        job_id: jobId,
        stars: rating,
        comment: comment.trim() || undefined,
        device_type: deviceType || undefined,
      });
      setResult({ edited: Boolean(data.edited) });
    } catch (err) {
      setError(err.error || (lang === 'en' ? 'Could not submit your review — please try again.' : 'Gagal menghantar ulasan — sila cuba lagi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center">
        {lang === 'en' ? 'Your honest review helps other customers choose iFix Express' : 'Ulasan jujur anda membantu pelanggan lain memilih iFix Express'}
      </p>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star className={`size-11 ${(hover || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} transition-colors`} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-center text-sm font-medium text-amber-600">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {lang === 'en' ? 'Leave a comment (optional)' : 'Tinggalkan komen (pilihan)'}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={lang === 'en'
            ? 'Share your experience — what went well, or what could be improved...'
            : 'Kongsi pengalaman anda — apa yang baik, atau apa yang boleh diperbaiki...'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-24 leading-relaxed"
        />
      </div>
      {error && <p className="text-sm text-accent text-center">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
          rating > 0 && !submitting ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {submitting
          ? (lang === 'en' ? 'Submitting...' : 'Menghantar...')
          : rating === 0
            ? (lang === 'en' ? 'Select a star rating first' : 'Pilih penilaian bintang dahulu')
            : (lang === 'en' ? 'Submit Review' : 'Hantar Ulasan')}
      </button>
    </div>
  );
}

export default function RepairStatusPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { language: lang } = useLanguage();

  const [job, setJob] = useState(null);
  const [warranty, setWarranty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setLoadError('');
      setJob(null);
      setWarranty(null);

      // Fired together — warranty is a separate endpoint from the track
      // response, not a dependent follow-up call.
      const trackPromise = api.get(`/api/track/${jobId}`);
      const warrantyPromise = api.get(`/api/warranty/${jobId}`).catch(() => null);

      try {
        const { data } = await trackPromise;
        if (!cancelled) setJob(data);
      } catch (err) {
        if (cancelled) return;
        if (err.code === 'JOB_NOT_FOUND') setNotFound(true);
        else setLoadError(err.error || 'Something went wrong loading this job.');
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Independent, best-effort — the Repair Card still works without it.
      const warrantyRes = await warrantyPromise;
      if (!cancelled && warrantyRes) setWarranty(warrantyRes.data.warranty);
    }

    load();
    return () => { cancelled = true; };
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <p className="text-gray-400 text-sm">{lang === 'en' ? 'Loading...' : 'Memuatkan...'}</p>
      </div>
    );
  }

  if (notFound || loadError || !job) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Smartphone className="size-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {notFound
            ? (lang === 'en' ? 'Job Not Found' : 'Kerja Tidak Dijumpai')
            : (lang === 'en' ? 'Something Went Wrong' : 'Ralat Berlaku')}
        </h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          {notFound
            ? (lang === 'en'
                ? `We couldn't find a repair job for "${jobId}". Check your job number and try again.`
                : `Kami tidak dapat mencari kerja pembaikan untuk "${jobId}". Semak nombor kerja anda dan cuba lagi.`)
            : loadError}
        </p>
        <button onClick={() => navigate('/track')} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
          {lang === 'en' ? 'Try Again' : 'Cuba Lagi'}
        </button>
      </div>
    );
  }

  const photos = job.photos.map((p) => p.photo_url);
  const firstName = job.customer_name.split(' ')[0];
  const wBadge = warranty && warranty.status !== 'not_started' ? WARRANTY_BADGE[warranty.status] : null;

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      {/* Header bar */}
      <div className="bg-primary text-white px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/track')} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-200">{lang === 'en' ? 'Repair Card' : 'Kad Pembaikan'}</p>
            <p className="font-mono font-bold text-sm tracking-wide">{job.job_id}</p>
          </div>
          <button
            onClick={() => navigator.share?.({ title: `iFix RepairTrack — ${job.job_id}`, url: window.location.href })}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* SECTION A — Job Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {lang === 'en' ? 'Hi' : 'Hai'}, <span className="font-bold text-gray-900">{firstName}!</span>
              </p>
              <p className="font-bold text-primary text-lg mt-0.5">{job.device_brand} {job.device_model}</p>
              <p className="text-gray-500 text-sm">{job.issue_summary}</p>
            </div>

            <DevicePhotoGallery photos={photos} deviceModel={job.device_model} />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="size-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{lang === 'en' ? 'Branch' : 'Cawangan'}</p>
                  <p className="text-sm font-medium text-gray-700 leading-snug">
                    {job.branch.name}<br /><span className="text-gray-400 text-xs">{job.branch.city}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="size-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{lang === 'en' ? 'Technician' : 'Juruteknik'}</p>
                  <p className="text-sm font-medium text-gray-700">{job.technician_name || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="size-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{lang === 'en' ? 'Est. Completion' : 'Anggaran Siap'}</p>
                  <p className="text-sm font-medium text-gray-700">
                    {job.estimated_completion_date ? formatDate(job.estimated_completion_date) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Smartphone className="size-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{lang === 'en' ? 'Job ID' : 'ID Kerja'}</p>
                  <span className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{job.job_id}</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-flex items-center text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {job.current_status_label}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION B — Status Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
            {lang === 'en' ? 'Repair Progress' : 'Kemajuan Pembaikan'}
          </h2>
          <div>
            {job.status_history.length === 0 && (
              <p className="text-sm text-gray-400">
                {lang === 'en' ? 'No status updates yet.' : 'Belum ada kemas kini status.'}
              </p>
            )}
            {job.status_history.map((entry, idx) => {
              const isLast = idx === job.status_history.length - 1;
              return (
                <div key={`${entry.status}-${entry.timestamp}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLast ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-green-500 text-white'
                    }`}>
                      {isLast ? <span className="w-3 h-3 rounded-full bg-white animate-pulse" /> : <CheckCircle2 className="size-5" />}
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 min-h-[1.5rem] my-1 bg-green-300" />}
                  </div>
                  <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
                    <p className={`font-semibold text-sm ${isLast ? 'text-primary' : 'text-gray-800'}`}>
                      {entry.status_label}
                      {isLast && (
                        <span className="ml-2 text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {lang === 'en' ? 'Current' : 'Semasa'}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(entry.timestamp)}</p>
                    {entry.note && (
                      <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">
                        {entry.note}
                      </p>
                    )}
                    {entry.photo_url && (
                      <img src={entry.photo_url} alt="" className="mt-2 w-20 h-20 rounded-lg object-cover border border-gray-100" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION C — Invoice & Warranty */}
        {(job.niagawan_invoice_url || warranty) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {lang === 'en' ? 'Invoice & Warranty' : 'Invois & Jaminan'}
            </h2>

            {job.niagawan_invoice_url && (
              <a
                href={job.niagawan_invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-primary text-white rounded-xl px-4 py-3.5 hover:bg-primary/90 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-sm">{lang === 'en' ? 'View Invoice' : 'Lihat Invois'}</p>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {lang === 'en' ? 'Opens your official invoice (Niagawan)' : 'Buka invois rasmi anda (Niagawan)'}
                  </p>
                </div>
                <ExternalLink className="size-4 text-blue-200 flex-shrink-0" />
              </a>
            )}

            {warranty && warranty.status === 'not_started' && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center gap-3">
                <Shield className="size-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  {lang === 'en'
                    ? 'Warranty begins once your device is collected.'
                    : 'Jaminan bermula sebaik sahaja peranti anda diambil.'}
                </p>
              </div>
            )}

            {warranty && wBadge && (
              <div className={`rounded-xl border p-4 ${
                warranty.status === 'active' ? 'bg-green-50 border-green-100' :
                warranty.status === 'expired' ? 'bg-red-50 border-red-100' :
                'bg-amber-50 border-amber-100'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className={`size-4 ${
                      warranty.status === 'active' ? 'text-green-600' :
                      warranty.status === 'expired' ? 'text-accent' : 'text-amber-600'
                    }`} />
                    <span className="font-semibold text-sm text-gray-800">
                      {warranty.warranty_days}{lang === 'en' ? '-Day Warranty' : ' Hari Jaminan'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${wBadge.color}`}>
                      {lang === 'en' ? wBadge.label : wBadge.labelMs}
                    </span>
                    {warranty.status === 'active' && warranty.days_remaining !== null && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        {warranty.days_remaining} {lang === 'en' ? 'days remaining' : 'hari berbaki'}
                      </p>
                    )}
                    {warranty.expiry_soon && (
                      <p className="text-xs text-amber-600 mt-0.5">⚠️ {lang === 'en' ? 'Expiring soon!' : 'Hampir tamat!'}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">{lang === 'en' ? 'From' : 'Dari'}</p>
                    <p className="font-medium text-gray-700">{formatDate(warranty.warranty_start_date) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{lang === 'en' ? 'Until' : 'Hingga'}</p>
                    <p className="font-medium text-gray-700">{formatDate(warranty.expiry_date) || '—'}</p>
                  </div>
                </div>
                <Link
                  to={`/warranty/${job.job_id}`}
                  className="mt-3 block text-xs font-semibold text-center py-2 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                >
                  {lang === 'en' ? 'Check Full Warranty Details →' : 'Semak Butiran Jaminan Penuh →'}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SECTION D — Rate Your Experience (always visible) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
            <Star className="size-3.5 text-amber-400" />
            {lang === 'en' ? 'Rate Your Experience' : 'Nilaikan Pengalaman Anda'}
          </h2>
          <ReviewForm jobId={job.job_id} deviceType={`${job.device_brand} ${job.device_model}`} lang={lang} />
        </div>

        {/* SECTION E — Footer CTA */}
        <div className="bg-primary rounded-2xl p-5 text-white space-y-3">
          <p className="font-semibold text-sm">
            {lang === 'en' ? 'Need help? Contact your branch directly.' : 'Perlukan bantuan? Hubungi cawangan anda terus.'}
          </p>
          <p className="text-xs text-blue-200 leading-relaxed">{job.branch.address}</p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href={`https://wa.me/${job.branch.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-whatsapp text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#20b557] transition-colors"
            >
              <Phone className="size-4" />
              {lang === 'en' ? 'WhatsApp Branch' : 'WhatsApp Cawangan'}
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(job.branch.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white/15 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-colors"
            >
              <Navigation className="size-4" />
              {lang === 'en' ? 'Get Directions' : 'Dapatkan Arah'}
            </a>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
            <span className="text-lg">💬</span>
            <p className="text-xs text-blue-100 leading-relaxed">
              {lang === 'en'
                ? 'Save our WhatsApp number so you never miss a repair update from Alia!'
                : 'Simpan nombor WhatsApp kami supaya anda tidak terlepas kemas kini pembaikan daripada Alia!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
