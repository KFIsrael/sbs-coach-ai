-- Add body_type column to user_questionnaire_data table for the new question about body type
ALTER TABLE user_questionnaire_data 
ADD COLUMN body_type text;

-- Update the table to handle the new question structure