-- Create messages table for trainer-client communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages they sent or received" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert messages as sender" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message read status" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Create updated_at trigger for messages
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add role field to profiles if not exists (updating existing structure)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'client';
    END IF;
END $$;

-- Create client-trainer assignments table
CREATE TABLE public.client_trainer_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  trainer_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(client_id, trainer_id)
);

-- Enable Row Level Security
ALTER TABLE public.client_trainer_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for assignments
CREATE POLICY "Trainers can view their client assignments" 
ON public.client_trainer_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'trainer'
    AND profiles.user_id = trainer_id
  )
);

CREATE POLICY "Clients can view their trainer assignments" 
ON public.client_trainer_assignments 
FOR SELECT 
USING (auth.uid() = client_id);

-- Create table for storing user questionnaire responses in a more structured way
CREATE TABLE public.user_questionnaire_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  fitness_goal TEXT,
  fitness_level TEXT,
  age_range TEXT,
  limitations TEXT,
  equipment TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_questionnaire_data ENABLE ROW LEVEL SECURITY;

-- Create policies for questionnaire data
CREATE POLICY "Users can view their own questionnaire data" 
ON public.user_questionnaire_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questionnaire data" 
ON public.user_questionnaire_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questionnaire data" 
ON public.user_questionnaire_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view client questionnaire data" 
ON public.user_questionnaire_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'trainer'
  )
);

-- Create updated_at trigger for questionnaire data
CREATE TRIGGER update_user_questionnaire_data_updated_at
BEFORE UPDATE ON public.user_questionnaire_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();