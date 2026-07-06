import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { stripHtml } from '@/components/ui/rich-text';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

const AdminNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    is_active: true,
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setIsLoading(false);
  };

  const openEditDialog = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      is_active: notification.is_active,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingNotification(null);
    setFormData({
      title: '',
      message: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingNotification) {
      const { error } = await supabase
        .from('notifications')
        .update(formData)
        .eq('id', editingNotification.id);

      if (error) {
        toast({ title: 'Error updating notification', variant: 'destructive' });
      } else {
        toast({ title: 'Notification updated successfully' });
        fetchNotifications();
      }
    } else {
      const { error } = await supabase
        .from('notifications')
        .insert(formData);

      if (error) {
        toast({ title: 'Error creating notification', variant: 'destructive' });
      } else {
        toast({ title: 'Notification created successfully' });
        fetchNotifications();
      }
    }
    setIsDialogOpen(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating notification', variant: 'destructive' });
    } else {
      toast({ title: 'Notification visibility updated' });
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting notification', variant: 'destructive' });
    } else {
      toast({ title: 'Notification deleted' });
      fetchNotifications();
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
          <h1 className="text-2xl font-bold text-foreground">Notifications Management</h1>
          <p className="text-muted-foreground">Send announcements to facilitators.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus size={18} className="mr-2" />
              New Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNotification ? 'Edit Notification' : 'New Notification'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message. HTML tags are supported."
                  className="min-h-[160px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingNotification ? 'Update' : 'Send'} Notification
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="bg-card rounded-xl p-4 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(notification.message)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(notification.id, notification.is_active)}
                  >
                    {notification.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(notification)}>
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
