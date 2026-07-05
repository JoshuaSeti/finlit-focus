import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Images, 
  FileText, 
  MessageSquare, 
  Menu, 
  X,
  Home,
  Users,
  BookOpen,
  Bell,
  FolderOpen,
  Shield,
  UsersRound,
  GraduationCap,
  ClipboardList,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import finlitLogo from '@/assets/finlit-logo.png';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Carousel', href: '/admin/carousel', icon: Images },
  { name: 'Blog Posts', href: '/admin/blogs', icon: FileText },
  { name: 'Contact Forms', href: '/admin/contacts', icon: MessageSquare },
  { name: 'Facilitators', href: '/admin/facilitators', icon: Users },
  { name: 'Lessons', href: '/admin/lessons', icon: BookOpen },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Facilitator Resources', href: '/admin/facilitator-resources', icon: FolderOpen },
  { name: 'Applications', href: '/admin/applications', icon: ClipboardList },
];

const superAdminItems = [
  { name: 'Programs', href: '/admin/programs', icon: GraduationCap },
  { name: 'Announcement Bar', href: '/admin/announcements', icon: Megaphone },
  { name: 'Admin Accounts', href: '/admin/admins', icon: Shield },
  { name: 'Team Members', href: '/admin/team-members', icon: UsersRound },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isSuperAdmin, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const allNavItems = isSuperAdmin ? [...navItems, ...superAdminItems] : navItems;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2">
              <img src={finlitLogo} alt="FinLit Logo" className="h-8 w-auto" />
              <span className="font-semibold text-foreground">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {allNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Home size={18} />
              Back to Website
            </Link>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
