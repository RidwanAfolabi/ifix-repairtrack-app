import { Link, Outlet } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { LanguageProvider } from '../context/LanguageContext';
import { useLanguage } from '../hooks/useLanguage';

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
      className="flex items-center gap-1 text-xs text-blue-200 hover:text-white transition-colors"
      title={language === 'en' ? 'Switch language' : 'Tukar bahasa'}
    >
      <Globe className="size-3.5" />
      <span className="uppercase font-semibold">{language}</span>
    </button>
  );
}

// Minimal shell for customer-facing pages — brand colors only, no staff nav.
export default function PublicLayout() {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <header className="bg-primary text-white">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link to="/track" className="font-bold text-lg tracking-tight">
              iFix Express
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-200 font-semibold uppercase tracking-widest">
                RepairTrack
              </span>
              <LanguageToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="bg-gray-900 text-gray-400 text-center text-xs py-6 px-4">
          <p>&copy; {new Date().getFullYear()} iFix Express. All rights reserved.</p>
        </footer>
      </div>
    </LanguageProvider>
  );
}
