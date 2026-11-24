import { BookOpen, Flame, Play, Sparkles, UtensilsCrossed } from 'lucide-react';
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  type DifficultyLevel,
} from '../data/difficulty';
import type { ChefProgress } from '../utils/storage';

interface TitleOverlayProps {
  progress: ChefProgress;
  difficulty: DifficultyLevel;
  onChangeDifficulty: (level: DifficultyLevel) => void;
  onStartCooking: () => void;
  onStartBlitz: () => void;
  onOpenEncyclopedia: () => void;
}

export function TitleOverlay({
  progress,
  difficulty,
  onChangeDifficulty,
  onStartCooking,
  onStartBlitz,
  onOpenEncyclopedia,
}: TitleOverlayProps) {
  const totalStars = Object.values(progress.dishes).reduce((sum, d) => sum + d.bestStars, 0);
  const completedCount = Object.keys(progress.dishes).length;
  const activeDiff = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top-right compact progress summary */}
      <div className="flex items-start justify-end">
        {(totalStars > 0 || progress.blitzBestCuts > 0) && (
          <div className="pointer-events-auto rounded-xl border border-white/15 bg-[#18120E]/80 px-3.5 py-2 text-xs text-[#F5EBE0] tabular-nums">
            <span>已掌握 {completedCount}/6 道菜</span>
            <span className="mx-2 text-white/35">·</span>
            <span>厨艺星级 {totalStars}/18</span>
            {progress.blitzBestCuts > 0 && (
              <>
                <span className="mx-2 text-white/35">·</span>
                <span>狂切纪录 {progress.blitzBestCuts} 刀</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom warm-cream culinary card */}
      <div className="mx-auto w-full max-w-[476px] pb-1 sm:pb-3">
        <div className="pointer-events-auto rounded-[28px] bg-[#FFFBF6] p-5 shadow-[0_20px_60px_rgba(12,7,4,0.52)] sm:p-6">
          {/* Bespoke inline SVG emblem + Title Lockup */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-1.5 flex items-center gap-2.5">
              <svg
                width="34"
                height="34"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect x="2" y="2" width="32" height="32" rx="9" fill="#C84B1D" />
                <rect
                  x="4.5"
                  y="4.5"
                  width="27"
                  height="27"
                  rx="6.5"
                  stroke="#F8DFC2"
                  strokeWidth="1.2"
                  strokeOpacity="0.65"
                />
                <path
                  d="M11 22.5H25C24.2 25.3 21.4 27 18 27C14.6 27 11.8 25.3 11 22.5Z"
                  fill="#FFFBF6"
                />
                <path
                  d="M13 18.5C13 16.2 14.9 14.6 17.5 14.6H24.5V19.6C24.5 20.2 24 20.7 23.4 20.7H14.2C13.5 20.7 13 20.1 13 19.4V18.5Z"
                  fill="#FFFBF6"
                  fillOpacity="0.95"
                />
                <path d="M9.5 16.5H13V18.4H9.5V16.5Z" fill="#F8DFC2" />
                <path
                  d="M18 9.2C18.9 10.6 18.9 11.8 18 12.8M21.4 9.8C22.1 10.9 22.1 11.9 21.4 12.7"
                  stroke="#F8DFC2"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              <h1 className="font-serif-cn text-[28px] font-bold tracking-wider text-[#B83D12] sm:text-[31px]">
                我是厨神
              </h1>
            </div>
            <p className="text-xs leading-relaxed text-[#7A665A] sm:text-[13px]">
              3D 中式家常料理模拟 · 从切菜刀工到火候掌勺，边玩边学真做法
            </p>
          </div>

          {/* 3-Tier Difficulty Selector (新手 / 高手 / 厨神) */}
          <div className="mt-4 rounded-2xl bg-[#F5EBE0] p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {DIFFICULTY_ORDER.map((level) => {
                const cfg = DIFFICULTY_CONFIGS[level];
                const active = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeDifficulty(level)}
                    className={`rounded-xl py-2 text-center transition-colors ${
                      active
                        ? 'bg-white text-[#C84B1D] shadow-sm'
                        : 'text-[#665347] hover:bg-white/55'
                    }`}
                  >
                    <div className="text-sm font-bold">{cfg.label}</div>
                    <div className={`text-[10px] ${active ? 'text-[#B85732]' : 'text-[#8D786A]'}`}>
                      {cfg.shortTag}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 px-2 pb-0.5 text-center text-[11px] leading-relaxed text-[#6E5B4F]">
              {activeDiff.summary}
            </p>
          </div>

          {/* Three Clean Mode / Utility Tiles */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onStartCooking}
              className="flex flex-col items-center justify-center rounded-xl border border-[#ECE0D3] bg-white px-2 py-2.5 text-center transition-transform duration-150 hover:-translate-y-0.5"
            >
              <UtensilsCrossed className="mb-1 h-4 w-4 text-[#C84B1D]" strokeWidth={2} />
              <span className="text-xs font-semibold text-[#2A1E17]">完整下厨</span>
              <span className="text-[10px] text-[#8A7568]">6 道国民菜</span>
            </button>

            <button
              type="button"
              onClick={onStartBlitz}
              className="flex flex-col items-center justify-center rounded-xl border border-[#ECE0D3] bg-white px-2 py-2.5 text-center transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Sparkles className="mb-1 h-4 w-4 text-[#C84B1D]" strokeWidth={2} />
              <span className="text-xs font-semibold text-[#2A1E17]">狂切豆腐</span>
              <span className="text-[10px] text-[#8A7568]">五秒刀工赛</span>
            </button>

            <button
              type="button"
              onClick={onOpenEncyclopedia}
              className="flex flex-col items-center justify-center rounded-xl border border-[#ECE0D3] bg-white px-2 py-2.5 text-center transition-transform duration-150 hover:-translate-y-0.5"
            >
              <BookOpen className="mb-1 h-4 w-4 text-[#C84B1D]" strokeWidth={2} />
              <span className="text-xs font-semibold text-[#2A1E17]">烹饪百科</span>
              <span className="text-[10px] text-[#8A7568]">搭配与秘籍</span>
            </button>
          </div>

          {/* Primary Terracotta CTA */}
          <button
            type="button"
            onClick={onStartCooking}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C84B1D] py-3.5 text-base font-semibold tracking-wide text-white shadow-[0_6px_18px_rgba(200,75,29,0.34)] transition-colors duration-150 hover:bg-[#B03D14] active:scale-[0.99]"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>以「{activeDiff.label}」难度进厨做菜</span>
          </button>

          <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-[#8B7668]">
            <Flame className="h-3.5 w-3.5 text-[#C84B1D]/75" />
            <span>点击画面 / Space 下刀与颠勺 · 数字键 0-3 拧火候旋钮</span>
          </div>
        </div>
      </div>
    </div>
  );
}
