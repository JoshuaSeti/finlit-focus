import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveAvatarProfileId(url?: string | null, profileId?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('avatar:')) {
    const id = url.slice('avatar:'.length).trim();
    return UUID_RE.test(id) ? id : null;
  }
  if (profileId && UUID_RE.test(profileId)) return profileId;
  return null;
}

export function useLearnerAvatarUrl(profileId?: string | null, url?: string | null): string | null {
  const targetId = resolveAvatarProfileId(url, profileId);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) {
      setSrc(null);
      return;
    }
    let active = true;
    let objectUrl: string | null = null;

    supabase.functions
      .invoke('learner-avatar', { body: { profileId: targetId } })
      .then(({ data, error }) => {
        if (!active || error || !(data instanceof Blob) || !data.type.startsWith('image/')) {
          if (active) setSrc(null);
          return;
        }
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setSrc(null);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [targetId, url]);

  return src;
}