import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function BlogPreview() {
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['blog-posts-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (recentPosts.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 opacity-0 animate-fade-up">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Latest Updates
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            News & Insights
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay informed with the latest news, tips, and insights on financial literacy education.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {recentPosts.map((post, index) => (
            <article 
              key={post.id}
              className={`group bg-card rounded-2xl overflow-hidden shadow-soft hover-lift opacity-0 animate-fade-up stagger-${index + 1}`}
            >
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-green-300/10 relative overflow-hidden">
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl font-bold text-primary/20">
                      {(post.category || 'B').charAt(0)}
                    </div>
                  </div>
                )}
                {post.category && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
                      {post.category}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <Link 
                  to="/resources-blog"
                  className="inline-flex items-center gap-1 mt-4 text-primary text-sm font-medium hover:gap-2 transition-all"
                >
                  Read More <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Link to="/resources-blog">
            <Button variant="outline" size="lg">
              View All Posts
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
