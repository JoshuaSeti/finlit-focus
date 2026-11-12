import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { teamQuery } from "@/lib/team.queries";
import { TeamEdgeStack } from "./TeamEdgeStack";

/** "Meet the team" intro on the About page plus the card stack peeking in from the screen edge. */
export function MeetTheTeam() {
  const { data: members = [] } = useQuery(teamQuery());
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary">
            <Users className="h-4 w-4" /> Our People
          </span>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Meet the Team Behind FinLit</h2>
          <p className="text-lg text-muted-foreground">
            See the cards peeking in from the edge of your screen? Tap one to step into that person's world.
          </p>
        </motion.div>
      </div>
      {members.length > 0 && <TeamEdgeStack members={members} />}
    </section>
  );
}
