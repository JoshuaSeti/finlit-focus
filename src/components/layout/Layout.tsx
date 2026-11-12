import { Header } from './Header';
import { Footer } from './Footer';
import { AnnouncementBar } from './AnnouncementBar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main
        className="flex-1"
        style={{ paddingTop: 'calc(5rem + var(--announcement-h, 0px))' }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
