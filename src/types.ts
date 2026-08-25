export type LessonType = 'lesson' | 'game' | 'test' | 'story' | 'intro';

export interface Lesson {
  id: number;
  unitId: number;
  unitTitle: string;
  unitSubtitle?: string;
  title: string;
  type: LessonType;
  description: string;
  targetKeys: string[];
  content: string[]; // List of exercise phrases/paragraphs
  minAccuracy: number; // e.g. 90%
  targetWpm: number; // e.g. 20 WPM
  badgeReward?: string;
  gameType?: 'falling_words' | 'balloons' | 'racer' | 'monster_battle' | 'data_entry_speed_run';
}

export interface Unit {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  description: string;
  lessonIds: number[];
}

export interface LessonResult {
  lessonId: number;
  stars: number; // 0-5
  wpm: number;
  rawWpm: number;
  accuracy: number;
  timeSeconds: number;
  errorCount: number;
  wrongKeys: Record<string, number>;
  completedAt: string;
}

export interface UserStats {
  totalStars: number;
  completedLessonCount: number;
  averageWpm: number;
  averageAccuracy: number;
  totalTimeSpentSeconds: number;
  unlockedBadges: string[];
  currentLessonId: number;
  lessonResults: Record<number, LessonResult>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  unlockedAt?: string;
}

export type SoundTheme = 'mechanical' | 'typewriter' | 'modern' | 'pop' | 'mute';
export type AppTheme = 'edclub' | 'dark' | 'jungle' | 'sunset';
export type Language = 'vi' | 'en';
export type VietnameseInputMethod = 'telex' | 'vni';

export interface UserSettings {
  soundTheme: SoundTheme;
  volume: number; // 0 to 1
  showKeyboard: boolean;
  showHands: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'huge';
  theme: AppTheme;
  language: Language;
  vietnameseInputMethod: VietnameseInputMethod;
  userName: string;
  userAge?: number | string;
  targetWpmGoal: number;
  characterId?: string;
  onboardingCompleted?: boolean;
}

export interface ConsultationInquiry {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  organization?: string;
  serviceCategory: 'coding' | 'office' | 'digital_transformation' | 'automation_data' | 'all';
  notes?: string;
  createdAt: string;
}
