-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'facilitator');

-- Create user_roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table for user info
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    school_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create carousel_slides table
CREATE TABLE public.carousel_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    background_image_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    category TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table for facilitators
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    file_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for facilitators
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create facilitator_resources table
CREATE TABLE public.facilitator_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    resource_type TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitator_resources ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is any type of admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Function to check if user is facilitator
CREATE OR REPLACE FUNCTION public.is_facilitator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'facilitator'
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin roles" ON public.user_roles
FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage facilitator roles" ON public.user_roles
FOR INSERT WITH CHECK (public.is_admin(auth.uid()) AND role = 'facilitator');

CREATE POLICY "Admins can delete facilitator roles" ON public.user_roles
FOR DELETE USING (public.is_admin(auth.uid()) AND role = 'facilitator');

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage profiles" ON public.profiles
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for carousel_slides (public read, admin write)
CREATE POLICY "Anyone can view active carousel slides" ON public.carousel_slides
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all carousel slides" ON public.carousel_slides
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage carousel slides" ON public.carousel_slides
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for blog_posts (public read published, admin write)
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can view all blog posts" ON public.blog_posts
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for contact_submissions (admin only)
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for lessons (facilitators can read, admin can manage)
CREATE POLICY "Facilitators can view active lessons" ON public.lessons
FOR SELECT USING (public.is_facilitator(auth.uid()) AND is_active = true);

CREATE POLICY "Admins can view all lessons" ON public.lessons
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage lessons" ON public.lessons
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for notifications (facilitators can read, admin can manage)
CREATE POLICY "Facilitators can view active notifications" ON public.notifications
FOR SELECT USING (public.is_facilitator(auth.uid()) AND is_active = true);

CREATE POLICY "Admins can view all notifications" ON public.notifications
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage notifications" ON public.notifications
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for facilitator_resources (facilitators can read, admin can manage)
CREATE POLICY "Facilitators can view active resources" ON public.facilitator_resources
FOR SELECT USING (public.is_facilitator(auth.uid()) AND is_active = true);

CREATE POLICY "Admins can view all resources" ON public.facilitator_resources
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage resources" ON public.facilitator_resources
FOR ALL USING (public.is_admin(auth.uid()));

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carousel_slides_updated_at BEFORE UPDATE ON public.carousel_slides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facilitator_resources_updated_at BEFORE UPDATE ON public.facilitator_resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user trigger to create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();