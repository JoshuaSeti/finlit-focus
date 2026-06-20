
-- 1. Private schema for role-check helpers (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') $$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin')) $$;

CREATE OR REPLACE FUNCTION private.is_facilitator(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'facilitator') $$;

REVOKE ALL ON FUNCTION private.is_admin(uuid), private.is_super_admin(uuid), private.is_facilitator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid), private.is_super_admin(uuid), private.is_facilitator(uuid) TO authenticated, service_role;

-- 2. Drop policies that depend on public.is_* functions, recreate against private.is_*
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Facilitators can view active notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
CREATE POLICY "Facilitators can view active notifications" ON public.notifications FOR SELECT TO authenticated USING (private.is_facilitator(auth.uid()) AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage carousel slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can view all carousel slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage carousel slides" ON public.carousel_slides FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can view all carousel slides" ON public.carousel_slides FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can view all blog posts" ON public.blog_posts FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can view all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Facilitators can view active lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can view all lessons" ON public.lessons FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
CREATE POLICY "Facilitators can view active lessons" ON public.lessons FOR SELECT TO authenticated USING (private.is_facilitator(auth.uid()) AND is_active = true);

DROP POLICY IF EXISTS "Admins can delete facilitator roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage facilitator roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON public.user_roles;
CREATE POLICY "Admins can delete facilitator roles" ON public.user_roles FOR DELETE TO authenticated USING (private.is_admin(auth.uid()) AND role = 'facilitator');
CREATE POLICY "Admins can manage facilitator roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (private.is_admin(auth.uid()) AND role = 'facilitator');
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
CREATE POLICY "Super admins can manage admin roles" ON public.user_roles FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));

-- 2b. RESTRICTIVE policy: block self-elevation to admin/super_admin no matter what permissive policies say
CREATE POLICY "Only super admins may assign elevated roles"
ON public.user_roles AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (
  role = 'facilitator'::app_role
  OR private.is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));

-- 2c. Allow users to create only their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage resources" ON public.facilitator_resources;
DROP POLICY IF EXISTS "Admins can view all resources" ON public.facilitator_resources;
DROP POLICY IF EXISTS "Facilitators can view active resources" ON public.facilitator_resources;
CREATE POLICY "Admins can manage resources" ON public.facilitator_resources FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can view all resources" ON public.facilitator_resources FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
CREATE POLICY "Facilitators can view active resources" ON public.facilitator_resources FOR SELECT TO authenticated USING (private.is_facilitator(auth.uid()) AND is_active = true);

DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can update team members" ON public.team_members;
CREATE POLICY "Super admins can delete team members" ON public.team_members FOR DELETE TO authenticated USING (private.is_super_admin(auth.uid()));
CREATE POLICY "Super admins can insert team members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (private.is_super_admin(auth.uid()));
CREATE POLICY "Super admins can update team members" ON public.team_members FOR UPDATE TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));

-- 3. Drop now-orphan public role helpers (no longer referenced by any policy)
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.is_facilitator(uuid);
