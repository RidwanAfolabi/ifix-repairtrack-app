import { useCallback, useMemo, useState } from 'react';
import { LanguageContext } from './language-context';

const STORAGE_KEY = 'repairtrack_language';

function initialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'ms' ? 'ms' : 'en';
}

// Deliberately minimal — no t()/dictionary layer, matching how the ported
// Figma Make pages already do inline `language === 'en' ? ... : ...` text.
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(initialLanguage);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
