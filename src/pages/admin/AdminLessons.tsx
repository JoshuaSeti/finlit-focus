import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminLessons = () => {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    file_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
    } else {
      setLessons(data || []);
    }
    setIsLoading(false);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      file_url: lesson.file_url || '',
      display_order: lesson.display_order,
      is_active: lesson.is_active,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      file_url: '',
      display_order: lessons.length,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingLesson) {
      const { error } = await supabase
        .from('lessons')
        .update(formData)
        .eq('id', editingLesson.id);

      if (error) {
        toast({ title: 'Error updating lesson', variant: 'destructive' });
      } else {
        toast({ title: 'Lesson updated successfully' });
        fetchLessons();
      }
    } else {
      const { error } = await supabase
        .from('lessons')
        .insert(formData);

      if (error) {
        toast({ title: 'Error creating lesson', variant: 'destructive' });
      } else {
        toast({ title: 'Lesson created successfully' });
        fetchLessons();
      }
    }
    setIsDialogOpen(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('lessons')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating lesson', variant: 'destructive' });
    } else {
      toast({ title: 'Lesson visibility updated' });
      fetchLessons();
    }
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting lesson', variant: 'destructive' });
    } else {
      toast({ title: 'Lesson deleted' });
      fetchLessons();
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
          <h1 className="text-2xl font-bold text-foreground">Lessons Management</h1>
          <p className="text-muted-foreground">Create and manage lessons for facilitators.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus size={18} className="mr-2" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'New Lesson'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Lesson title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Brief description"
                  minHeight={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="Full lesson content"
                  minHeight={280}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file_url">File URL (optional)</Label>
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingLesson ? 'Update' : 'Create'} Lesson
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4">
            <div className="text-muted-foreground cursor-grab">
              <GripVertical size={20} />
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-primary">{lesson.display_order + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{lesson.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActive(lesson.id, lesson.is_active)}
                title={lesson.is_active ? 'Hide lesson' : 'Show lesson'}
              >
                {lesson.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(lesson)}>
                <Edit2 size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteLesson(lesson.id)}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLessons;
