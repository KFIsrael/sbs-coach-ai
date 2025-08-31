-- Сначала добавляем группы мышц
INSERT INTO muscle_groups (id, name, description) VALUES
  (gen_random_uuid(), 'Ноги', 'Мышцы нижних конечностей'),
  (gen_random_uuid(), 'Грудь', 'Грудные мышцы'),
  (gen_random_uuid(), 'Руки', 'Мышцы рук'),
  (gen_random_uuid(), 'Спина', 'Мышцы спины'),
  (gen_random_uuid(), 'Плечи', 'Дельтовидные мышцы')
ON CONFLICT (name) DO NOTHING;

-- Добавляем мышцы
WITH muscle_group_ids AS (
  SELECT id, name FROM muscle_groups
)
INSERT INTO muscles (id, name, muscle_group_id) VALUES
  -- Ноги
  (gen_random_uuid(), 'Квадрицепсы', (SELECT id FROM muscle_group_ids WHERE name = 'Ноги')),
  (gen_random_uuid(), 'Ягодицы', (SELECT id FROM muscle_group_ids WHERE name = 'Ноги')),
  (gen_random_uuid(), 'Бицепс бедра', (SELECT id FROM muscle_group_ids WHERE name = 'Ноги')),
  (gen_random_uuid(), 'Икроножные мышцы', (SELECT id FROM muscle_group_ids WHERE name = 'Ноги')),
  (gen_random_uuid(), 'Приводящие мышцы бедра', (SELECT id FROM muscle_group_ids WHERE name = 'Ноги')),
  
  -- Грудь
  (gen_random_uuid(), 'Большая грудная мышца', (SELECT id FROM muscle_group_ids WHERE name = 'Грудь')),
  (gen_random_uuid(), 'Верх грудных', (SELECT id FROM muscle_group_ids WHERE name = 'Грудь')),
  (gen_random_uuid(), 'Ниж грудных', (SELECT id FROM muscle_group_ids WHERE name = 'Грудь')),
  (gen_random_uuid(), 'Грудные', (SELECT id FROM muscle_group_ids WHERE name = 'Грудь')),
  
  -- Руки
  (gen_random_uuid(), 'Трицепс', (SELECT id FROM muscle_group_ids WHERE name = 'Руки')),
  (gen_random_uuid(), 'Бицепс', (SELECT id FROM muscle_group_ids WHERE name = 'Руки')),
  (gen_random_uuid(), 'Брахиалис', (SELECT id FROM muscle_group_ids WHERE name = 'Руки')),
  (gen_random_uuid(), 'Мышцы предплечья', (SELECT id FROM muscle_group_ids WHERE name = 'Руки')),
  
  -- Спина
  (gen_random_uuid(), 'Широчайшие мышцы спины', (SELECT id FROM muscle_group_ids WHERE name = 'Спина')),
  (gen_random_uuid(), 'Трапециевидные мышцы', (SELECT id FROM muscle_group_ids WHERE name = 'Спина')),
  (gen_random_uuid(), 'Ромбовидные мышцы', (SELECT id FROM muscle_group_ids WHERE name = 'Спина')),
  (gen_random_uuid(), 'Разгибатели спины', (SELECT id FROM muscle_group_ids WHERE name = 'Спина')),
  
  -- Плечи
  (gen_random_uuid(), 'Передняя дельтовидная', (SELECT id FROM muscle_group_ids WHERE name = 'Плечи')),
  (gen_random_uuid(), 'Средняя дельтовидная', (SELECT id FROM muscle_group_ids WHERE name = 'Плечи')),
  (gen_random_uuid(), 'Задняя дельтовидная', (SELECT id FROM muscle_group_ids WHERE name = 'Плечи'))
ON CONFLICT (name, muscle_group_id) DO NOTHING;

-- Удаляем старый constraint и добавляем новый с большим списком anchor_key
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_anchor_key_check;

-- Добавляем новый constraint с расширенным списком anchor_key
ALTER TABLE exercises ADD CONSTRAINT exercises_anchor_key_check 
CHECK (anchor_key IS NULL OR anchor_key = ANY (ARRAY[
  'chest_press', 'vertical_pull', 'shoulder_press', 'leg_press', 'hip_hinge',
  'back_squat', 'leg_press_narrow_low', 'leg_press_narrow_high', 'leg_press_wide_low', 'leg_press_wide_high',
  'lunges_forward_db', 'lunges_forward_bb', 'lunges_reverse_db', 'lunges_reverse_bb',
  'bulgarian_split_squats', 'calf_raise_machine', 'calf_raise_barbell', 'leg_curl_lying',
  'hip_thrust_barbell', 'leg_extension', 'incline_press', 'decline_press', 'db_chest_press',
  'db_incline_press', 'dips_chest', 'db_flyes_flat', 'db_flyes_incline', 'pullover_db',
  'cable_crossover_high', 'cable_crossover_low', 'close_grip_press', 'dips_triceps',
  'skull_crushers_bb', 'skull_crushers_db', 'tricep_pushdown_rope', 'tricep_pushdown_straight',
  'barbell_curl', 'ez_curl', 'db_curl_supination', 'hammer_curls_alt', 'cable_curl_straight',
  'pullups_narrow', 'bent_over_row', 'db_row_supported', 'cable_row_wide', 'lat_pulldown_wide',
  'barbell_shrugs', 'hyperextension', 'db_shoulder_press', 'lateral_raises', 'rear_delt_flyes',
  'upright_row', 'front_raises_bb', 'front_raises_db'
]::text[]));

