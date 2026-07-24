import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, CheckCircle2, ChevronLeft, Copy, Printer, ExternalLink, Info, X, MessageSquare, Bot, User } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const DEVICE_BRANDS = ['Apple', 'Samsung', 'Huawei', 'Oppo', 'Vivo', 'Xiaomi', 'Realme', 'OnePlus', 'Other'];
const WARRANTY_PRESETS = [7, 14, 30, 60, 90];
const MAX_PHOTOS = 3;

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white';

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-accent mt-1">{error}</p>}
    </div>
  );
}

// The template below was confirmed with the user (bilingual EN/MS) before
// being hardcoded here — this is the actual message sent to real customers.
function buildWhatsappMessage({ customer_name, device_label, job_id, branch_name, repair_card_url }) {
  return (
    `Hi ${customer_name}, your ${device_label} repair (Job No: ${job_id}) has been received at our ${branch_name} branch. ` +
    `Track your repair status here: ${repair_card_url}\n\n` +
    `Pembaikan ${device_label} anda (No. Kerja: ${job_id}) telah diterima di cawangan ${branch_name}. ` +
    `Jejak status pembaikan anda di sini: ${repair_card_url}`
  );
}

function SuccessScreen({ data, onReset }) {
  const [copied, setCopied] = useState(false);
  const deviceLabel = `${data.device_brand} ${data.device_model}`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(data.repair_card_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waMessage = buildWhatsappMessage({
    customer_name: data.customer_name,
    device_label: deviceLabel,
    job_id: data.job_id,
    branch_name: data.branch_name,
    repair_card_url: data.repair_card_url,
  });
  const waLink = `https://wa.me/${data.customer_whatsapp}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Job Created</h2>
          <p className="text-sm text-gray-500">{data.customer_name}&apos;s {deviceLabel} is registered in RepairTrack.</p>
        </div>

        <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Job ID</p>
          <span className="font-mono text-2xl font-black text-primary">{data.job_id}</span>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-2">
          <p className="flex-1 text-xs font-mono text-gray-600 truncate text-left">{data.repair_card_url}</p>
          <button onClick={handleCopy} className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Copy className={`size-4 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* PRIMARY: pure client-side wa.me link — no backend call involved */}
        <div className="space-y-1.5 mb-5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-whatsapp hover:bg-[#20b557] text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-md"
          >
            <svg className="size-5 fill-white flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share Repair Card on WhatsApp
          </a>
          <p className="text-xs text-center text-gray-400">
            Opens WhatsApp with the message ready — review before sending
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          <button onClick={handleCopy} className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
            <Copy className="size-4" />
            {copied ? 'Copied!' : 'Copy Repair Card Link'}
          </button>
          <button onClick={() => window.print()} className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
            <Printer className="size-4" />
            Print Intake Receipt
          </button>
          <Link
            to={`/track/${data.job_id}`}
            target="_blank"
            className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="size-4" />
            View Repair Card (preview what customer sees)
          </Link>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Reminder:</span> Remember to share the invoice separately via Niagawan&apos;s own WhatsApp share button, as usual — that stays unchanged.
          </p>
        </div>

        <button onClick={onReset} className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
          + Create Another Job
        </button>
      </div>
    </div>
  );
}

