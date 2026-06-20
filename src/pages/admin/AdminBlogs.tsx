import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';

const categories = ['News', 'Tips', 'Research', 'Success Stories'];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const AdminBlogs = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    is_published: false,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || '',
      is_published: post.is_published,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      is_published: false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const updateData = {
      ...formData,
      published_at: formData.is_published ? new Date().toISOString() : null,
    };

    if (editingPost) {
      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', editingPost.id);

      if (error) {
        toast({ title: 'Error updating post', variant: 'destructive' });
      } else {
        toast({ title: 'Blog post updated successfully' });
        fetchPosts();
      }
    } else {
      const { error } = await supabase
        .from('blog_posts')
        .insert(updateData);

      if (error) {
        toast({ title: 'Error creating post', variant: 'destructive' });
      } else {
        toast({ title: 'Blog post created successfully' });
        fetchPosts();
      }
    }
    setIsDialogOpen(false);
  };

  const togglePublished = async (id: string, currentPublished: boolean) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ 
        is_published: !currentPublished,
        published_at: !currentPublished ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating post', variant: 'destructive' });
    } else {
      toast({ title: 'Post status updated' });
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting post', variant: 'destructive' });
    } else {
      toast({ title: 'Blog post deleted' });
      fetchPosts();
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage blog posts.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus size={18} className="mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Post' : 'New Post'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <RichTextEditor
                  value={formData.excerpt}
                  onChange={(value) => setFormData(prev => ({ ...prev, excerpt: value }))}
                  placeholder="Brief summary for blog listing"
                  minHeight={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="Full blog post content..."
                  minHeight={260}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">Publish immediately</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingPost ? 'Update' : 'Create'} Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4">
        {posts.map((post) => (
          <div 
            key={post.id}
            className="bg-card rounded-xl p-4 shadow-soft flex items-start gap-4"
          >
            <div className="w-20 h-16 bg-gradient-to-br from-primary/10 to-green-300/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary/30">
                {post.category?.charAt(0) || 'B'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{post.excerpt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    {post.category && (
                      <span className="px-2 py-0.5 bg-muted rounded-full">{post.category}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    post.is_published ? "bg-green-600/10 text-green-600" : "bg-muted text-muted-foreground"
                  )}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublished(post.id, post.is_published)}
                    title={post.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {post.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(post)}
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBlogs;
