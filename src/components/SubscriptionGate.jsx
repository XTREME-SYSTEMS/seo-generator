import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

export default function SubscriptionGate() {
  const [state, setState] = useState('loading'); // loading | granted | denied

  useEffect(() => {
    async function check() {
      try {
        const { data: user } = await base44.auth.me();
        if (!user) { setState('denied'); return; }
        // Check by user_id first, then by email as fallback
        let subs = await base44.entities.Subscription.filter({ user_id: user.id });
        let active = subs.find((s) => s.status === 'active' || s.status === 'trialing');
        if (!active && user.email) {
          subs = await base44.entities.Subscription.filter({ customer_email: user.email });
          active = subs.find((s) => s.status === 'active' || s.status === 'trialing');
          // Link the subscription to this user's ID for future lookups
          if (active && !active.user_id) {
            await base44.entities.Subscription.update(active.id, { user_id: user.id });
          }
        }
        setState(active ? 'granted' : 'denied');
      } catch {
        setState('denied');
      }
    }
    check();
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFD700] border-t-transparent" />
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to="/pricing" replace />;
  }

  return <Outlet />;
}