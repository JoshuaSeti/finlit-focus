import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, FileText, Download, Gamepad2, ArrowRight, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameSection } from '@/components/games/GameSection';
import { RichText, stripHtml } from '@/components/ui/rich-text';
interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  resource_type: string | null;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ResourcesAndBlog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [blogResult, resourceResult] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false }),
        supabase
          .from('facilitator_resources')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      if (blogResult.data) setBlogs(blogResult.data);
      if (resourceResult.data) setResources(resourceResult.data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-to-br from-green-50 to-green-100/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Resources & Blog
            </h1>
            <p className="text-lg text-muted-foreground">
              Access our educational resources and stay updated with the latest news 
              from FinLit's financial literacy programs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="blog" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-xl grid-cols-3">
                <TabsTrigger value="blog" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Blog & News
                </TabsTrigger>
                <TabsTrigger value="resources" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="games" className="gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  Games
                </TabsTrigger>
              </TabsList>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <TabsContent value="blog">
                  {blogs.length === 0 ? (
                    <div className="text-center py-20">
                      <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Blog Posts Yet</h3>
                      <p className="text-muted-foreground">Check back soon for updates!</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                      {blogs.map((post) => (
                        <motion.div key={post.id} variants={itemVariants}>
                          <Card className="h-full hover:shadow-elevated transition-shadow duration-300 overflow-hidden group">
                            {post.image_url && (
                              <div className="relative h-48 overflow-hidden">
                                <img
                                  src={post.image_url}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <CardHeader>
                              <div className="flex items-center gap-2 mb-2">
                                {post.category && (
                                  <Badge variant="secondary">{post.category}</Badge>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(post.published_at || post.created_at)}
                                </span>
                              </div>
                              <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                              {post.excerpt && (
                                <CardDescription className="line-clamp-3">
                                  {stripHtml(post.excerpt)}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:gap-2 transition-all">
                                Read Full Post <ArrowRight className="w-4 h-4" />
                              </Link>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="resources">
                  {resources.length === 0 ? (
                    <div className="text-center py-20">
                      <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Resources Yet</h3>
                      <p className="text-muted-foreground">Educational resources coming soon!</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {resources.map((resource) => (
                        <motion.div key={resource.id} variants={itemVariants}>
                          <Card className="h-full hover:shadow-elevated transition-shadow duration-300">
                            <CardHeader>
                              <div className="flex items-center gap-2 mb-2">
                                {resource.resource_type && (
                                  <Badge variant="outline">{resource.resource_type}</Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg">{resource.title}</CardTitle>
                              {resource.description && (
                                <CardDescription>{stripHtml(resource.description)}</CardDescription>
                              )}
                            </CardHeader>
                            {(resource.content || resource.file_url) && (
                              <CardContent className="flex flex-wrap gap-2">
                                {resource.content && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => setSelectedResource(resource)}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Read
                                  </Button>
                                )}
                                {resource.file_url && (
                                  <Button asChild variant="outline" size="sm" className="gap-2">
                                    <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4" />
                                      Download
                                    </a>
                                  </Button>
                                )}
                              </CardContent>
                            )}
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="games">
                  <GameSection />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </section>

      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResource?.title}</DialogTitle>
          </DialogHeader>
          {selectedResource?.content && (
            <RichText html={selectedResource.content} className="prose-base" />
          )}
          {selectedResource?.file_url && (
            <div className="pt-4 border-t border-border">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={selectedResource.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" />
                  Download file
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ResourcesAndBlog;
