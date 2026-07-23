import { useEffect, useState } from 'react';
import { Star, Filter, Smartphone } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useLanguage } from '../../hooks/useLanguage';

function StarDisplay({ stars, size = 'sm' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${size === 'lg' ? 'size-6' : 'size-3.5'} ${s <= stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { language: lang } = useLanguage();

  // Seeded once from an unfiltered fetch — GET /api/branches requires staff
  // auth, so the branch dropdown has to be derived from review rows we can
  // actually see rather than a real branch list.
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [starsFilter, setStarsFilter] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, average_rating: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/reviews', { params: { limit: 100 } })
      .then(({ data }) => {
        const seen = new Map();
        data.reviews.forEach((r) => {
          if (!seen.has(r.branch_id)) seen.set(r.branch_id, r.branch_name);
        });
        setBranchOptions(
          [...seen.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch(() => {
        // Non-fatal — the branch filter just won't have options.
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      const params = { limit: 50 };
      if (branchFilter) params.branch_id = branchFilter;
      if (starsFilter) params.stars = starsFilter;

      try {
        const { data } = await api.get('/api/reviews', { params });
        if (cancelled) return;
        setReviews(data.reviews);
        setMeta(data.meta);
      } catch (err) {
        if (!cancelled) setError(err.error || 'Could not load reviews.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [branchFilter, starsFilter]);

  const hasFilters = branchFilter !== '' || starsFilter > 0;

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <section className="bg-primary text-white py-14 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {lang === 'en' ? 'Customer Reviews' : 'Ulasan Pelanggan'}
        </h1>
        <p className="text-blue-200 text-sm max-w-sm mx-auto">
          {lang === 'en'
            ? 'Real experiences from real customers. Transparency by design — no reviews are deleted.'
            : 'Pengalaman sebenar daripada pelanggan sebenar. Telus mengikut reka bentuk — tiada ulasan dihapuskan.'}
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Aggregate */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="text-center flex-shrink-0">
              <p className="text-6xl font-black text-gray-900">
                {meta.average_rating !== null ? meta.average_rating.toFixed(1) : '—'}
              </p>
              <StarDisplay stars={meta.average_rating ? Math.round(meta.average_rating) : 0} size="lg" />
              <p className="text-sm text-gray-400 mt-2">
                {meta.total} {lang === 'en' ? 'reviews' : 'ulasan'}
              </p>
            </div>
            {meta.total === 0 && (
              <div className="flex-1 w-full flex items-center justify-center text-sm text-gray-400 py-4">
                {lang === 'en' ? 'No reviews yet — be the first to leave one from your Repair Card.' : 'Belum ada ulasan — jadilah yang pertama melalui Kad Pembaikan anda.'}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="size-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{lang === 'en' ? 'Filter Reviews' : 'Tapis Ulasan'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">{lang === 'en' ? 'All Branches' : 'Semua Cawangan'}</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={starsFilter}
              onChange={(e) => setStarsFilter(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value={0}>{lang === 'en' ? 'All Ratings' : 'Semua Penilaian'}</option>
              {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} Stars</option>)}
            </select>
            {hasFilters && (
              <button
                onClick={() => { setBranchFilter(''); setStarsFilter(0); }}
                className="text-sm text-accent hover:text-red-700 font-medium px-2"
              >
                {lang === 'en' ? 'Clear' : 'Kosongkan'}
              </button>
            )}
          </div>
          {!loading && (
            <p className="text-xs text-gray-400 mt-3">
              {lang === 'en' ? `Showing ${reviews.length} of ${meta.total} reviews` : `Menunjukkan ${reviews.length} daripada ${meta.total} ulasan`}
            </p>
          )}
        </div>

        {/* Review cards */}
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {lang === 'en' ? 'Loading reviews...' : 'Memuatkan ulasan...'}
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12 text-accent text-sm">{error}</div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Star className="size-10 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">
                {hasFilters
                  ? (lang === 'en' ? 'No reviews match your filters' : 'Tiada ulasan yang sepadan dengan tapisan anda')
                  : (lang === 'en' ? 'No reviews yet' : 'Belum ada ulasan')}
              </p>
            </div>
          )}

          {!loading && !error && reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                {review.device_photo_url ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                    <img src={review.device_photo_url} alt={review.device_type || ''} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="size-6 text-gray-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <StarDisplay stars={review.stars} />
                      {review.device_type && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-primary px-2 py-0.5 rounded-full">
                            <Smartphone className="size-3" />
                            {review.device_type}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{review.branch_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-gray-700 leading-relaxed mt-3">{review.comment}</p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center py-4 text-xs text-gray-400">
          <p>
            {lang === 'en'
              ? 'Reviews are submitted by customers from their Repair Card after repair completion. Staff cannot delete reviews.'
              : 'Ulasan dihantar oleh pelanggan melalui Kad Pembaikan selepas pembaikan selesai. Kakitangan tidak boleh menghapuskan ulasan.'}
          </p>
        </div>
      </div>
    </div>
  );
}
