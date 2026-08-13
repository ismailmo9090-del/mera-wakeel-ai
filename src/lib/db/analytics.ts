import { TrustStats } from '../../types/database';
import { supabase } from './client';

export async function fetchTrustStats(): Promise<TrustStats> {
  try {
    const res = await fetch('/api/db/stats/trust');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.stats) return json.stats as TrustStats;
    }
  } catch (err) {
    console.warn('fetchTrustStats proxy notice:', err);
  }
  return { total_consultations: 0, resolved_cases: 0, verified_lawyers: 0, avg_rating: 0 };
}

export async function trackEvent(eventName: string, payload?: Record<string, any>): Promise<void> {
  try {
    const user = supabase?.auth?.getUser();
    let userId: string | null = null;
    try {
      const { data } = await user;
      userId = data?.user?.id || null;
    } catch (_e) { /* not signed in */ }
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: eventName, user_id: userId, payload: payload || {} }),
    });
  } catch (err) {
    console.warn('trackEvent notice:', err);
  }
}
