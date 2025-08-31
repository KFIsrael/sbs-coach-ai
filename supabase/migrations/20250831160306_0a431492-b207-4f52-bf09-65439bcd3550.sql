-- Fix security issue: Restrict trainers to only view assigned clients' questionnaire data
DROP POLICY IF EXISTS "Trainers can view client questionnaire data" ON public.user_questionnaire_data;

CREATE POLICY "Trainers can view assigned clients questionnaire data" 
ON public.user_questionnaire_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM client_trainer_assignments cta
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE cta.trainer_id = auth.uid()
      AND cta.client_id = user_questionnaire_data.user_id
      AND cta.is_active = true
      AND p.role = 'trainer'
  )
);