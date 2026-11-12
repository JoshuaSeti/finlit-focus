ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS accent text NOT NULL DEFAULT 'oklch(0.46 0.12 158)',
  ADD COLUMN IF NOT EXISTS accent_ink text NOT NULL DEFAULT 'oklch(0.98 0.01 150)',
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS story text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS aspiration_quote text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS facts text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dots text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secret text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS this_or_that jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spotify_tracks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_group text NOT NULL DEFAULT 'executive';

UPDATE public.team_members
SET slug = trim(both '-' from regexp_replace(lower(full_name), '[^a-z0-9]+', '-', 'g')) || '-' || left(id::text, 4)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS team_members_slug_key ON public.team_members(slug);

GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

CREATE TABLE public.wall_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'A supporter' CHECK (char_length(author) BETWEEN 1 AND 40),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wall_notes_member_idx ON public.wall_notes(member_id, created_at DESC);

GRANT SELECT, INSERT ON public.wall_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wall_notes TO authenticated;
GRANT ALL ON public.wall_notes TO service_role;

ALTER TABLE public.wall_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads approved wall notes" ON public.wall_notes
FOR SELECT TO anon, authenticated
USING (is_approved OR private.is_admin(auth.uid()));

CREATE POLICY "Anyone posts wall notes for active members" ON public.wall_notes
FOR INSERT TO anon, authenticated
WITH CHECK (is_approved = true AND EXISTS (SELECT 1 FROM public.team_members t WHERE t.id = member_id AND t.is_active = true));

CREATE POLICY "Admins moderate wall notes" ON public.wall_notes
FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "Admins delete wall notes" ON public.wall_notes
FOR DELETE TO authenticated USING (private.is_admin(auth.uid()));