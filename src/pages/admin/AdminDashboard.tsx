import { useState, useEffect } from 'react';
import { Images, FileText, MessageSquare, TrendingUp, Users, BookOpen, Bell, ClipboardList, UserPlus, Wallet, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeSlides: 0,
    publishedPosts: 0,
    newContacts: 0,
    totalContacts: 0,
    facilitators: 0,
    lessons: 0,
    notifications: 0,
  });
  const [ls, setLs] = useState({ learners: 0, paid: 0, placed: 0, new_week: 0, applicants: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [slidesRes, postsRes, contactsRes, facilitatorsRes, lessonsRes, notificationsRes] = await Promise.all([
      supabase.from('carousel_slides').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('blog_posts').select('id', { count: 'exact' }).eq('is_published', true),
      supabase.from('contact_submissions').select('id, status', { count: 'exact' }),
      supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'facilitator'),
      supabase.from('lessons').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('notifications').select('id', { count: 'exact' }).eq('is_active', true),
    ]);

    const { data: l } = await supabase.rpc('admin_learner_stats');
    if (l) setLs(l as any);
    const contacts = contactsRes.data || [];
    setStats({
      activeSlides: slidesRes.count || 0,
      publishedPosts: postsRes.count || 0,
      newContacts: contacts.filter(c => c.status === 'new').length,
      totalContacts: contacts.length,
      facilitators: facilitatorsRes.count || 0,
      lessons: lessonsRes.count || 0,
      notifications: notificationsRes.count || 0,
    });
    setIsLoading(false);
  };

  const topCards = [
    { name: 'Program applicants', value: ls.applicants, sub: `${ls.pending} waiting for review`, icon: ClipboardList, to: '/admin/applications' },
    { name: 'Learner accounts', value: ls.learners, sub: `${ls.new_week} new this week`, icon: UserPlus, to: '/admin/learners' },
    { name: 'Paid learners (K20)', value: ls.paid, sub: 'Full lesson access', icon: Wallet, to: '/admin/learners?filter=paid' },
    { name: 'Took placement test', value: ls.placed, sub: 'Learners with a roadmap', icon: Compass, to: '/admin/learners?filter=placed' },
  ];

  const statCards = [
    { name: 'Active Carousel Slides', value: stats.activeSlides, icon: Images },
    { name: 'Published Blog Posts', value: stats.publishedPosts, icon: FileText },
    { name: 'New Contact Forms', value: stats.newContacts, icon: MessageSquare },
    { name: 'Total Inquiries', value: stats.totalContacts, icon: TrendingUp },
    { name: 'Facilitators', value: stats.facilitators, icon: Users },
    { name: 'Active Lessons', value: stats.lessons, icon: BookOpen },
    { name: 'Active Notifications', value: stats.notifications, icon: Bell },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the FinLit admin panel.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((c) => {
          const body = (
            <div className="bg-card rounded-xl p-6 shadow-soft border border-primary/20 h-full">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><c.icon className="w-5 h-5 text-primary" /></div>
              <div className="mt-4 text-3xl font-bold text-foreground">{c.value}</div>
              <div className="text-sm font-medium text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.sub}</div>
            </div>
          );
          return c.to ? <Link key={c.name} to={c.to}>{body}</Link> : <div key={c.name}>{body}</div>;
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
