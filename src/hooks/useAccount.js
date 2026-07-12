import { useCallback, useEffect, useState } from 'react';

export function useAccount() {
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`Session request failed: ${response.status}`);
      const data = await response.json();
      setUser(data.user || null);
      setPremium(Boolean(data.premium));
      setSubscriptionStatus(data.subscriptionStatus || 'inactive');
      return data;
    } catch (refreshError) {
      console.error(refreshError);
      setUser(null);
      setPremium(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const authenticate = useCallback(async (googleResponse) => {
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: googleResponse.access_token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Входът не беше потвърден.');
      await refresh();
    } catch (authError) {
      setError(authError.message);
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    setActionLoading(true);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    setPremium(false);
    setSubscriptionStatus('inactive');
    setActionLoading(false);
  }, []);

  const openBilling = useCallback(async (path) => {
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch(path, { method: 'POST', credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Stripe страницата не можа да се отвори.');
      window.location.assign(data.url);
    } catch (billingError) {
      setError(billingError.message);
      setActionLoading(false);
    }
  }, []);

  return {
    user,
    premium,
    subscriptionStatus,
    loading,
    actionLoading,
    error,
    authenticate,
    logout,
    refresh,
    subscribe: () => openBilling('/api/billing/checkout'),
    manageBilling: () => openBilling('/api/billing/portal'),
  };
}
