import { useEffect, useState } from 'react';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichText, stripHtml } from '@/components/ui/rich-text';
import { supabase } from '@/integrations/supabase/client';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  display_order: number;
}

const FacilitatorLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
    } else {
      setLessons(data || []);
    }
    setIsLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
        <p className="text-muted-foreground">Access your curriculum materials and lesson plans.</p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No lessons available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {lessons.map((lesson, index) => (
            <div key={lesson.id} className="bg-card rounded-xl p-6 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{lesson.title}</h3>
                    {lesson.description && (
                      <RichText html={lesson.description} className="text-sm text-muted-foreground line-clamp-2" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.content && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <ExternalLink size={16} className="mr-1" />
                      View
                    </Button>
                  )}
                  {lesson.file_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={lesson.file_url} target="_blank" rel="noopener noreferrer">
                        <Download size={16} className="mr-1" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Content Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{selectedLesson.title}</h2>
            </div>
            <div className="p-6">
              <RichText html={selectedLesson.content} />
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <Button onClick={() => setSelectedLesson(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitatorLessons;
