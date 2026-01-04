import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface Admin {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

const AdminAccounts = () => {
  const { toast } = useToast();
  const { isSuperAdmin, user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'admin' as 'admin' | 'super_admin',
  });

  // Only super admins can access this page
  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .in('role', ['admin', 'super_admin']);

    if (rolesError) {
      console.error('Error fetching admins:', rolesError);
      setIsLoading(false);
      return;
    }

    if (!roles || roles.length === 0) {
      setAdmins([]);
      setIsLoading(false);
      return;
    }

    const userIds = roles.map(r => r.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setIsLoading(false);
      return;
    }

    const adminList = roles.map(role => {
      const profile = profiles?.find(p => p.user_id === role.user_id);
      return {
        id: role.user_id,
        user_id: role.user_id,
        email: profile?.email || '',
        full_name: profile?.full_name || '',
        role: role.role as 'admin' | 'super_admin',
        created_at: role.created_at,
      };
    });

    setAdmins(adminList);
    setIsLoading(false);
  };

  const handleCreateAdmin = async () => {
    setIsSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/login`,
        data: {
          full_name: formData.fullName,
        },
      },
    });

    if (authError) {
      toast({
        title: 'Error creating admin',
        description: authError.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (!authData.user) {
      toast({
        title: 'Error creating admin',
        description: 'User creation failed',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({ full_name: formData.fullName })
      .eq('user_id', authData.user.id);

    // Add admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: formData.role,
      });

    if (roleError) {
      toast({
        title: 'Error assigning role',
        description: roleError.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Admin created successfully' });
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', fullName: '', role: 'admin' });
      fetchAdmins();
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (userId: string) => {
    // Prevent deleting yourself
    if (userId === user?.id) {
      toast({
        title: 'Cannot delete your own account',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin']);

    if (error) {
      toast({
        title: 'Error removing admin',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Admin removed' });
      fetchAdmins();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Accounts</h1>
          <p className="text-muted-foreground">Manage administrator accounts. Only super admins can access this.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} className="mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@finlit.org"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'admin' | 'super_admin' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAdmin} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Admin'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No admin accounts found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-card rounded-xl p-4 shadow-soft flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${admin.role === 'super_admin' ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
                  {admin.role === 'super_admin' ? (
                    <Shield className={`w-5 h-5 text-yellow-600`} />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{admin.full_name || 'No name'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      admin.role === 'super_admin' 
                        ? 'bg-yellow-500/10 text-yellow-600' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
              </div>
              {admin.user_id !== user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(admin.user_id)}
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAccounts;