-- Теперь добавляем упражнения с существующими anchor_key
WITH muscle_ids AS (
  SELECT m.id, m.name, mg.name as group_name 
  FROM muscles m 
  JOIN muscle_groups mg ON m.muscle_group_id = mg.id
)
INSERT INTO exercises (id, name, description, muscle_group_id, anchor_key, target_muscles) VALUES
  -- Основные упражнения из тестовой тренировки
  (gen_random_uuid(), 'Жим штанги лёжа на горизонтальной скамье', 'Классический жим штанги лежа', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'chest_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Большая грудная мышца')]),
  (gen_random_uuid(), 'Подтягивания широким хватом', 'Подтягивания широким прямым хватом', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'vertical_pull', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Жим штанги стоя', 'Армейский жим штанги стоя', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'shoulder_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная'), (SELECT id FROM muscle_ids WHERE name = 'Средняя дельтовидная')]),
  (gen_random_uuid(), 'Фронтальные приседания', 'Приседания с штангой на груди', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Румынская тяга', 'Становая тяга на прямых ногах', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'hip_hinge', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Разгибатели спины')]),
  
  -- Дополнительные упражнения для ног
  (gen_random_uuid(), 'Приседания со штангой (классические)', 'Классические приседания со штангой на плечах', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'back_squat', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Выпады вперёд с гантелями', 'Выпады вперёд с гантелями в руках', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'lunges_forward_db', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Болгарские сплит-приседания', 'Приседания на одной ноге с опорой задней ноги', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'bulgarian_split_squats', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Разгибание ног', 'Разгибание ног в тренажере', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_extension', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы')]),
  
  -- Упражнения для груди
  (gen_random_uuid(), 'Жим штанги на наклонной скамье', 'Жим штанги на наклонной скамье под углом вверх', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'incline_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Верх грудных')]),
  (gen_random_uuid(), 'Жим гантелей лежа', 'Жим гантелей лежа на горизонтальной скамье', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'db_chest_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Большая грудная мышца')]),
  (gen_random_uuid(), 'Разводка гантелей лежа', 'Разведение гантелей лежа на горизонтальной скамье', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'db_flyes_flat', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Большая грудная мышца')]),
  
  -- Упражнения для рук
  (gen_random_uuid(), 'Жим штанги узким хватом', 'Жим штанги лежа узким хватом', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'close_grip_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Французский жим лёжа', 'Французский жим со штангой лежа', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'skull_crushers_bb', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Подъём штанги на бицепс', 'Сгибания рук со штангой стоя', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'barbell_curl', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс')]),
  (gen_random_uuid(), 'Молотковые сгибания', 'Молотковые сгибания гантелей попеременно', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'hammer_curls_alt', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс'), (SELECT id FROM muscle_ids WHERE name = 'Брахиалис')]),
  
  -- Упражнения для спины
  (gen_random_uuid(), 'Тяга штанги в наклоне', 'Тяга штанги к поясу в наклоне', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'bent_over_row', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины'), (SELECT id FROM muscle_ids WHERE name = 'Ромбовидные мышцы')]),
  (gen_random_uuid(), 'Тяга гантели одной рукой', 'Тяга гантели одной рукой с опорой', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'db_row_supported', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Тяга верхнего блока', 'Тяга верхнего блока широким хватом', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'lat_pulldown_wide', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Шраги со штангой', 'Шраги со штангой для трапеций', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'barbell_shrugs', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трапециевидные мышцы')]),
  
  -- Упражнения для плеч
  (gen_random_uuid(), 'Жим гантелей стоя', 'Жим гантелей на плечи стоя', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'db_shoulder_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная'), (SELECT id FROM muscle_ids WHERE name = 'Средняя дельтовидная')]),
  (gen_random_uuid(), 'Махи в стороны', 'Подъемы гантелей через стороны', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'lateral_raises', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Средняя дельтовидная')]),
  (gen_random_uuid(), 'Махи в наклоне', 'Разведение гантелей в наклоне для задних дельт', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'rear_delt_flyes', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Задняя дельтовидная')]),
  (gen_random_uuid(), 'Фронтальные подъёмы', 'Подъемы гантелей перед собой', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'front_raises_db', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная')]);