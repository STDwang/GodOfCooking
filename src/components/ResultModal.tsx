import { BookOpen, ChefHat, RotateCcw, Star, Utensils } from 'lucide-react';
import { useState } from 'react';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../data/difficulty';
import type { Recipe } from '../data/recipes';

export interface StepCookScore {
  title: string;
  score: number;
  timeRemainingSec: number;
}

export interface CookingScoreReport {
  difficulty: DifficultyLevel;
  knifeScore: number;
  flameControlScore: number; // 火候切换 + 持续控温
  timingScore: number; // 投料时机与顺序
  cookOverallScore: number; // 烹饪环节总评
  totalScore: number;
  stars: 1 | 2 | 3;
  chefTitle: string;
  stepScores: StepCookScore[];
}

interface ResultModalProps {
  mode: 'dish' | 'blitz';
  recipe: Recipe | null;
  report: CookingScoreReport | null;
  blitzCuts: number;
  blitzBest: number;
  onReplay: () => void;
  onSelectAnother: () => void;
  onOpenEncyclopedia: (recipeId?: string) => void;
}

export function ResultModal({
  mode,
  recipe,
  report,
  blitzCuts,
  blitzBest,
  onReplay,
  onSelectAnother,
  onOpenEncyclopedia,
}: ResultModalProps) {
  const [showRecipeGuide, setShowRecipeGuide] = useState(false);

  if (mode === 'blitz') {
    const rankTitle =
      blitzCuts >= 42
        ? '无影刀神'
        : blitzCuts >= 30
          ? '快刀名厨'
          : blitzCuts >= 18
            ? '案板好手'
            : '刀工新秀';

    return (
      <div className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center p-4 sm:items-center">
        <div className="pointer-events-auto w-full max-w-md rounded-[26px] bg-[#FFFBF6] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.52)]">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5E8DC] text-[#C84B1D]">
            <ChefHat className="h-6 w-6" />
          </div>
          <p className="text-xs font-medium text-[#847063]">五秒狂切豆腐挑战 · 结算</p>
          <h2 className="font-serif-cn mt-1 text-2xl font-bold text-[#2A1E17]">{rankTitle}</h2>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#F5EBE0] p-3.5 tabular-nums">
            <div className="rounded-xl bg-white py-3">
              <div className="text-2xl font-bold text-[#C84B1D]">{blitzCuts} 刀</div>
              <div className="mt-0.5 text-[11px] text-[#847063]">本轮总切刀数</div>
            </div>
            <div className="rounded-xl bg-white py-3">
              <div className="text-2xl font-bold text-[#2A1E17]">{blitzBest} 刀</div>
              <div className="mt-0.5 text-[11px] text-[#847063]">历史最高纪录</div>
            </div>
          </div>

          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={onSelectAnother}
              className="flex-1 rounded-xl bg-[#F1E6D9] py-3 text-sm font-semibold text-[#4A382D] transition-colors hover:bg-[#E7D8C7]"
            >
              去做家常菜
            </button>
            <button
              type="button"
              onClick={onReplay}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C84B1D] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#AE3D14]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>再来一局</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe || !report) return null;
  const diffLabel = DIFFICULTY_CONFIGS[report.difficulty].label;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="pointer-events-auto flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-[26px] bg-[#FFFBF6] shadow-[0_24px_70px_rgba(0,0,0,0.52)]">
        {/* Top Summary */}
        <div className="border-b border-[#EDE0D3] px-5 pt-5 pb-4 text-center sm:px-6">
          <div className="mb-1.5 flex items-center justify-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className={`h-6 w-6 ${
                  i <= report.stars
                    ? 'fill-[#D9822B] text-[#D9822B]'
                    : 'text-[#E3D5C6]'
                }`}
              />
            ))}
          </div>

          <h2 className="font-serif-cn text-2xl font-bold text-[#2A1E17]">
            {recipe.name} · 出锅成菜
          </h2>
          <p className="mt-0.5 text-xs text-[#7E6A5E]">
            {diffLabel}难度 · {report.chefTitle} · 综合得分{' '}
            <span className="font-semibold text-[#C84B1D] tabular-nums">{report.totalScore} 分</span>
          </p>

          {/* 4-Factor Culinary Score Breakdown */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#F5EBE0] p-2 tabular-nums">
            <div className="rounded-xl bg-white py-2">
              <div className="text-base font-bold text-[#2A1E17]">{report.knifeScore}</div>
              <div className="text-[10px] text-[#847063]">刀工备料</div>
            </div>
            <div className="rounded-xl bg-white py-2">
              <div className="text-base font-bold text-[#2A1E17]">{report.flameControlScore}</div>
              <div className="text-[10px] text-[#847063]">火候持续</div>
            </div>
            <div className="rounded-xl bg-white py-2">
              <div className="text-base font-bold text-[#2A1E17]">{report.timingScore}</div>
              <div className="text-[10px] text-[#847063]">投料时机</div>
            </div>
            <div className="rounded-xl bg-white py-2">
              <div className="text-base font-bold text-[#C84B1D]">{report.cookOverallScore}</div>
              <div className="text-[10px] text-[#847063]">掌勺总评</div>
            </div>
          </div>

          {/* Tabs: Step Scores & Chef Secret vs Real Home Recipe */}
          <div className="mt-3.5 flex items-center justify-center gap-1 rounded-xl bg-[#F3E9DD] p-1">
            <button
              type="button"
              onClick={() => setShowRecipeGuide(false)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                !showRecipeGuide ? 'bg-white text-[#2A1E17]' : 'text-[#766357]'
              }`}
            >
              烹饪步骤评分
            </button>
            <button
              type="button"
              onClick={() => setShowRecipeGuide(true)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                showRecipeGuide ? 'bg-white text-[#C84B1D]' : 'text-[#766357]'
              }`}
            >
              现实家常做法复盘卡
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="culinary-scroll flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {!showRecipeGuide ? (
            <div className="space-y-3 text-left">
              {/* Per-step cooking performance scorecard */}
              <div className="divide-y divide-[#F2E8DD] rounded-2xl border border-[#ECE0D3] bg-white px-4">
                {report.stepScores.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 text-xs tabular-nums">
                    <div>
                      <span className="font-semibold text-[#C84B1D]">步骤 0{idx + 1}</span>
                      <span className="ml-2 font-medium text-[#2A1E17]">{st.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8A7568]">余 {st.timeRemainingSec.toFixed(1)}s</span>
                      <span className="font-bold text-[#2A1E17]">{st.score} 分</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#ECE0D3] bg-white p-4">
                <div className="text-xs font-semibold text-[#C84B1D]">本道菜核心秘诀</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#46362C]">
                  {recipe.realRecipe.chefSecret}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-xs font-semibold text-[#847063]">
                  准备用料（{recipe.realRecipe.servings}）
                </h3>
                <div className="mt-2 divide-y divide-[#F1E6DA] rounded-xl border border-[#EDE0D3] bg-white px-3.5">
                  {recipe.realRecipe.ingredients.map((ing) => (
                    <div
                      key={ing.item}
                      className="flex items-center justify-between py-2 text-xs text-[#382A22]"
                    >
                      <span>{ing.item}</span>
                      <span className="font-medium text-[#7D685B]">{ing.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#847063]">家常实操步骤</h3>
                <ol className="mt-2 space-y-2">
                  {recipe.realRecipe.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 rounded-xl border border-[#EFE4D8] bg-white p-3 text-xs leading-relaxed text-[#3E2F26]"
                    >
                      <span className="font-serif-cn font-bold text-[#C84B1D] tabular-nums">
                        0{i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 border-t border-[#EDE0D3] bg-[#FFFBF6] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => onOpenEncyclopedia(recipe.id)}
            className="flex items-center justify-center gap-1 rounded-xl bg-[#F3E8DC] px-3.5 py-2.5 text-xs font-semibold text-[#5A4437] transition-colors hover:bg-[#E9DAC9] whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>查百科</span>
          </button>

          <button
            type="button"
            onClick={onReplay}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F3E8DC] py-2.5 text-xs font-semibold text-[#3C2C22] transition-colors hover:bg-[#E9DAC9]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>再做一遍</span>
          </button>

          <button
            type="button"
            onClick={onSelectAnother}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C84B1D] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#AE3D14]"
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>换道新菜</span>
          </button>
        </div>
      </div>
    </div>
  );
}
