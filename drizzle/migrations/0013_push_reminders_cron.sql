SELECT cron.schedule('finlit-push-reminders', '0 * * * *', $$
  SELECT net.http_post(
    url := 'https://jznoczszgcvusizcpzhc.supabase.co/functions/v1/push-reminders',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bm9jenN6Z2N2dXNpemNwemhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjE4MzcsImV4cCI6MjA4MzA5NzgzN30.6O4eWKXckKHbPz4MDZZK6PryB2nWIUhLi0B2GglzSxU"}'::jsonb,
    body := '{}'::jsonb
  );
$$);