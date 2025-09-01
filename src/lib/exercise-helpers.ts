import { 
  Dumbbell, 
  Move, 
  Zap, 
  Target, 
  Flame, 
  Activity,
  TrendingUp,
  Crosshair,
  FlameKindling,
  Waves
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ExerciseInfo {
  description: string;
  icon: LucideIcon;
  videoUrl: string;
}

// Карта упражнений с их описаниями и иконками
export const exerciseInfo: Record<string, ExerciseInfo> = {
  // Упражнения для груди
  'Жим штанги лежа': {
    description: 'Базовое упражнение для развития грудных мышц. Лягте на скамью, опустите штангу до груди и выжмите вверх.',
    icon: Dumbbell,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Жим гантелей лежа': {
    description: 'Альтернатива жиму штанги с большей амплитудой движения. Развивает грудные мышцы и стабилизаторы.',
    icon: Target,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Отжимания от пола': {
    description: 'Классическое упражнение с собственным весом для укрепления груди, плеч и трицепсов.',
    icon: Activity,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Разведение гантелей': {
    description: 'Изолирующее упражнение для проработки внутренней части грудных мышц.',
    icon: Move,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  
  // Упражнения для спины
  'Подтягивания': {
    description: 'Комплексное упражнение для развития широчайших мышц спины и бицепсов.',
    icon: TrendingUp,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Тяга штанги в наклоне': {
    description: 'Базовое упражнение для толщины спины. Наклонитесь и тяните штангу к нижней части груди.',
    icon: Crosshair,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Становая тяга': {
    description: 'Одно из самых эффективных базовых упражнений. Развивает всю заднюю цепь мышц.',
    icon: Flame,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Тяга гантели одной рукой': {
    description: 'Односторонняя тяга для проработки широчайших мышц с упором на колено.',
    icon: Target,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  
  // Упражнения для ног
  'Приседания со штангой': {
    description: 'Король упражнений для ног. Развивает квадрицепсы, ягодичные и мышцы кора.',
    icon: FlameKindling,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Жим ногами': {
    description: 'Безопасная альтернатива приседаниям в тренажере для мощной проработки ног.',
    icon: Zap,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Выпады с гантелями': {
    description: 'Функциональное упражнение для ног с акцентом на ягодичные мышцы.',
    icon: Move,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Румынская тяга': {
    description: 'Специализированная тяга для проработки задней поверхности бедра и ягодиц.',
    icon: Waves,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  
  // Упражнения для плеч
  'Жим штанги стоя': {
    description: 'Базовое упражнение для развития дельтовидных мышц и укрепления кора.',
    icon: TrendingUp,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Жим гантелей сидя': {
    description: 'Изолированная проработка плеч в положении сидя для лучшего контроля.',
    icon: Target,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Разведение гантелей в стороны': {
    description: 'Изолирующее упражнение для средних пучков дельтовидных мышц.',
    icon: Move,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  
  // Упражнения для рук
  'Подъем штанги на бицепс': {
    description: 'Классическое упражнение для развития бицепсов. Концентрируйтесь на чистой технике.',
    icon: Dumbbell,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Французский жим': {
    description: 'Изолирующее упражнение для трицепсов. Опускайте штангу за голову контролируемо.',
    icon: Target,
    videoUrl: 'https://designpavlov.ru/sbs'
  },
  'Отжимания на брусьях': {
    description: 'Комплексное упражнение для трицепсов и нижней части грудных мышц.',
    icon: Activity,
    videoUrl: 'https://designpavlov.ru/sbs'
  }
};

// Функция для получения информации об упражнении
export function getExerciseInfo(exerciseName: string): ExerciseInfo {
  return exerciseInfo[exerciseName] || {
    description: 'Эффективное упражнение для развития целевых мышечных групп. Соблюдайте правильную технику.',
    icon: Dumbbell,
    videoUrl: 'https://designpavlov.ru/sbs'
  };
}

// Функция для поиска ключевых слов в названии упражнения
export function getExerciseInfoByKeywords(exerciseName: string): ExerciseInfo {
  const name = exerciseName.toLowerCase();
  
  // Поиск по ключевым словам
  if (name.includes('жим') && (name.includes('лежа') || name.includes('гориз'))) {
    return exerciseInfo['Жим штанги лежа'];
  }
  if (name.includes('жим') && name.includes('гантел')) {
    return exerciseInfo['Жим гантелей лежа'];
  }
  if (name.includes('отжим')) {
    return exerciseInfo['Отжимания от пола'];
  }
  if (name.includes('подтягив')) {
    return exerciseInfo['Подтягивания'];
  }
  if (name.includes('тяга') && name.includes('наклон')) {
    return exerciseInfo['Тяга штанги в наклоне'];
  }
  if (name.includes('стан') && name.includes('тяга')) {
    return exerciseInfo['Становая тяга'];
  }
  if (name.includes('присед')) {
    return exerciseInfo['Приседания со штангой'];
  }
  if (name.includes('жим') && name.includes('ног')) {
    return exerciseInfo['Жим ногами'];
  }
  if (name.includes('выпад')) {
    return exerciseInfo['Выпады с гантелями'];
  }
  if (name.includes('жим') && (name.includes('стоя') || name.includes('плеч'))) {
    return exerciseInfo['Жим штанги стоя'];
  }
  if (name.includes('бицепс')) {
    return exerciseInfo['Подъем штанги на бицепс'];
  }
  if (name.includes('франц') || (name.includes('трицепс') && name.includes('жим'))) {
    return exerciseInfo['Французский жим'];
  }
  if (name.includes('брус')) {
    return exerciseInfo['Отжимания на брусьях'];
  }
  
  // Возвращаем дефолтное значение
  return {
    description: 'Эффективное упражнение для развития целевых мышечных групп. Соблюдайте правильную технику выполнения.',
    icon: Dumbbell,
    videoUrl: 'https://designpavlov.ru/sbs'
  };
}