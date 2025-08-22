-- Проставляем якоря упражнениям
UPDATE public.exercises SET anchor_key='chest_press'
WHERE name ILIKE ANY(ARRAY['%Жим%скамь%', '%Хаммер%', '%Peck-Deck%', '%Разводк%']);

UPDATE public.exercises SET anchor_key='vertical_pull'
WHERE name ILIKE ANY(ARRAY['%Подтягив%', '%Вертикальн%тяга%', '%Пуловер%блок%']);

UPDATE public.exercises SET anchor_key='shoulder_press'
WHERE name ILIKE ANY(ARRAY['%Жим%плеч%', '%Арнольд%']);

UPDATE public.exercises SET anchor_key='leg_press'
WHERE name ILIKE ANY(ARRAY['%Жим ног%', '%Разгибан%', '%Выпад%', '%Сплит%']);

UPDATE public.exercises SET anchor_key='hip_hinge'
WHERE name ILIKE ANY(ARRAY['%Румынск%', '%мостик%', '%Сгибан%ног%']);