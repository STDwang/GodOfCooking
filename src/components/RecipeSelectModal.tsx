import { ArrowLeft, BookOpen, ChefHat, Flame, Star, Zap } from 'lucide-react';
import {
  adaptRecipeForDifficulty,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  type DifficultyLevel,
} from '../data/difficulty';
import { RECIPES, type Recipe } from '../data/recipes';
import type { ChefProgress } from '../utils/storage';

interface RecipeSelectModalProps {
  progress: ChefProgress;
  difficulty: DifficultyLevel;
  onChangeDifficulty: (level: DifficultyLevel) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartBlitz: () => void;
  onOpenEncyclopedia: (recipeId?: string) => void;
  onBack: () => void;
}

export function RecipeSelectModal({
  progress,
  difficulty,
  onChangeDifficulty,
  onSelectRecipe,
  onStartBlitz,
  onOpenEncyclopedia,
  onBack,
}: RecipeSelectModalProps) {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#140E0B]/72 p-3 sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[26px] bg-[#FFFBF6] shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
        {/* Clean Header with integrated Difficulty Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9DDD0] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4EAE0] text-[#4B382D] transition-colors hover:bg-[#EADBC9]"
              aria-label="返回首页"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-serif-cn text-xl font-bold text-[#2A1E17] sm:text-2xl">
                今日菜单 · 经典国民中餐
              </h2>
              <p className="text-xs text-[#7F6B5E]">{diffCfg.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Compact Difficulty Segmented Switch */}
            <div className="flex items-center gap-1 rounded-xl bg-[#EFE4D7] p-1">
              {DIFFICULTY_ORDER.map((level) => {
                const cfg = DIFFICULTY_CONFIGS[level];
                const active = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeDifficulty(level)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active ? 'bg-white text-[#C84B1D]' : 'text-[#6A574B] hover:text-[#2A1E17]'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onOpenEncyclopedia()}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4EAE0] px-3 py-2 text-xs font-medium text-[#5A4437] transition-colors hover:bg-[#EBDAC7] whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#C84B1D]" />
              <span className="hidden sm:inline">烹饪百科</span>
            </button>
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="culinary-scroll flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {RECIPES.map((recipe) => {
              const rec = progress.dishes[recipe.id];
              const stars = rec?.bestStars ?? 0;
              const adapted = adaptRecipeForDifficulty(recipe, difficulty);
              const totalTimeLimit = adapted.adaptedStages.reduce((s, st) => s + st.timeLimitSec, 0);

              return (
                <div
                  key={recipe.id}
                  className="group flex flex-col justify-between rounded-2xl border border-[#ECE0D3] bg-white p-4 transition-colors hover:border-[#C84B1D]/45 sm:p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: recipe.dishVisualColor }}
                            aria-hidden="true"
                          />
                          <h3 className="font-serif-cn text-lg font-bold text-[#2A1E17]">
                            {recipe.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-[#7E6A5E]">
                          {recipe.region} · {recipe.difficultyLabel} · {recipe.flavor}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 pt-0.5" aria-label={`最佳星级 ${stars} 星`}>
                        {[1, 2, 3].map((idx) => (
                          <Star
                            key={idx}
                            className={`h-4 w-4 ${
                              idx <= stars
                                ? 'fill-[#D9822B] text-[#D9822B]'
                                : 'text-[#E3D5C6]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-[#5C493E]">
                      {recipe.tagline}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-[#847063] tabular-nums">
                      <div>
                        切配：{adapted.adaptedPrep.map((i) => `${i.name}(${i.directions}向·${i.sizeSpecLabel})`).join('、')}
                      </div>
                      <div>
                        当前难度（{diffCfg.label}）：{adapted.adaptedStages.length} 步掌勺 · 共限时 {totalTimeLimit} 秒 ·{' '}
                        {adapted.adaptedAvailableSeasonings.length} 种调料
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#F2E8DD] pt-3.5">
                    <button
                      type="button"
                      onClick={() => onOpenEncyclopedia(recipe.id)}
                      className="text-xs font-medium text-[#7B6557] transition-colors hover:text-[#C84B1D]"
                    >
                      查看完整做法
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectRecipe(recipe)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#C84B1D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#AE3D14] whitespace-nowrap shrink-0"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      <span>{rec ? '再次下厨' : '开始烹饪'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bonus Tofu Blitz Card */}
          <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#E8D7C5] bg-[#F7EEE4] p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C84B1D] text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif-cn text-base font-bold text-[#2A1E17]">
                    刀工特训：五秒狂切豆腐挑战
                  </h3>
                  {progress.blitzBestCuts > 0 && (
                    <span className="text-xs font-medium text-[#B83D12] tabular-nums">
                      最佳 {progress.blitzBestCuts} 刀
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#6E5B4F]">
                  纯享高频切豆腐音效与三向极速切丁爽感，5 秒内点屏或猛按空格键挑战手速极限。
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartBlitz}
              className="flex items-center gap-1.5 rounded-xl bg-[#2A1E17] px-4 py-2.5 text-xs font-semibold text-[#FFFBF6] transition-colors hover:bg-[#3F2E24] whitespace-nowrap shrink-0"
            >
              <ChefHat className="h-3.5 w-3.5" />
              <span>立即挑战</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
