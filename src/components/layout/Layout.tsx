import { useEffect, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AnnouncementBar } from './AnnouncementBar';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [hasAnnouncement, setHasAnnouncement] = useState(false);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data && sessionStorage.getItem('announcement_dismissed') !== data.id) {
          setHasAnnouncement(true);
        }
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <div style={{ paddingTop: hasAnnouncement ? 40 : 0 }}>
        <Header />
      </div>
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
