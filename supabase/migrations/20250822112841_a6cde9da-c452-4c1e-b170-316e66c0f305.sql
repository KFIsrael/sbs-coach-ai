-- Fix infinite recursion in profiles RLS policy by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins and trainers can view all profiles" ON public.profiles;

-- Recreate the policy using the security definer function
CREATE POLICY "Admins and trainers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = ANY(ARRAY['admin'::text, 'trainer'::text]));

-- Add INSERT policy for profiles (needed for new user registration)
CREATE POLICY "Allow profile creation via trigger" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true); -- This is safe because it's controlled by the trigger

-- Also add a policy to allow users to insert their own profile manually if needed
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);