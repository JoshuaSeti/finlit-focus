CREATE TABLE public.lesson_access (
  user_id uuid PRIMARY KEY,
  granted_at timestamptz NOT NULL DEFAULT now(),
  payment_reference text
);
GRANT SELECT ON public.lesson_access TO authenticated;
GRANT ALL ON public.lesson_access TO service_role;
ALTER TABLE public.lesson_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own access read" ON public.lesson_access FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.lipila_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reference_id text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lipila_payments TO authenticated;
GRANT ALL ON public.lipila_payments TO service_role;
ALTER TABLE public.lipila_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own payments read" ON public.lipila_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);