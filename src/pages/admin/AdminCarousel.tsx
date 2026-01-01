import { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { mockCarouselSlides, type CarouselSlide } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const AdminCarousel = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<CarouselSlide[]>(mockCarouselSlides);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    backgroundImageUrl: '',
    ctaText: '',
    ctaLink: '',
    active: true,
  });

  const openEditDialog = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      backgroundImageUrl: slide.backgroundImageUrl,
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      active: slide.active,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      backgroundImageUrl: '',
      ctaText: 'Learn More',
      ctaLink: '/',
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingSlide) {
      setSlides(prev => prev.map(s => 
        s.id === editingSlide.id 
          ? { ...s, ...formData }
          : s
      ));
      toast({ title: 'Slide updated successfully' });
    } else {
      const newSlide: CarouselSlide = {
        id: Date.now().toString(),
        ...formData,
      };
      setSlides(prev => [...prev, newSlide]);
      toast({ title: 'Slide created successfully' });
    }
    setIsDialogOpen(false);
  };

  const toggleActive = (id: string) => {
    setSlides(prev => prev.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
    toast({ title: 'Slide visibility updated' });
  };

  const deleteSlide = (id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Slide deleted' });
  };

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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Slide description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backgroundImageUrl">Background Image URL</Label>
                <Input
                  id="backgroundImageUrl"
                  value={formData.backgroundImageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
                <p className="text-xs text-muted-foreground">Use a high-resolution image URL (1920px wide recommended)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaLink">Button Link</Label>
                  <Input
                    id="ctaLink"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                    placeholder="/resources"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
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
              style={{ backgroundImage: slide.backgroundImageUrl ? `url(${slide.backgroundImageUrl})` : undefined }}
            >
              {!slide.backgroundImageUrl && (
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
                onClick={() => toggleActive(slide.id)}
                title={slide.active ? 'Hide slide' : 'Show slide'}
              >
                {slide.active ? <Eye size={18} /> : <EyeOff size={18} />}
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
