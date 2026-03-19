-- 1. Új chat_logs tábla létrehozása, mivel ez még hiányzott
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  session_id text,
  messages jsonb DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chat_logs_pkey PRIMARY KEY (id)
);

-- 2. RLS (Row Level Security) bekapcsolása mindkét táblán
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policy-k a 'leads' táblához

-- A weboldalról (nyilvánosan) lehessen új leadet beküldeni
CREATE POLICY "Allow public insert on leads"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);

-- A bejelentkezett adminok láthatják az összes leadet
CREATE POLICY "Allow auth select on leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

-- A bejelentkezett adminok frissíthetik a leadeket (pl. státuszváltás)
CREATE POLICY "Allow auth update on leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (true);

-- 4. Policy-k a 'chat_logs' táblához

-- A weboldalról (nyilvánosan) lehessen chat logokat beküldeni
CREATE POLICY "Allow public insert on chat_logs"
ON public.chat_logs
FOR INSERT
TO public
WITH CHECK (true);

-- A bejelentkezett adminok láthatják a chat logokat
CREATE POLICY "Allow auth select on chat_logs"
ON public.chat_logs
FOR SELECT
TO authenticated
USING (true);

-- A bejelentkezett adminok frissíthetik a chat logokat
CREATE POLICY "Allow auth update on chat_logs"
ON public.chat_logs
FOR UPDATE
TO authenticated
USING (true);
