import { BookOpen, Bell, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const FacilitatorDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to the Facilitator Portal</h1>
        <p className="text-muted-foreground">Access your lessons, notifications, and resources.</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Link to="/facilitator/lessons" className="bg-card rounded-xl p-6 shadow-soft hover-lift">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Lessons</h3>
          <p className="text-sm text-muted-foreground">
            Access curriculum materials and lesson plans
          </p>
        </Link>

        <Link to="/facilitator/notifications" className="bg-card rounded-xl p-6 shadow-soft hover-lift">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Stay updated with announcements and news
          </p>
        </Link>

        <Link to="/facilitator/resources" className="bg-card rounded-xl p-6 shadow-soft hover-lift">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Resources</h3>
          <p className="text-sm text-muted-foreground">
            Download materials and guides
          </p>
        </Link>
      </div>
    </div>
  );
};

export default FacilitatorDashboard;
