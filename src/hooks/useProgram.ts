import { supabase } from "@/integrations/supabase/client";
import { setsFrom5RM } from '../lib/calc';
import { chooseSplit, getSplitDays } from '../lib/program-helpers';

type Anchor = 'chest_press' | 'vertical_pull' | 'shoulder_press' | 'leg_press' | 'hip_hinge';

async function getUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('no user');
  return data.user;
}

export async function generateProgram(startDateISO: string) {
  const user = await getUser();

  // 1) читаем ответы анкеты (если есть)
  const { data: q } = await supabase
    .from('user_questionnaire_data')
    .select('age_range,limitations')
    .eq('user_id', user.id)
    .maybeSingle();

  const split = chooseSplit(q || {});

  // 2) создаём программу на 12 недель
  const start = new Date(startDateISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 7 * 12);

  const { data: program, error: pErr } = await supabase
    .from('workout_programs')
    .insert({
      user_id: user.id,
      name: '12-недельная программа',
      description: 'Автогенерация',
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      split
    })
    .select('*')
    .single();
  if (pErr) throw pErr;

  // 3) предзагрузка 5ПМ
  const { data: maxes } = await supabase
    .from('user_test_maxes')
    .select('anchor_key,five_rm_kg')
    .eq('user_id', user.id);

  const fiveRMMap = new Map<Anchor, number>();
  (maxes || []).forEach(m => {
    if (m.five_rm_kg != null) fiveRMMap.set(m.anchor_key as Anchor, Number(m.five_rm_kg));
  });

  // 4) получаем пул упражнений по группам (соответствует реальным названиям в БД)
  const pools: Record<string, string[]> = {
    PUSH: ['Грудь', 'Плечи', 'Руки'], // Грудь, плечи и руки (трицепс в жимах)
    PULL: ['Спина', 'Руки'], // Спина и руки (бицепс в тягах)
    LEGS: ['Ноги'], // Все упражнения для ног
    UPPER: ['Грудь', 'Плечи', 'Спина', 'Руки'], // Весь верх тела
    LOWER: ['Ноги'], // Весь низ тела
    FULL: ['Грудь', 'Спина', 'Ноги', 'Плечи'] // Основные группы для фулл-боди
  };

  const splitDays = getSplitDays(split);

  // Найдем ближайший понедельник от стартовой даты
  const startDate = new Date(startDateISO);
  const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday
  const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7; // Если воскресенье, то +1, иначе до следующего понедельника
  const nearestMonday = new Date(startDate);
  if (daysToMonday > 0) {
    nearestMonday.setDate(startDate.getDate() + daysToMonday);
  }

  // Массив дней недели для тренировок: Пн(0), Ср(2), Пт(4)
  const workoutDays = [0, 2, 4]; // Понедельник, Среда, Пятница

  for (let w = 0; w < 12; w++) {
    for (let d = 0; d < 3; d++) {
      const dayType = splitDays[d];
      const dayDate = new Date(nearestMonday);
      dayDate.setDate(nearestMonday.getDate() + w * 7 + workoutDays[d]);

      // создаём сессию
      const { data: session, error: sErr } = await supabase
        .from('workout_sessions')
        .insert({
          program_id: program.id,
          user_id: user.id,
          scheduled_date: dayDate.toISOString().slice(0, 10),
          name: `Нед ${w + 1} / День ${d + 1} (${dayType})`,
          split_day: dayType
        })
        .select('*')
        .single();
      if (sErr) throw sErr;

      // выбираем упражнения из БД по muscle_groups.name с рандомизацией
      const { data: muscleGroups } = await supabase
        .from('muscle_groups')
        .select('id,name')
        .in('name', pools[dayType]);

      if (muscleGroups && muscleGroups.length > 0) {
        // Получаем все упражнения для этих групп мышц
        const { data: allExercises } = await supabase
          .from('exercises')
          .select('id,name,anchor_key, muscle_group_id, created_at')
          .in('muscle_group_id', muscleGroups.map(g => g.id));

        // Рандомизируем и выбираем 5-6 упражнений
        const exs = allExercises ? 
          [...allExercises].sort(() => 0.5 - Math.random()).slice(0, 6) :
          [];

        let order = 1;
        for (const ex of exs) {
          // создаём запись упражнения в сессии
          const { data: se, error: seErr } = await supabase
            .from('workout_exercises')
            .insert({
              session_id: session.id,
              exercise_id: ex.id,
              sets: 3,     // для совместимости с твоей схемой
              reps: 0,     // фактические повторы по сетам ниже
              order_number: order++
            })
            .select('*')
            .single();
          if (seErr) throw seErr;

          // считаем сеты 15-12-10
          const fiveRM = ex.anchor_key ? fiveRMMap.get(ex.anchor_key as Anchor) : undefined;
          const sets = setsFrom5RM(fiveRM);

          // вставляем 3 строки в workout_exercise_sets
          for (const s of sets) {
            const { error: insErr } = await supabase
              .from('workout_exercise_sets')
              .insert({
                workout_exercise_id: se.id,
                set_no: s.set_no,
                reps: s.reps,
                weight_kg: s.weight_kg,           // если есть 5ПМ — сюда кг
                pct_of_5rm: s.pct_of_5rm          // если нет — сюда %
              });
            if (insErr) throw insErr;
          }
        }
      }
    }
  }

  return { programId: program.id };
}

export async function regenerateProgram(startDateISO: string, selectedSplit?: string) {
  const user = await getUser();

  // 1) Завершаем текущую программу (если есть)
  const { data: currentProgram } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (currentProgram) {
    // Устанавливаем дату окончания текущей программы на вчерашний день
    const yesterday = new Date(startDateISO);
    yesterday.setDate(yesterday.getDate() - 1);
    
    await supabase
      .from('workout_programs')
      .update({ end_date: yesterday.toISOString().slice(0, 10) })
      .eq('id', currentProgram.id);
  }

  // 2) Создаем новую программу с выбранным сплитом
  const { data: q } = await supabase
    .from('user_questionnaire_data')
    .select('age_range,limitations')
    .eq('user_id', user.id)
    .maybeSingle();

  const split = selectedSplit || chooseSplit(q || {});

  // 3) Генерируем новую программу
  return generateProgram(startDateISO);
}

export async function logSet({
  session_id,
  exercise_id,
  set_no,
  reps,
  weight_kg
}: {
  session_id: string;
  exercise_id: string;
  set_no: number;
  reps: number;
  weight_kg: number;
}) {
  const user = (await supabase.auth.getUser()).data.user!;
  
  // лог
  await supabase.from('workout_logs').insert({
    user_id: user.id,
    session_id,
    exercise_id,
    actual_sets: 1,
    actual_reps: reps,
    actual_weight: weight_kg
  });

  // апдейт 5ПМ при условии
  if (reps === 5 && weight_kg != null) {
    const { data: ex } = await supabase
      .from('exercises')
      .select('anchor_key')
      .eq('id', exercise_id)
      .single();
    
    if (ex?.anchor_key) {
      const { data: cur } = await supabase
        .from('user_test_maxes')
        .select('five_rm_kg')
        .eq('user_id', user.id)
        .eq('anchor_key', ex.anchor_key)
        .maybeSingle();
      
      if (!cur?.five_rm_kg || weight_kg > Number(cur.five_rm_kg)) {
        await supabase.from('user_test_maxes').upsert({
          user_id: user.id,
          anchor_key: ex.anchor_key,
          five_rm_kg: weight_kg
        });
        // по желанию: показать тост "5ПМ обновлён"
      }
    }
  }
}