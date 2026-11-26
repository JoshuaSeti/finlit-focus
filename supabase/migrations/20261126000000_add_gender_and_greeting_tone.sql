-- Add gender and greeting_tone columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('female', 'male')),
ADD COLUMN IF NOT EXISTS greeting_tone text NOT NULL DEFAULT 'friendly' CHECK (greeting_tone IN ('friendly', 'professional'));

-- Comment for clarity
COMMENT ON COLUMN public.profiles.gender IS 'Learner gender: female or male';
COMMENT ON COLUMN public.profiles.greeting_tone IS 'Learner greeting tone preference: friendly or professional';
