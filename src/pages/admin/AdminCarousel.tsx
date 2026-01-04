import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string | null;
  background_image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminCarousel = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    background_image_url: '',
    cta_text: '',
    cta_link: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from('carousel_slides')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching slides:', error);
    } else {
      setSlides(data || []);
    }
    setIsLoading(false);
  };

  const openEditDialog = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      background_image_url: slide.background_image_url || '',
      cta_text: slide.cta_text || '',
      cta_link: slide.cta_link || '',
      is_active: slide.is_active,
      display_order: slide.display_order,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      background_image_url: '',
      cta_text: 'Learn More',
      cta_link: '/',
      is_active: true,
      display_order: slides.length,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingSlide) {
      const { error } = await supabase
        .from('carousel_slides')
        .update(formData)
        .eq('id', editingSlide.id);

      if (error) {
        toast({ title: 'Error updating slide', variant: 'destructive' });
      } else {
        toast({ title: 'Slide updated successfully' });
        fetchSlides();
      }
    } else {
      const { error } = await supabase
        .from('carousel_slides')
        .insert(formData);

      if (error) {
        toast({ title: 'Error creating slide', variant: 'destructive' });
      } else {
        toast({ title: 'Slide created successfully' });
        fetchSlides();
      }
    }
    setIsDialogOpen(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('carousel_slides')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating slide', variant: 'destructive' });
    } else {
      toast({ title: 'Slide visibility updated' });
      fetchSlides();
    }
  };

  const deleteSlide = async (id: string) => {
    const { error } = await supabase
      .from('carousel_slides')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting slide', variant: 'destructive' });
    } else {
      toast({ title: 'Slide deleted' });
      fetchSlides();
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
          <h1 className="text-2xl font-bold text-foreground">Carousel Management</h1>
          <p className="text-muted-foreground">Manage the homepage carousel slides.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus size={18} className="mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Edit Slide' : 'New Slide'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Slide title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Slide subtitle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="background_image_url">Background Image URL</Label>
                <Input
                  id="background_image_url"
                  value={formData.background_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, background_image_url: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
                <p className="text-xs text-muted-foreground">Use a high-resolution image URL (1920px wide recommended)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_text">Button Text</Label>
                  <Input
                    id="cta_text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                    placeholder="Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_link">Button Link</Label>
                  <Input
                    id="cta_link"
                    value={formData.cta_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, cta_link: e.target.value }))}
                    placeholder="/resources"
                  />
                </div>
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
                  {editingSlide ? 'Update' : 'Create'} Slide
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-4"
          >
            <div className="text-muted-foreground cursor-grab">
              <GripVertical size={20} />
            </div>
            <div 
              className="w-32 h-20 rounded-lg bg-cover bg-center bg-muted flex items-center justify-center overflow-hidden"
              style={{ backgroundImage: slide.background_image_url ? `url(${slide.background_image_url})` : undefined }}
            >
              {!slide.background_image_url && (
                <span className="text-2xl font-bold text-primary/30">{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{slide.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{slide.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActive(slide.id, slide.is_active)}
                title={slide.is_active ? 'Hide slide' : 'Show slide'}
              >
                {slide.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(slide)}
              >
                <Edit2 size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteSlide(slide.id)}
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

export default AdminCarousel;
