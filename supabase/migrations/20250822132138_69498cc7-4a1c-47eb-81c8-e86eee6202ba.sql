-- 1) exercises: добавляем якорь 5ПМ
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS anchor_key text
  CHECK (anchor_key IS NULL OR anchor_key IN (
    'chest_press','vertical_pull','shoulder_press','leg_press','hip_hinge'
  ));

-- 2) 5ПМ пользователя по якорю
CREATE TABLE IF NOT EXISTS public.user_test_maxes (
  user_id uuid NOT NULL,
  anchor_key text NOT NULL CHECK (anchor_key IN (
    'chest_press','vertical_pull','shoulder_press','leg_press','hip_hinge'
  )),
  five_rm_kg numeric,
  measured_at date DEFAULT CURRENT_DATE,
  PRIMARY KEY (user_id, anchor_key)
);

-- Enable RLS
ALTER TABLE public.user_test_maxes ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_test_maxes
CREATE POLICY "Users can manage own test maxes" 
ON public.user_test_maxes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3) Сеты для каждого упражнения в сессии (15-12-10; кг или %)
CREATE TABLE IF NOT EXISTS public.workout_exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid NOT NULL
    REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_no int NOT NULL CHECK (set_no BETWEEN 1 AND 3),
  reps int NOT NULL,
  weight_kg numeric NULL,          -- если есть 5ПМ
  pct_of_5rm numeric NULL,         -- если 5ПМ нет (0.7778/0.8333/0.875)
  UNIQUE (workout_exercise_id, set_no),
  CHECK (
    (weight_kg IS NOT NULL AND pct_of_5rm IS NULL)
    OR (weight_kg IS NULL AND pct_of_5rm IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.workout_exercise_sets ENABLE ROW LEVEL SECURITY;

-- RLS policy for workout_exercise_sets (через связь с user_id)
CREATE POLICY "Users can manage own sets" 
ON public.workout_exercise_sets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_exercise_sets.workout_exercise_id 
    AND ws.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_exercise_sets.workout_exercise_id 
    AND ws.user_id = auth.uid()
  )
);

-- 4) Дополняем программы и сессии типами сплита
ALTER TABLE public.workout_programs
  ADD COLUMN IF NOT EXISTS split text
  CHECK (split IN ('PPL','ULF','FULLx3'));

ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS split_day text
  CHECK (split_day IN ('PUSH','PULL','LEGS','UPPER','LOWER','FULL'));