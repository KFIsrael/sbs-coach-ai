-- Добавляем группы мышц
INSERT INTO muscle_groups (id, name, description) VALUES
  (gen_random_uuid(), 'Ноги', 'Мышцы нижних конечностей'),
  (gen_random_uuid(), 'Грудь', 'Грудные мышцы'),
  (gen_random_uuid(), 'Руки', 'Мышцы рук'),
  (gen_random_uuid(), 'Спина', 'Мышцы спины'),
  (gen_random_uuid(), 'Плечи', 'Дельтовидные мышцы');

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
  (gen_random_uuid(), 'Задняя дельтовидная', (SELECT id FROM muscle_group_ids WHERE name = 'Плечи'));

-- Добавляем упражнения для ног
WITH muscle_ids AS (
  SELECT m.id, m.name, mg.name as group_name 
  FROM muscles m 
  JOIN muscle_groups mg ON m.muscle_group_id = mg.id
)
INSERT INTO exercises (id, name, description, muscle_group_id, anchor_key, target_muscles) VALUES
  -- Ноги
  (gen_random_uuid(), 'Фронтальные приседания', 'Приседания с штангой на груди', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Приседания со штангой (классические)', 'Классические приседания со штангой на плечах', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'back_squat', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра'), (SELECT id FROM muscle_ids WHERE name = 'Разгибатели спины')]),
  (gen_random_uuid(), 'Жим ногами, узкая постановка, низко', 'Жим ногами в тренажере с узкой постановкой ног внизу платформы', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_press_narrow_low', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Икроножные мышцы')]),
  (gen_random_uuid(), 'Жим ногами, узкая постановка, высоко', 'Жим ногами в тренажере с узкой постановкой ног вверху платформы', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_press_narrow_high', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра'), (SELECT id FROM muscle_ids WHERE name = 'Икроножные мышцы')]),
  (gen_random_uuid(), 'Жим ногами, широкая постановка, низко', 'Жим ногами в тренажере с широкой постановкой ног внизу платформы', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_press_wide_low', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Приводящие мышцы бедра'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Жим ногами, широкая постановка, высоко', 'Жим ногами в тренажере с широкой постановкой ног вверху платформы', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_press_wide_high', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра'), (SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Приводящие мышцы бедра')]),
  (gen_random_uuid(), 'Выпады вперёд с гантелями', 'Выпады вперёд с гантелями в руках', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'lunges_forward_db', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Выпады вперёд со штангой', 'Выпады вперёд со штангой на плечах', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'lunges_forward_bb', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Выпады назад с гантелями', 'Выпады назад с гантелями в руках', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'lunges_reverse_db', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Выпады назад со штангой', 'Выпады назад со штангой на плечах', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'lunges_reverse_bb', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Румынская тяга', 'Становая тяга на прямых ногах', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'hip_hinge', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Разгибатели спины'), (SELECT id FROM muscle_ids WHERE name = 'Трапециевидные мышцы')]),
  (gen_random_uuid(), 'Болгарские сплит-приседания', 'Приседания на одной ноге с опорой задней ноги', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'bulgarian_split_squats', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы'), (SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Подъём на носки стоя в тренажёре', 'Подъемы на носки стоя в специальном тренажере', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'calf_raise_machine', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Икроножные мышцы')]),
  (gen_random_uuid(), 'Подъём на носки стоя со штангой', 'Подъемы на носки стоя со штангой на плечах', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'calf_raise_barbell', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Икроножные мышцы')]),
  (gen_random_uuid(), 'Сгибание ног лёжа в тренажёре', 'Сгибание ног лежа в тренажере', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_curl_lying', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра')]),
  (gen_random_uuid(), 'Ягодичный мостик со штангой', 'Подъемы таза со штангой', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'hip_thrust_barbell', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Ягодицы'), (SELECT id FROM muscle_ids WHERE name = 'Бицепс бедра'), (SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы')]),
  (gen_random_uuid(), 'Разгибание ног, носки параллельно', 'Разгибание ног в тренажере с параллельными носками', (SELECT id FROM muscle_groups WHERE name = 'Ноги'), 'leg_extension', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Квадрицепсы')]);

-- Добавляем упражнения для груди
INSERT INTO exercises (id, name, description, muscle_group_id, anchor_key, target_muscles) VALUES
  (gen_random_uuid(), 'Жим штанги лёжа на горизонтальной скамье', 'Классический жим штанги лежа', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'chest_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Большая грудная мышца')]),
  (gen_random_uuid(), 'Жим штанги лёжа на наклонной скамье вверх', 'Жим штанги на наклонной скамье под углом вверх', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'incline_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Верх грудных')]),
  (gen_random_uuid(), 'Жим штанги лёжа на наклонной скамье вниз (обратный угол)', 'Жим штанги на наклонной скамье под углом вниз', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'decline_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Ниж грудных')]),
  (gen_random_uuid(), 'Жим гантелей на горизонтальной скамье', 'Жим гантелей лежа на горизонтальной скамье', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'db_chest_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Большая грудная мышца')]),
  (gen_random_uuid(), 'Жим гантелей на наклонной скамье вверх', 'Жим гантелей на наклонной скамье под углом вверх', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'db_incline_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Верх грудных')]),
  (gen_random_uuid(), 'Отжимания на брусьях с наклоном вперёд', 'Отжимания на брусьях с наклоном корпуса вперед', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'dips_chest', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Ниж грудных'), (SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Разводка гантелей на горизонтальной скамье', 'Разведение гантелей лежа на горизонтальной скамье', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'db_flyes_flat', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Большая грудная мышца')]),
  (gen_random_uuid(), 'Разводка гантелей на наклонной скамье вверх', 'Разведение гантелей на наклонной скамье', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'db_flyes_incline', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Верх грудных')]),
  (gen_random_uuid(), 'Пуловер с гантелью', 'Пуловер с гантелью лежа', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'pullover_db', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Грудные'), (SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Кроссоверы с верхних блоков', 'Сведение рук в кроссовере с верхних блоков', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'cable_crossover_high', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Ниж грудных')]),
  (gen_random_uuid(), 'Кроссоверы с нижних блоков', 'Сведение рук в кроссовере с нижних блоков', (SELECT id FROM muscle_groups WHERE name = 'Грудь'), 'cable_crossover_low', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Верх грудных')]);

-- Добавляем упражнения для трицепсов
INSERT INTO exercises (id, name, description, muscle_group_id, anchor_key, target_muscles) VALUES
  (gen_random_uuid(), 'Жим штанги узким хватом', 'Жим штанги лежа узким хватом', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'close_grip_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Отжимания на брусьях с вертикальным корпусом', 'Отжимания на брусьях с прямым корпусом', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'dips_triceps', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Французский жим лёжа со штангой', 'Французский жим со штангой лежа', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'skull_crushers_bb', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Французский жим лёжа с гантелями', 'Французский жим с гантелями лежа', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'skull_crushers_db', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Разгибания на блоке с канатной рукоятью', 'Разгибания рук на верхнем блоке с канатом', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'tricep_pushdown_rope', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]),
  (gen_random_uuid(), 'Разгибания на блоке с прямой рукоятью', 'Разгибания рук на верхнем блоке с прямой рукоятью', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'tricep_pushdown_straight', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трицепс')]);

-- Добавляем упражнения для бицепсов  
INSERT INTO exercises (id, name, description, muscle_group_id, anchor_key, target_muscles) VALUES
  (gen_random_uuid(), 'Подъём штанги с прямым грифом', 'Сгибания рук со штангой стоя', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'barbell_curl', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс')]),
  (gen_random_uuid(), 'Подъём штанги с изогнутым грифом (EZ-гриф)', 'Сгибания рук с EZ-штангой', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'ez_curl', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс')]),
  (gen_random_uuid(), 'Подъём гантелей стоя с супинацией', 'Сгибания рук с гантелями стоя с поворотом кисти', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'db_curl_supination', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс')]),
  (gen_random_uuid(), 'Молотковые сгибания стоя попеременно', 'Молотковые сгибания гантелей попеременно', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'hammer_curls_alt', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс'), (SELECT id FROM muscle_ids WHERE name = 'Брахиалис')]),
  (gen_random_uuid(), 'Подъём на нижнем блоке с прямой рукоятью', 'Сгибания рук на нижнем блоке', (SELECT id FROM muscle_groups WHERE name = 'Руки'), 'cable_curl_straight', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Бицепс')]);

-- Добавляем упражнения для спины
INSERT INTO exercises (id, name, description, muscle_group_id, anchor_key, target_muscles) VALUES
  (gen_random_uuid(), 'Подтягивания широким хватом прямым', 'Подтягивания широким прямым хватом', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'vertical_pull', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Подтягивания узким хватом прямым', 'Подтягивания узким прямым хватом', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'pullups_narrow', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Тяга штанги в наклоне прямым хватом', 'Тяга штанги к поясу в наклоне', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'bent_over_row', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины'), (SELECT id FROM muscle_ids WHERE name = 'Трапециевидные мышцы'), (SELECT id FROM muscle_ids WHERE name = 'Ромбовидные мышцы')]),
  (gen_random_uuid(), 'Тяга гантели с опорой на скамью', 'Тяга гантели одной рукой с опорой', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'db_row_supported', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Горизонтальная тяга широким хватом', 'Горизонтальная тяга в блочном тренажере широким хватом', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'cable_row_wide', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины'), (SELECT id FROM muscle_ids WHERE name = 'Ромбовидные мышцы')]),
  (gen_random_uuid(), 'Вертикальная тяга широким хватом', 'Тяга верхнего блока широким хватом', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'lat_pulldown_wide', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Широчайшие мышцы спины')]),
  (gen_random_uuid(), 'Шраги со штангой', 'Шраги со штангой для трапеций', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'barbell_shrugs', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Трапециевидные мышцы')]),
  (gen_random_uuid(), 'Гиперэкстензия без веса', 'Гиперэкстензия без дополнительного веса', (SELECT id FROM muscle_groups WHERE name = 'Спина'), 'hyperextension', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Разгибатели спины')]);

-- Добавляем упражнения для плеч
INSERT INTO exercises (id, name, description, muscle_group_id, anchor_key, target_muscles) VALUES
  (gen_random_uuid(), 'Жим штанги стоя перед собой', 'Армейский жим штанги стоя', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'shoulder_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная'), (SELECT id FROM muscle_ids WHERE name = 'Средняя дельтовидная')]),
  (gen_random_uuid(), 'Жим гантелей стоя перед собой', 'Жим гантелей на плечи стоя', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'db_shoulder_press', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная'), (SELECT id FROM muscle_ids WHERE name = 'Средняя дельтовидная')]),
  (gen_random_uuid(), 'Махи в стороны стоя с гантелями', 'Подъемы гантелей через стороны', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'lateral_raises', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Средняя дельтовидная')]),
  (gen_random_uuid(), 'Махи в наклоне стоя с гантелями', 'Разведение гантелей в наклоне для задних дельт', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'rear_delt_flyes', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Задняя дельтовидная')]),
  (gen_random_uuid(), 'Тяга к подбородку со штангой', 'Тяга штанги к подбородку', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'upright_row', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная'), (SELECT id FROM muscle_ids WHERE name = 'Средняя дельтовидная'), (SELECT id FROM muscle_ids WHERE name = 'Трапециевидные мышцы')]),
  (gen_random_uuid(), 'Фронтальные подъёмы со штангой', 'Подъемы штанги перед собой', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'front_raises_bb', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная')]),
  (gen_random_uuid(), 'Фронтальные подъёмы с гантелями', 'Подъемы гантелей перед собой', (SELECT id FROM muscle_groups WHERE name = 'Плечи'), 'front_raises_db', ARRAY[(SELECT id FROM muscle_ids WHERE name = 'Передняя дельтовидная')]);