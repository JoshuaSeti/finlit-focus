import { useEffect, useState } from 'react';
import { FolderOpen, Download, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RichText } from '@/components/ui/rich-text';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  resource_type: string | null;
}

const FacilitatorResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('facilitator_resources')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
    } else {
      setResources(data || []);
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
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-muted-foreground">Access materials and guides for your sessions.</p>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No resources available yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-card rounded-xl p-6 shadow-soft hover-lift flex flex-col">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{resource.title}</h3>
              {resource.description && (
                <RichText html={resource.description} className="text-sm text-muted-foreground mb-4" />
              )}
              {resource.resource_type && (
                <span className="inline-block self-start px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground mb-4">
                  {resource.resource_type}
                </span>
              )}
              <div className="mt-auto flex flex-col gap-2">
                {resource.content && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedResource(resource)}
                  >
                    <ExternalLink size={16} className="mr-2" />
                    View
                  </Button>
                )}
                {resource.file_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                      <Download size={16} className="mr-2" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedResource && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{selectedResource.title}</h2>
            </div>
            <div className="p-6">
              <RichText html={selectedResource.content} />
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-2">
              {selectedResource.file_url && (
                <Button variant="outline" asChild>
                  <a href={selectedResource.file_url} target="_blank" rel="noopener noreferrer">
                    <Download size={16} className="mr-2" />
                    Download
                  </a>
                </Button>
              )}
              <Button onClick={() => setSelectedResource(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitatorResources;
