import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RichText } from '@/components/ui/rich-text';

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id!)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <Layout>
      <section className="pt-32 pb-16 bg-gradient-to-br from-green-50 to-green-100/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Link to="/resources-blog">
            <Button variant="ghost" size="sm" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>

          {isLoading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-foreground mb-2">Post not found</h2>
              <p className="text-muted-foreground">This blog post may have been removed or is unavailable.</p>
            </div>
          )}

          {post && (
            <article>
              <div className="flex items-center gap-3 mb-4">
                {post.category && <Badge variant="secondary">{post.category}</Badge>}
                {post.published_at && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{post.title}</h1>
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full rounded-2xl mb-8 object-cover max-h-96"
                />
              )}
              <RichText html={post.content} className="prose-lg text-foreground/90" />

            </article>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BlogPost;
