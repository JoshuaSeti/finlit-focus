import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RichText } from '@/components/ui/rich-text';
import { ArrowRight, X } from 'lucide-react';

interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
}

const BAR_HEIGHT = 40;

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

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
    document.documentElement.style.setProperty(
      '--announcement-h',
      visible ? `${BAR_HEIGHT}px` : '0px'
    );
    return () => {
      document.documentElement.style.setProperty('--announcement-h', '0px');
    };
  }, [visible]);

  if (!visible || !announcement) return null;

  const content = (
    <div className="flex items-center justify-center gap-2 text-center">
      <div className="inline-flex items-center gap-2 text-sm [&_p]:inline [&_p]:m-0">
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
      className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground"
      style={{ height: BAR_HEIGHT }}
    >
      <div className="container mx-auto px-4 py-2 pr-10 relative">
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
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-primary-foreground/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
