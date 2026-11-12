import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RichText } from '@/components/ui/rich-text';
import { ArrowRight, X } from 'lucide-react';

interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
}


export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, message, link_url, link_label')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const dismissedId = sessionStorage.getItem('announcement_dismissed');
          if (dismissedId === data.id) setDismissed(true);
          setAnnouncement(data);
        }
      });
  }, []);

  const visible = !!announcement && !dismissed;

  useEffect(() => {
    const root = document.documentElement;
    const el = barRef.current;
    if (!visible || !el) {
      root.style.setProperty('--announcement-h', '0px');
      return;
    }
    const update = () => root.style.setProperty('--announcement-h', `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--announcement-h', '0px');
    };
  }, [visible, announcement]);

  if (!visible || !announcement) return null;

  const content = (
    <div className="flex items-center justify-center text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs sm:text-sm leading-snug break-words min-w-0 [&_p]:inline [&_p]:m-0">
        <RichText html={announcement.message} className="prose-sm prose-invert !max-w-none" />
        {announcement.link_url && (
          <span className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            {announcement.link_label || 'Learn more'}
            <ArrowRight size={14} />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground"
    >
      <div className="container mx-auto pl-4 pr-11 py-2 relative">
        {announcement.link_url ? (
          <a
            href={announcement.link_url}
            target={announcement.link_url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="block hover:opacity-90 transition-opacity"
          >
            {content}
          </a>
        ) : (
          content
        )}
        <button
          aria-label="Dismiss announcement"
          onClick={() => {
            sessionStorage.setItem('announcement_dismissed', announcement.id);
            setDismissed(true);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-primary-foreground/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
