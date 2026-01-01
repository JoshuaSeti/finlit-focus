import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockBlogPosts } from '@/lib/mockData';

export function BlogPreview() {
  const recentPosts = mockBlogPosts.filter(post => post.published).slice(0, 3);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
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

        {/* Blog Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {recentPosts.map((post, index) => (
            <article 
              key={post.id}
              className={`group bg-card rounded-2xl overflow-hidden shadow-soft hover-lift opacity-0 animate-fade-up stagger-${index + 1}`}
            >
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-green-300/10 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary/20">
                    {post.category.charAt(0)}
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {post.excerpt}
                </p>
                <Link 
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-1 mt-4 text-primary text-sm font-medium hover:gap-2 transition-all"
                >
                  Read More <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link to="/blog">
            <Button variant="outline" size="lg">
              View All Posts
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
