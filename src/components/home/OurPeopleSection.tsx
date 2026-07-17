import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RichText } from '@/components/ui/rich-text';

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  display_order: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const imageVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.3 },
  },
};

export function OurPeopleSection() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setTeamMembers(data);
      }
      setIsLoading(false);
    };

    fetchTeamMembers();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
            <Users className="w-4 h-4" />
            Our People
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet the Team Behind FinLit
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Passionate educators and financial experts dedicated to empowering Zambia's youth
            with essential financial knowledge.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {teamMembers.map((member) => (
            <motion.div
              key={member.id}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-shadow duration-300"
            >
              <motion.div 
                className="relative h-64 bg-muted overflow-hidden"
                whileHover="hover"
              >
                {member.image_url ? (
                  <motion.img
                    src={member.image_url}
                    alt={member.full_name}
                    className="w-full h-full object-cover"
                    variants={imageVariants}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Users className="w-16 h-16 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
              
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {member.full_name}
                </h3>
                <p className="text-primary font-medium text-sm mb-3">
                  {member.role}
                </p>
                {member.bio && (
                  <RichText
                    html={member.bio}
                    className="text-muted-foreground text-sm line-clamp-3"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
