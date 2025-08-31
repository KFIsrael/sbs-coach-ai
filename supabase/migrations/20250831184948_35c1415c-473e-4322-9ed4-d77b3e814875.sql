-- Enable real-time for workout tables
ALTER TABLE public.workout_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.workout_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_logs;