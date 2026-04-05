// types/index.ts

// Video Status
export type VideoStatus = 'NOT_STARTED' | 'WATCHING' | 'COMPLETED';

// Takeaways Status
export type TakeawaysStatus = 'none' | 'generating' | 'completed' | 'error';

// Day of week for scheduling
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Daily Schedule (minutes per day)
export type DailySchedule = {
  [key in DayOfWeek]: number;
};

// User Preferences
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  dailyReminder?: string; // Time like "09:00"
  weekStartsOn?: 'sunday' | 'monday';
}

// Base User
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  streak: number;
  lastActive: Date;
  totalWatchTime: number;
  dailySchedule?: DailySchedule | null;
  preferences?: UserPreferences | null;
}

// Session User (minimal)
export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

// Video
export interface Video {
  id: string;
  playlistId: string;
  videoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  durationSeconds: number;
  position: number;
  status: VideoStatus;
  lastWatchedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  aiTakeaways: string | null;
  shortTakeaway: string | null;
  takeawaysStatus: TakeawaysStatus | null;
  needsPractice: boolean;
  practiceNotes: string | null;
  watchProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

// Playlist
export interface Playlist {
  id: string;
  userId: string;
  playlistId: string;
  title: string;
  description: string | null;
  category: string;
  thumbnailUrl: string | null;
  totalVideos: number;
  completedVideos: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
  lastWatchedAt: Date | null;
  targetDate: Date | null;
  dailyTarget: number | null;
  targetVideos: number | null;
  isOverdue: boolean;
  overdueFrom: Date | null;
}

// Milestone
export interface Milestone {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  category: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Combined Types
export interface PlaylistWithVideos extends Playlist {
  videos: Video[];
  _count?: {
    videos: number;
  };
}

export interface VideoWithPlaylist extends Video {
  playlist?: Playlist;
}

// Dashboard Stats
export interface DashboardStats {
  totalPlaylists: number;
  totalVideos: number;
  completedVideos: number;
  watchingVideos: number;
  overallProgress: number;
  weekProgress: number;
  streak: number;
  categoriesProgress: CategoryProgress[];
  todayTarget: TodayTarget | null;
}

export interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

// Today's Target
export interface TodayTarget {
  totalMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  videosTarget: number;
  videosCompleted: number;
  onTrack: boolean;
  playlists: PlaylistDailyTarget[];
}

export interface PlaylistDailyTarget {
  playlistId: string;
  playlistTitle: string;
  targetVideos: number;
  targetMinutes: number;
  remainingDays: number;
  isOverdue: boolean;
  daysOverdue: number;
}

// Recent Activity
export interface RecentVideo {
  id: string;
  title: string;
  status: VideoStatus;
  updatedAt: Date;
  playlistId: string;
  playlist: {
    title: string;
    category: string;
  } | null;
}

// AI Takeaways - Enhanced with tables, comparisons, etc.
export interface EnhancedTakeaways {
  summary: string;
  shortSummary: string; // 1-2 line summary for card
  keyPoints: string[];
  codeSnippets?: CodeSnippet[];
  tables?: TakeawayTable[];
  comparisons?: Comparison[];
  practiceIdeas: string[];
  prerequisites?: string[];
  nextSteps?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedPracticeTime: string;
  conceptsExplained?: ConceptExplanation[];
  warnings?: string[];
  tips?: string[];
  resources?: Resource[];
}

// Card Takeaway - Short but meaningful summary for video card
export interface CardTakeaway {
  headline: string;
  keyInsights: string[];
  quickTip?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}


export interface CodeSnippet {
  language: string;
  code: string;
  explanation: string;
  title?: string;
}

export interface TakeawayTable {
  title: string;
  headers: string[];
  rows: string[][];
  description?: string;
}

export interface Comparison {
  title: string;
  items: ComparisonItem[];
}

export interface ComparisonItem {
  name: string;
  pros: string[];
  cons: string[];
  useCase: string;
}

export interface ConceptExplanation {
  concept: string;
  explanation: string;
  example?: string;
}

export interface Resource {
  title: string;
  url?: string;
  type: 'documentation' | 'article' | 'video' | 'github' | 'other';
}

// Practice Suggestion
export interface PracticeSuggestion {
  id: string;
  type: 'project' | 'exercise' | 'challenge' | 'review';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  skills: string[];
  steps: string[];
  tips?: string[];
  expectedOutcome: string;
}

// Target Settings
export interface TargetSettings {
  targetDate: string | null;
  dailyTarget: number | null;
  targetVideos: number | null;
  autoCalculate: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface PlaylistFormData {
  url: string;
  category: string;
}

export interface MilestoneFormData {
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
}

export interface VideoUpdateData {
  status?: VideoStatus;
  notes?: string;
  needsPractice?: boolean;
  practiceNotes?: string;
  watchProgress?: number;
}

export interface ScheduleFormData {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}