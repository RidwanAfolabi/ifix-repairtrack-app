import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, TOKEN_STORAGE_KEY } from '../lib/api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On app load, validate any stored token against the API rather than
  // trusting it blindly — a token that looks present may already be expired
  // or belong to a deactivated account.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        if (cancelled) return;
        setStaff(data);

        // GET /api/auth/me doesn't return branch_name (unlike login) — backfill
        // it in the background so the layout doesn't block on a second call.
        api
          .get('/api/branches')
          .then(({ data: branchesData }) => {
            if (cancelled) return;
            const match = branchesData.branches.find((b) => b.id === data.branch_id);
            if (match) {
              setStaff((prev) => (prev ? { ...prev, branch_name: match.name } : prev));
            }
          })
          .catch(() => {
            // Non-fatal — branch name is a display nicety, not required for auth.
          });
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (!cancelled) setStaff(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setStaff(data.staff);
    return data.staff;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setStaff(null);
    navigate('/admin/login');
  }, [navigate]);

  const value = {
    staff,
    loading,
    isAuthenticated: Boolean(staff),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
