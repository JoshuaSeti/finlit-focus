import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
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

interface Resource {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  resource_type: string | null;
  is_active: boolean;
}

const AdminFacilitatorResources = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    file_url: '',
    resource_type: '',
    is_active: true,
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('facilitator_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
    } else {
      setResources(data || []);
    }
    setIsLoading(false);
  };

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      content: resource.content || '',
      file_url: resource.file_url || '',
      resource_type: resource.resource_type || '',
      is_active: resource.is_active,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      file_url: '',
      resource_type: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingResource) {
      const { error } = await supabase
        .from('facilitator_resources')
        .update(formData)
        .eq('id', editingResource.id);

      if (error) {
        toast({ title: 'Error updating resource', variant: 'destructive' });
      } else {
        toast({ title: 'Resource updated successfully' });
        fetchResources();
      }
    } else {
      const { error } = await supabase
        .from('facilitator_resources')
        .insert(formData);

      if (error) {
        toast({ title: 'Error creating resource', variant: 'destructive' });
      } else {
        toast({ title: 'Resource created successfully' });
        fetchResources();
      }
    }
    setIsDialogOpen(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('facilitator_resources')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating resource', variant: 'destructive' });
    } else {
      toast({ title: 'Resource visibility updated' });
      fetchResources();
    }
  };

  const deleteResource = async (id: string) => {
    const { error } = await supabase
      .from('facilitator_resources')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting resource', variant: 'destructive' });
    } else {
      toast({ title: 'Resource deleted' });
      fetchResources();
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
          <h1 className="text-2xl font-bold text-foreground">Facilitator Resources</h1>
          <p className="text-muted-foreground">Upload resources for facilitators to download.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus size={18} className="mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingResource ? 'Edit Resource' : 'New Resource'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Resource title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Brief description"
                  minHeight={140}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content (optional)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Full text content of the resource. HTML tags are supported. Leave blank if the resource is a downloadable file only."
                  className="min-h-[240px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Provide written content here, a downloadable file URL below, or both.</p>
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
              <div className="space-y-2">
                <Label htmlFor="resource_type">Resource Type</Label>
                <Input
                  id="resource_type"
                  value={formData.resource_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, resource_type: e.target.value }))}
                  placeholder="Article, PDF, Video, Template, etc."
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
                  {editingResource ? 'Update' : 'Create'} Resource
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No resources yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-card rounded-xl p-4 shadow-soft">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(resource.id, resource.is_active)}
                  >
                    {resource.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(resource)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteResource(resource.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <h3 className="font-medium text-foreground mb-1">{resource.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
              {resource.resource_type && (
                <span className="inline-block px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground mt-2">
                  {resource.resource_type}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFacilitatorResources;
