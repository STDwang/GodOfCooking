import type { DifficultyLevel } from '../data/difficulty';

export interface DishRecord {
  bestScore: number;
  bestStars: 1 | 2 | 3;
  completions: number;
}

export interface ChefProgress {
  dishes: Record<string, DishRecord>;
  blitzBestCuts: number;
  bookmarks: string[];
  muted: boolean;
  difficulty: DifficultyLevel;
}

const STORAGE_KEY = 'woshichushen_progress_v1';

const DEFAULT_PROGRESS: ChefProgress = {
  dishes: {},
  blitzBestCuts: 0,
  bookmarks: [],
  muted: false,
  difficulty: 'novice',
};

export function loadChefProgress(): ChefProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<ChefProgress>;
    const diff =
      parsed.difficulty === 'novice' ||
      parsed.difficulty === 'expert' ||
      parsed.difficulty === 'master'
        ? parsed.difficulty
        : 'novice';
    return {
      dishes: parsed.dishes && typeof parsed.dishes === 'object' ? parsed.dishes : {},
      blitzBestCuts: typeof parsed.blitzBestCuts === 'number' ? parsed.blitzBestCuts : 0,
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      muted: Boolean(parsed.muted),
      difficulty: diff,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveChefProgress(progress: ChefProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}
