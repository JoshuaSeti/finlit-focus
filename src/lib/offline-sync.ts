import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { touchStreak } from '@/lib/streak';

interface QueuedProgress {
  userId: string;
  slug: string;
  progress: any;
  summary: {
    sections_done: number;
    sections_total: number;
    quiz_correct: number | null;
    quiz_total: number | null;
    complete: boolean;
  };
  timestamp: number;
}

const QUEUE_KEY = 'finlit_offline_progress_queue';

function getQueue(): QueuedProgress[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedProgress[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function flushOfflineQueue(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const queue = getQueue();
  if (queue.length === 0) return true;

  const remaining: QueuedProgress[] = [];

  for (const item of queue) {
    try {
      const { data: existing } = await supabase
        .from('module_progress')
        .select('completed_at')
        .eq('user_id', item.userId)
        .eq('module_slug', item.slug)
        .maybeSingle();

      const { error } = await supabase.from('module_progress').upsert({
        user_id: item.userId,
        module_slug: item.slug,
        progress: item.progress,
        sections_done: item.summary.sections_done,
        sections_total: item.summary.sections_total,
        quiz_correct: item.summary.quiz_correct,
        quiz_total: item.summary.quiz_total,
        completed_at: existing?.completed_at ?? (item.summary.complete ? new Date(item.timestamp).toISOString() : null),
      }, { onConflict: 'user_id,module_slug' });

      if (error) throw error;

      if (item.summary.complete && !existing?.completed_at) {
        touchStreak().catch(() => {});
        await supabase.from('module_events').insert({
          user_id: item.userId,
          module_slug: item.slug,
          kind: 'module_complete',
          payload: { quiz_correct: item.summary.quiz_correct, quiz_total: item.summary.quiz_total },
        });
        await supabase.rpc('story_fire_lesson' as never, { p_lesson: item.slug.replace(/^module-/, '') } as never);
      }
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  window.dispatchEvent(new CustomEvent('finlit-sync-status', { detail: { pending: remaining.length } }));
  return remaining.length === 0;
}

/** Saves progress to Supabase if online, or queues locally if offline/failed. */
export async function syncOrQueueProgress(
  userId: string,
  slug: string,
  progress: any,
  summary: QueuedProgress['summary']
) {
  // Always write to local storage first for instant resume
  try {
    localStorage.setItem(`finlit-progress-${slug}`, JSON.stringify(progress));
  } catch {}

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueItem();
    return;
  }

  try {
    const { data: existing } = await supabase
      .from('module_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('module_slug', slug)
      .maybeSingle();

    const { error } = await supabase.from('module_progress').upsert({
      user_id: userId,
      module_slug: slug,
      progress: progress,
      sections_done: summary.sections_done,
      sections_total: summary.sections_total,
      quiz_correct: summary.quiz_correct,
      quiz_total: summary.quiz_total,
      completed_at: existing?.completed_at ?? (summary.complete ? new Date().toISOString() : null),
    }, { onConflict: 'user_id,module_slug' });

    if (error) throw error;

    if (summary.complete && !existing?.completed_at) {
      touchStreak().catch(() => {});
      await supabase.from('module_events').insert({
        user_id: userId,
        module_slug: slug,
        kind: 'module_complete',
        payload: { quiz_correct: summary.quiz_correct, quiz_total: summary.quiz_total },
      });
      await supabase.rpc('story_fire_lesson' as never, { p_lesson: slug.replace(/^module-/, '') } as never);
    }
  } catch {
    queueItem();
  }

  function queueItem() {
    const q = getQueue();
    const idx = q.findIndex(i => i.userId === userId && i.slug === slug);
    const item: QueuedProgress = { userId, slug, progress, summary, timestamp: Date.now() };
    if (idx >= 0) q[idx] = item;
    else q.push(item);
    saveQueue(q);
    window.dispatchEvent(new CustomEvent('finlit-sync-status', { detail: { pending: q.length } }));
  }
}

/** React hook for online/offline connectivity and pending sync counts. */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(() => getQueue().length);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      flushOfflineQueue().then(() => setPendingCount(getQueue().length));
    };
    const onOffline = () => setIsOnline(false);
    const onStatus = (e: any) => setPendingCount(e.detail?.pending ?? getQueue().length);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('finlit-sync-status', onStatus);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('finlit-sync-status', onStatus);
    };
  }, []);

  return { isOnline, pendingCount };
}
