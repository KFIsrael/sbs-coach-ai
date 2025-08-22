import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Auth
    'auth.title': 'Sport Body System',
    'auth.subtitle': 'Your Personal AI Fitness Coach',
    'auth.name': 'Full Name',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.demo': 'Demo Access',
    'auth.switch_to_login': 'Already have an account?',
    'auth.switch_to_register': 'Need an account?',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.ready_to_train': 'Ready to train?',
    'dashboard.current_streak': 'Current Streak',
    'dashboard.days': 'days',
    'dashboard.this_week': 'This Week',
    'dashboard.workouts': 'workouts',
    'dashboard.start_workout': 'Start Workout',
    'dashboard.view_programs': 'View Programs',
    'dashboard.ai_coach': 'AI Coach',
    'dashboard.logout': 'Logout',
    
    // Questionnaire
    'questionnaire.title': 'Fitness Assessment',
    'questionnaire.back': 'Back',
    'questionnaire.next': 'Next',
    'questionnaire.complete': 'Complete',
    'questionnaire.generating': 'Creating your personalized training program...',
    'questionnaire.assessment_complete': 'Assessment Complete!',
    'questionnaire.choose_option': 'Choose the option that best describes you',
    
    // Questions
    'question.fitness_goal': "What's your primary fitness goal?",
    'question.fitness_level': "What's your current fitness level?", 
    'question.age': 'What is your age?',
    'question.limitations': 'Do you have any injuries or physical limitations?',
    'question.equipment': 'What equipment do you have access to?',
    
    // Answer options
    'goal.weight_loss': 'Weight Loss',
    'goal.muscle_gain': 'Muscle Gain', 
    'goal.endurance': 'Improve Endurance',
    'goal.strength': 'Build Strength',
    'goal.general_fitness': 'General Fitness',
    
    'level.beginner': 'Beginner - Just starting out',
    'level.intermediate': 'Intermediate - Some experience',
    'level.advanced': 'Advanced - Regular training',
    'level.expert': 'Expert - Competitive level',
    
    'age.18-25': '18-25 years old',
    'age.26-35': '26-35 years old',
    'age.36-45': '36-45 years old', 
    'age.46-55': '46-55 years old',
    'age.56+': '56+ years old',
    
    'limitations.none': 'No limitations',
    'limitations.back': 'Back problems',
    'limitations.knee': 'Knee issues',
    'limitations.shoulder': 'Shoulder problems',
    'limitations.other': 'Other limitations',
    
    'equipment.full_gym': 'Full gym access',
    'equipment.home_basic': 'Basic home equipment',
    'equipment.bodyweight': 'Bodyweight only',
    'equipment.dumbbells': 'Dumbbells/bands',
    
    // Program Choice
    'program_choice.title': 'Choose Your Program',
    'program_choice.subtitle': 'How would you like to create your personalized workout?',
    'program_choice.ai_generation': 'AI Generation',
    'program_choice.ai_description': 'Generate program based on your assessment answers',
    'program_choice.test_workout': 'Test Workout',
    'program_choice.test_description': 'Take a fitness test for more accurate program',
    
    // Workout
    'workout.day': 'Day',
    'workout.duration': 'Duration',
    'workout.exercises': 'exercises',
    'workout.start_workout': 'Start Workout',
    'workout.back_to_programs': 'Back to Programs',
    'workout.complete_workout': 'Complete Workout',
    'workout.rest_timer': 'Rest Timer',
    'workout.next_exercise': 'Next Exercise',
    'workout.workout_complete': 'Workout Complete!',
    'workout.great_job': 'Great job on completing your workout!',
    'workout.progress_saved': 'Your progress has been saved.',
    
    // AI Chat
    'chat.title': 'AI Fitness Coach',
    'chat.placeholder': 'Ask me about workouts, nutrition, or fitness...',
    'chat.send': 'Send',
    'chat.close': 'Close',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.language': 'Language',
    'common.english': 'English',
    'common.russian': 'Русский',
  },
  ru: {
    // Auth
    'auth.title': 'Sport Body System',
    'auth.subtitle': 'Ваш Персональный Фитнес-Партнер',
    'auth.name': 'Полное имя',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.login': 'Войти',
    'auth.register': 'Создать аккаунт',
    'auth.demo': 'Демо доступ',
    'auth.switch_to_login': 'Уже есть аккаунт?',
    'auth.switch_to_register': 'Нужен аккаунт?',
    
    // Dashboard
    'dashboard.welcome': 'С возвращением',
    'dashboard.ready_to_train': 'Готовы тренироваться?',
    'dashboard.current_streak': 'Текущая серия',
    'dashboard.days': 'дней',
    'dashboard.this_week': 'На этой неделе',
    'dashboard.workouts': 'тренировок',
    'dashboard.start_workout': 'Начать тренировку',
    'dashboard.view_programs': 'Посмотреть программы',
    'dashboard.ai_coach': 'ИИ Тренер',
    'dashboard.logout': 'Выйти',
    
    // Questionnaire
    'questionnaire.title': 'Фитнес Оценка',
    'questionnaire.back': 'Назад',
    'questionnaire.next': 'Далее',
    'questionnaire.complete': 'Завершить',
    'questionnaire.generating': 'Создаем вашу персональную программу тренировок...',
    'questionnaire.assessment_complete': 'Оценка завершена!',
    'questionnaire.choose_option': 'Выберите вариант, который лучше всего описывает вас',
    
    // Questions
    'question.fitness_goal': 'Какая ваша основная фитнес-цель?',
    'question.fitness_level': 'Каков ваш текущий уровень физической подготовки?',
    'question.age': 'Сколько вам лет?',
    'question.limitations': 'Есть ли у вас травмы или физические ограничения?',
    'question.equipment': 'К какому оборудованию у вас есть доступ?',
    
    // Answer options
    'goal.weight_loss': 'Похудение',
    'goal.muscle_gain': 'Набор мышечной массы',
    'goal.endurance': 'Улучшение выносливости',
    'goal.strength': 'Развитие силы',
    'goal.general_fitness': 'Общая физическая форма',
    
    'level.beginner': 'Новичок - только начинаю',
    'level.intermediate': 'Средний - есть опыт',
    'level.advanced': 'Продвинутый - регулярные тренировки',
    'level.expert': 'Эксперт - соревновательный уровень',
    
    'age.18-25': '18-25 лет',
    'age.26-35': '26-35 лет',
    'age.36-45': '36-45 лет',
    'age.46-55': '46-55 лет',
    'age.56+': '56+ лет',
    
    'limitations.none': 'Нет ограничений',
    'limitations.back': 'Проблемы со спиной',
    'limitations.knee': 'Проблемы с коленями',
    'limitations.shoulder': 'Проблемы с плечами',
    'limitations.other': 'Другие ограничения',
    
    'equipment.full_gym': 'Полный доступ к залу',
    'equipment.home_basic': 'Базовое домашнее оборудование',
    'equipment.bodyweight': 'Только собственный вес',
    'equipment.dumbbells': 'Гантели/резинки',
    
    // Program Choice
    'program_choice.title': 'Выберите вашу программу',
    'program_choice.subtitle': 'Как вы хотите создать персонализированную тренировку?',
    'program_choice.ai_generation': 'ИИ Генерация',
    'program_choice.ai_description': 'Генерировать программу на основе ваших ответов',
    'program_choice.test_workout': 'Тестовая тренировка',
    'program_choice.test_description': 'Пройти фитнес-тест для более точной программы',
    
    // Workout
    'workout.day': 'День',
    'workout.duration': 'Длительность',
    'workout.exercises': 'упражнений',
    'workout.start_workout': 'Начать тренировку',
    'workout.back_to_programs': 'Назад к программам',
    'workout.complete_workout': 'Завершить тренировку',
    'workout.rest_timer': 'Таймер отдыха',
    'workout.next_exercise': 'Следующее упражнение',
    'workout.workout_complete': 'Тренировка завершена!',
    'workout.great_job': 'Отличная работа! Вы завершили тренировку!',
    'workout.progress_saved': 'Ваш прогресс сохранен.',
    
    // AI Chat
    'chat.title': 'ИИ Фитнес-Тренер',
    'chat.placeholder': 'Спросите меня о тренировках, питании или фитнесе...',
    'chat.send': 'Отправить',
    'chat.close': 'Закрыть',
    
    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успех',
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.language': 'Язык',
    'common.english': 'English',
    'common.russian': 'Русский',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}