CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'propfirm-auto-blog',
  '0 */12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--06f2714b-7840-44ff-bbd5-3dd25282d754.lovable.app/api/public/cron/auto-blog',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZXdmZHhmcXV0aW9md2drdmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjg2MjAsImV4cCI6MjA5MzcwNDYyMH0.K-OpX57CN2uYKSbwKgcyypapIuUn2W886x5LF6urn_k"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);