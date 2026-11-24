import type { CookStage, PrepIngredient, Recipe } from './recipes';

export type DifficultyLevel = 'novice' | 'expert' | 'master';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  shortTag: string;
  summary: string;
  // Prep variables
  cutCountScale: number; // Novice cuts fewer slices; Master cuts finer
  sweepSpeedScale: number; // Blade alignment oscillation speed
  perfectToleranceScale: number; // Alignment window multiplier (>1 easier, <1 stricter)
  // Cook variables
  stepTimeScale: number; // Multiplier on base stage time limit
  tempBandExpand: number; // +/- expansion of ideal temp zone (positive = wider/easier)
  burnSpeedScale: number; // How fast burn risk accumulates when overheating
  autoSetInitialFlame: boolean; // Novice auto-adjusts knob at start of each stage
  simplifySeasonings: boolean; // Novice keeps max 2 core seasonings per stage
  strictSeasoningOrder: boolean; // Master enforces strict recipe order
  checkOilTempTiming: boolean; // Expert/Master grade whether oil/wok temp is right when adding seasonings
  showSeasoningHint: boolean; // Novice/Expert highlight next recommended seasoning; Master disables hint
  requireTossForCompletion: boolean; // Master requires meeting stage toss count before stage finishes
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  novice: {
    id: 'novice',
    label: '新手',
    shortTag: '小白学做菜',
    summary: '精简调料步骤 · 自动匹配初始火候 · 宽裕限时与切线容差，轻松掌握家常做法',
    cutCountScale: 0.65,
    sweepSpeedScale: 0.68,
    perfectToleranceScale: 1.45,
    stepTimeScale: 1.55,
    tempBandExpand: 12,
    burnSpeedScale: 0.45,
    autoSetInitialFlame: true,
    simplifySeasonings: true,
    strictSeasoningOrder: false,
    checkOilTempTiming: false,
    showSeasoningHint: true,
    requireTossForCompletion: false,
  },
  expert: {
    id: 'expert',
    label: '高手',
    shortTag: '家常掌勺',
    summary: '完整菜谱调料 · 需手动换火控温 · 限时考核投料油温时机与火候持续时间',
    cutCountScale: 1.0,
    sweepSpeedScale: 1.0,
    perfectToleranceScale: 1.0,
    stepTimeScale: 1.0,
    tempBandExpand: 0,
    burnSpeedScale: 1.0,
    autoSetInitialFlame: false,
    simplifySeasonings: false,
    strictSeasoningOrder: false,
    checkOilTempTiming: true,
    showSeasoningHint: true,
    requireTossForCompletion: false,
  },
  master: {
    id: 'master',
    label: '厨神',
    shortTag: '极限锅气',
    summary: '严苛每步限时 · 无调料高亮提示 · 严格考核切菜精度、投料先后顺序、油温与颠勺',
    cutCountScale: 1.25,
    sweepSpeedScale: 1.38,
    perfectToleranceScale: 0.74,
    stepTimeScale: 0.78,
    tempBandExpand: -5,
    burnSpeedScale: 1.55,
    autoSetInitialFlame: false,
    simplifySeasonings: false,
    strictSeasoningOrder: true,
    checkOilTempTiming: true,
    showSeasoningHint: false,
    requireTossForCompletion: true,
  },
};

export const DIFFICULTY_ORDER: DifficultyLevel[] = ['novice', 'expert', 'master'];

export interface AdaptedCookStage extends CookStage {
  timeLimitSec: number;
  adaptedTempMin: number;
  adaptedTempMax: number;
  adaptedRequiredSeasonings: string[];
  adaptedTossRequired: number;
}

export interface AdaptedPrepIngredient extends PrepIngredient {
  adaptedCutsPerDirection: number;
}

export interface AdaptedRecipe extends Recipe {
  adaptedPrep: AdaptedPrepIngredient[];
  adaptedStages: AdaptedCookStage[];
  adaptedAvailableSeasonings: string[];
}

/**
 * Adapts a base recipe cleanly to the chosen difficulty level
 * (simpler steps/seasonings for Novice; full authentic constraints for Expert/Master)
 */
export function adaptRecipeForDifficulty(
  recipe: Recipe,
  level: DifficultyLevel,
): AdaptedRecipe {
  const cfg = DIFFICULTY_CONFIGS[level];

  const adaptedPrep: AdaptedPrepIngredient[] = recipe.prepIngredients.map((ing) => ({
    ...ing,
    adaptedCutsPerDirection: Math.max(
      2,
      Math.round(ing.cutsPerDirection * cfg.cutCountScale),
    ),
  }));

  const usedSeasonings = new Set<string>();
  const adaptedStages: AdaptedCookStage[] = recipe.cookStages.map((stage) => {
    // Novice mode trims each stage to the 2 most essential seasonings so beginners never feel overwhelmed
    const reqSeasonings = cfg.simplifySeasonings
      ? stage.requiredSeasonings.slice(0, 2)
      : [...stage.requiredSeasonings];
    reqSeasonings.forEach((s) => usedSeasonings.add(s));

    const baseLimit = Math.round(stage.durationSec * 2.55 + reqSeasonings.length * 1.6);
    const timeLimitSec = Math.max(10, Math.round(baseLimit * cfg.stepTimeScale));

    const adaptedTempMin = Math.max(24, stage.idealTempMin - cfg.tempBandExpand);
    const adaptedTempMax = Math.min(95, stage.idealTempMax + cfg.tempBandExpand);
    const adaptedTossRequired = cfg.simplifySeasonings
      ? Math.max(1, stage.tossRequired - 1)
      : stage.tossRequired;

    return {
      ...stage,
      timeLimitSec,
      adaptedTempMin,
      adaptedTempMax,
      adaptedRequiredSeasonings: reqSeasonings,
      adaptedTossRequired,
    };
  });

  // Keep seasoning tray clean for novice (only show relevant seasonings + 1-2 decoys)
  const adaptedAvailableSeasonings = cfg.simplifySeasonings
    ? recipe.availableSeasonings.filter((id) => usedSeasonings.has(id))
    : recipe.availableSeasonings;

  return {
    ...recipe,
    adaptedPrep,
    adaptedStages,
    adaptedAvailableSeasonings,
  };
}