export default function NewJobPage() {
  const navigate = useNavigate();
  const { staff } = useAuth();
  const fileRef = useRef(null);

  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    customerWhatsapp: '',
    customerName: '',
    deviceBrand: '',
    deviceBrandOther: '',
    deviceModel: '',
    issueSummary: '',
    technicianName: '',
    estimatedCompletionDate: '',
    warrantyPreset: 30,
    warrantyCustomDays: '',
    niagawanInvoiceUrl: '',
  });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    if (files.length === 0) return;
    setPhotos((prev) => [...prev, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
    e.target.value = '';
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setFieldErrors({});

    const warrantyDays = form.warrantyPreset === 'custom'
      ? Number(form.warrantyCustomDays)
      : form.warrantyPreset;

    const formData = new FormData();
    formData.append('customer_name', form.customerName.trim());
    formData.append('customer_whatsapp', form.customerWhatsapp.trim());
    formData.append('device_brand', (form.deviceBrand === 'Other' ? form.deviceBrandOther : form.deviceBrand).trim());
    formData.append('device_model', form.deviceModel.trim());
    formData.append('issue_summary', form.issueSummary.trim());
    if (form.technicianName.trim()) formData.append('technician_name', form.technicianName.trim());
    formData.append('warranty_days', String(warrantyDays));
    if (form.estimatedCompletionDate) formData.append('estimated_completion_date', form.estimatedCompletionDate);
    if (form.niagawanInvoiceUrl.trim()) formData.append('niagawan_invoice_url', form.niagawanInvoiceUrl.trim());
    photos.forEach((p) => formData.append('photos', p.file));

    try {
      const { data } = await api.post('/api/jobs', formData);
      setSuccess(data);
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      setSubmitError(err.error || 'Could not create the job.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <SuccessScreen data={success} onReset={() => { setSuccess(null); setForm((f) => ({ ...f })); setPhotos([]); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/admin/jobs')} className="p-1.5 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="size-5" />
          </button>
          <div>
            <p className="text-xs text-blue-200">iFix RepairTrack</p>
            <h1 className="font-bold">New Job Intake</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info className="size-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Before filling this form:</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Complete the job in <strong>Niagawan</strong> first (records service, parts, invoice). Then copy the Niagawan shareable invoice link and paste it below — this is optional at intake and can be added later from the Job Detail page instead.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <Section title="Customer" icon="👤">
          <Field label="Customer WhatsApp Number" required error={fieldErrors.customer_whatsapp}>
            <input
              type="tel"
              required
              value={form.customerWhatsapp}
              onChange={(e) => update('customerWhatsapp', e.target.value)}
              placeholder="e.g. 012-345 6789"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">Any Malaysian mobile format works — normalized automatically, and used to pre-fill the WhatsApp message after creation</p>
          </Field>
          <Field label="Customer Name" required error={fieldErrors.customer_name}>
            <input type="text" required value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="Full name" className={inputCls} />
          </Field>
        </Section>

        <Section title="Device" icon="📱">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand" required error={fieldErrors.device_brand}>
              <select required value={form.deviceBrand} onChange={(e) => update('deviceBrand', e.target.value)} className={inputCls}>
                <option value="">Select</option>
                {DEVICE_BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Model" required error={fieldErrors.device_model}>
              <input type="text" required value={form.deviceModel} onChange={(e) => update('deviceModel', e.target.value)} placeholder="e.g. iPhone 14 Pro" className={inputCls} />
            </Field>
          </div>
          {form.deviceBrand === 'Other' && (
            <Field label="Specify Brand" required>
              <input type="text" required value={form.deviceBrandOther} onChange={(e) => update('deviceBrandOther', e.target.value)} placeholder="Brand name" className={inputCls} />
            </Field>
          )}
          <Field label="Reported Issue" required error={fieldErrors.issue_summary}>
            <textarea required value={form.issueSummary} onChange={(e) => update('issueSummary', e.target.value)} placeholder="What the customer reported..." className={inputCls + ' h-20 resize-none'} />
          </Field>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Device Photos <span className="text-xs font-normal text-gray-400">(optional, up to {MAX_PHOTOS})</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
            <div className="flex gap-2 flex-wrap">
              {photos.map((p, i) => (
                <div key={p.previewUrl} className="relative w-20 h-20">
                  <img src={p.previewUrl} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:bg-gray-50"
                  >
                    <X className="size-3.5 text-gray-500" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/30 hover:bg-blue-50/30 transition-colors"
                >
                  <Camera className="size-5 text-gray-300" />
                  <span className="text-[10px] text-gray-400">Add photo</span>
                </button>
              )}
            </div>
          </div>
        </Section>

        <Section title="Assignment & Schedule" icon="🔧">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch">
              <div className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'}>
                {staff?.branch_name || `Branch #${staff?.branch_id ?? '—'}`}
              </div>
              <p className="text-xs text-gray-400 mt-1">Auto-filled from your login</p>
            </Field>
            <Field label="Technician">
              <input type="text" value={form.technicianName} onChange={(e) => update('technicianName', e.target.value)} placeholder="Who's handling this repair" className={inputCls} />
            </Field>
            <Field label="Est. Completion Date" error={fieldErrors.estimated_completion_date}>
              <input type="date" value={form.estimatedCompletionDate} onChange={(e) => update('estimatedCompletionDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Warranty Period" error={fieldErrors.warranty_days}>
              <select
                value={form.warrantyPreset}
                onChange={(e) => update('warrantyPreset', e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                className={inputCls}
              >
                {WARRANTY_PRESETS.map((d) => <option key={d} value={d}>{d} days{d === 30 ? ' (default)' : ''}</option>)}
                <option value="custom">Custom</option>
              </select>
              {form.warrantyPreset === 'custom' && (
                <input
                  type="number"
                  min="0"
                  required
                  value={form.warrantyCustomDays}
                  onChange={(e) => update('warrantyCustomDays', e.target.value)}
                  placeholder="Number of days"
                  className={inputCls + ' mt-2'}
                />
              )}
            </Field>
          </div>
        </Section>

        <Section title="Invoice Link" icon="🔗">
          <Field label="Niagawan Invoice Link" error={fieldErrors.niagawan_invoice_url}>
            <input
              type="url"
              value={form.niagawanInvoiceUrl}
              onChange={(e) => update('niagawanInvoiceUrl', e.target.value)}
              placeholder="Paste shareable invoice link from Niagawan"
              className={inputCls + ' font-mono text-xs'}
            />
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Optional now — often generated after intake and attached later from the Job Detail page.
            </p>
          </Field>
        </Section>

        {/* Static explainer — illustrative only, no data dependency. Reinforces
            the "two separate senders" rule from CLAUDE.md so staff don't
            confuse the manual share button below with Alia's automatic
            status-update notifications. */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <MessageSquare className="size-4 text-whatsapp" />
            <h2 className="font-bold text-gray-800 text-sm">WhatsApp Notification Flow</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  <User className="size-3" /> Manual (Staff-Sent)
                </span>
              </div>
              <div className="bg-whatsapp/8 border border-whatsapp/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-whatsapp flex items-center justify-center flex-shrink-0">
                    <svg className="size-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">iFix Express (Branch) · Staff WhatsApp</p>
                    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-700 leading-relaxed shadow-sm">
                      Hi [Customer], your [Device] repair (Job No: IFX-XXXXX) has been received at our [Branch] branch. Track your repair status here: [link]
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2.5 pl-12 leading-relaxed">
                  <span className="font-semibold text-gray-700">Staff-initiated.</span> Sent by tapping &ldquo;Share on WhatsApp&rdquo; on the success screen below. Staff review the message in WhatsApp before pressing Send — nothing happens automatically.
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest flex-shrink-0">then, on status updates</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  <Bot className="size-3" /> Automatic (Alia-Sent)
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white text-xs font-black">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">Alia · iFix Express Bot</p>
                    <div className="bg-white border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-gray-700 leading-relaxed shadow-sm">
                      Great news, [Customer]! ✅ Your [Device] is ready for collection at [Branch]. View details: [link] — Alia, iFix Express
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2.5 pl-12 leading-relaxed">
                  <span className="font-semibold text-gray-700">Automatic.</span> Triggered when staff update the job&apos;s status on the Job Detail page, only if the &ldquo;Notify customer via Alia&rdquo; toggle is on.
                </p>
              </div>
            </div>
          </div>
        </div>

        {submitError && <p className="text-sm text-accent text-center">{submitError}</p>}

        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Job'}
          </button>
          <button type="button" onClick={() => navigate('/admin/jobs')} className="px-5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
