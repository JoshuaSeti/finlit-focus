import { Images, FileText, MessageSquare, TrendingUp } from 'lucide-react';
import { mockCarouselSlides, mockBlogPosts, mockContactForms } from '@/lib/mockData';

const stats = [
  { 
    name: 'Active Carousel Slides', 
    value: mockCarouselSlides.filter(s => s.active).length.toString(),
    icon: Images,
    change: '+1 this week'
  },
  { 
    name: 'Published Blog Posts', 
    value: mockBlogPosts.filter(p => p.published).length.toString(),
    icon: FileText,
    change: '+2 this month'
  },
  { 
    name: 'New Contact Forms', 
    value: mockContactForms.filter(c => c.status === 'new').length.toString(),
    icon: MessageSquare,
    change: 'Pending review'
  },
  { 
    name: 'Total Inquiries', 
    value: mockContactForms.length.toString(),
    icon: TrendingUp,
    change: 'All time'
  },
];

const AdminDashboard = () => {
  const recentContacts = mockContactForms.slice(0, 3);
  const recentPosts = mockBlogPosts.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the FinLit admin panel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{stat.change}</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Contact Forms */}
        <div className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Contact Forms</h2>
          <div className="space-y-4">
            {recentContacts.map((contact) => (
              <div key={contact.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{contact.schoolName}</p>
                  <p className="text-sm text-muted-foreground">{contact.contactPerson}</p>
                  <p className="text-xs text-muted-foreground mt-1">{contact.requestType}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  contact.status === 'new' && "bg-primary/10 text-primary",
                  contact.status === 'contacted' && "bg-yellow-500/10 text-yellow-600",
                  contact.status === 'resolved' && "bg-green-600/10 text-green-600"
                )}>
                  {contact.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Blog Posts */}
        <div className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Blog Posts</h2>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-sm text-muted-foreground">{post.author}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(post.date).toLocaleDateString()}
                  </p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  post.published ? "bg-green-600/10 text-green-600" : "bg-muted text-muted-foreground"
                )}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
