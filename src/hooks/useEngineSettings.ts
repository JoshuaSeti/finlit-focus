import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_SETTINGS } from '@/lib/learning/engine';
import type { EngineSettings } from '@/lib/learning/types';

export function useEngineSettings() {
  const [settings, setSettings] = useState<EngineSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('engine_settings').select('*').limit(1).maybeSingle();
    setSettings(
      data
        ? ({ ...DEFAULT_SETTINGS, ...data, tier_weights: (data.tier_weights as Record<string, number>) ?? DEFAULT_SETTINGS.tier_weights } as EngineSettings)
        : ({ id: '', ...DEFAULT_SETTINGS } as EngineSettings),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, isLoading, reload: load };
}
