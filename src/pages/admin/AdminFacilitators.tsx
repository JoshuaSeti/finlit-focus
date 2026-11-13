import { useState, useEffect } from 'react';
import { Plus, Trash2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Facilitator {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  school_name: string | null;
  created_at: string;
}

const AdminFacilitators = () => {
  const { toast } = useToast();
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    schoolName: '',
  });

  useEffect(() => {
    fetchFacilitators();
  }, []);

  const fetchFacilitators = async () => {
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, created_at')
      .eq('role', 'facilitator');

    if (rolesError) {
      console.error('Error fetching facilitators:', rolesError);
      setIsLoading(false);
      return;
    }

    if (!roles || roles.length === 0) {
      setFacilitators([]);
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

    const facilitatorList = roles.map(role => {
      const profile = profiles?.find(p => p.user_id === role.user_id);
      return {
        id: role.user_id,
        user_id: role.user_id,
        email: profile?.email || '',
        full_name: profile?.full_name || '',
        school_name: profile?.school_name || null,
        created_at: role.created_at,
      };
    });

    setFacilitators(facilitatorList);
    setIsLoading(false);
  };

  const handleCreateFacilitator = async () => {
    setIsSubmitting(true);

    const { data, error: fnError } = await supabase.functions.invoke('create-user', {
      body: {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: 'facilitator',
        schoolName: formData.schoolName,
      },
    });

    if (fnError || data?.error) {
      toast({
        title: 'Error creating facilitator',
        description: data?.error || fnError?.message || 'Unknown error',
        variant: 'destructive',
      });
    } else {
      toast({ title: data?.existing ? 'Existing account upgraded to facilitator (their current password stays the same)' : 'Facilitator created successfully' });
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', fullName: '', schoolName: '' });
      fetchFacilitators();
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'facilitator');

    if (error) {
      toast({
        title: 'Error removing facilitator',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Facilitator removed' });
      fetchFacilitators();
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
          <h1 className="text-2xl font-bold text-foreground">Facilitator Management</h1>
          <p className="text-muted-foreground">Create and manage facilitator accounts.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} className="mr-2" />
              Add Facilitator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Facilitator</DialogTitle>
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
                  placeholder="facilitator@school.edu.zm"
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
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                  placeholder="Lusaka International School"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFacilitator} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Facilitator'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {facilitators.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No facilitators yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {facilitators.map((facilitator) => (
            <div key={facilitator.id} className="bg-card rounded-xl p-4 shadow-soft flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{facilitator.full_name || 'No name'}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {facilitator.email}
                    </span>
                    {facilitator.school_name && (
                      <span>{facilitator.school_name}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(facilitator.user_id)}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFacilitators;
