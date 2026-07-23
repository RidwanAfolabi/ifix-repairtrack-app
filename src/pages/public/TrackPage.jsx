import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Package, Clock, CheckCircle, Smartphone } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const TRACK_TRANSLATIONS = {
  en: {
    'track.hero.tagline': 'Stay updated on your repair — every step of the way',
    'track.input.placeholder': 'e.g. IFX-00234',
    'track.input.label': 'Job Number',
    'track.submit': 'Track My Repair',
    'track.hint': 'Your job number is in your WhatsApp confirmation message or printed on your intake receipt.',
    'track.steps.title': 'How It Works',
    'track.step1': 'Drop off your device at any iFix Express branch',
    'track.step2': 'Receive your job number via WhatsApp from Alia',
    'track.step3': 'Track your repair status anytime, anywhere',
  },
  ms: {
    'track.hero.tagline': 'Sentiasa dikemas kini tentang pembaikan anda — setiap langkah',
    'track.input.placeholder': 'cth. IFX-00234',
    'track.input.label': 'Nombor Kerja',
    'track.submit': 'Jejak Pembaikan Saya',
    'track.hint': 'Nombor kerja anda ada dalam mesej pengesahan WhatsApp anda atau tercetak pada resit pengambilan anda.',
    'track.steps.title': 'Cara Ia Berfungsi',
    'track.step1': 'Hantar peranti anda ke mana-mana cawangan iFix Express',
    'track.step2': 'Terima nombor kerja anda melalui WhatsApp daripada Alia',
    'track.step3': 'Jejak status pembaikan anda bila-bila masa, di mana-mana',
  },
};

export default function TrackPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [jobId, setJobId] = useState('');
  const [error, setError] = useState('');

  const tl = (key) => TRACK_TRANSLATIONS[language][key] || key;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = jobId.trim().toUpperCase();
    if (!trimmed) {
      setError(language === 'en' ? 'Please enter your job number.' : 'Sila masukkan nombor kerja anda.');
      return;
    }
    const normalized = trimmed.startsWith('IFX-') ? trimmed : `IFX-${trimmed}`;
    navigate(`/track/${normalized}`);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      {/* Hero */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
            <Package className="size-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {language === 'en' ? 'Track My Repair' : 'Jejak Pembaikan Saya'}
          </h1>
          <p className="text-xl text-blue-100 font-medium">{tl('track.hero.tagline')}</p>
        </div>
      </section>

      {/* Lookup Card */}
      <section className="px-4 -mt-6">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tl('track.input.label')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    value={jobId}
                    onChange={(e) => { setJobId(e.target.value); setError(''); }}
                    placeholder={tl('track.input.placeholder')}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:font-sans placeholder:text-gray-400"
                  />
                </div>
                {error && <p className="mt-2 text-sm text-accent">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                {tl('track.submit')}
                <ArrowRight className="size-4" />
              </button>
              <p className="text-xs text-gray-500 text-center leading-relaxed">{tl('track.hint')}</p>
            </form>
          </div>

          {/* Warranty check link */}
          <div className="px-6 pb-5 border-t border-gray-50 pt-4">
            <a
              href="/warranty"
              onClick={(e) => { e.preventDefault(); navigate('/warranty'); }}
              className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
            >
              {language === 'en' ? 'Check warranty status instead' : 'Semak status jaminan sebaliknya'}
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-10">
        <div className="max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-gray-800 text-center mb-6">{tl('track.steps.title')}</h2>
          <div className="space-y-4">
            {[
              { icon: Smartphone, text: tl('track.step1'), step: '01' },
              { icon: Package, text: tl('track.step2'), step: '02' },
              { icon: CheckCircle, text: tl('track.step3'), step: '03' },
            ].map(({ icon: Icon, text, step }) => (
              <div key={step} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center">
                  <Icon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary/50 uppercase tracking-widest">Step {step}</span>
                  <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="px-4 pb-12">
        <div className="max-w-lg mx-auto bg-whatsapp/8 border border-whatsapp/20 rounded-2xl p-6 text-center">
          <Clock className="size-6 text-whatsapp mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-800 mb-1">
            {language === 'en' ? 'Need help? Contact us on WhatsApp' : 'Perlukan bantuan? Hubungi kami di WhatsApp'}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {language === 'en' ? 'Our team responds within minutes during business hours' : 'Pasukan kami menjawab dalam beberapa minit semasa waktu perniagaan'}
          </p>
          <a
            href="https://wa.me/60175492649"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-whatsapp text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#20b557] transition-colors"
          >
            WhatsApp Us
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
