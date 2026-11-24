import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChefHat,
  Clock,
  Flame,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DIFFICULTY_CONFIGS,
  type AdaptedCookStage,
  type AdaptedPrepIngredient,
  type AdaptedRecipe,
  type DifficultyLevel,
} from '../data/difficulty';
import { SEASONINGS } from '../data/recipes';

export interface FloatingFeedback {
  id: number;
  text: string;
  tone: 'good' | 'warn' | 'neutral';
}

export interface PrepScoreSummary {
  knifeScore: number;
  grade: 'S' | 'A' | 'B' | 'C';
  gradeLabel: string;
  perfectCount: number;
  goodCount: number;
  offCount: number;
  totalCuts: number;
  specsSummary: string;
}

export interface CookFailureInfo {
  reasonTitle: string;
  reasonDetail: string;
  failedStepTitle: string;
  completedSteps: number;
  totalSteps: number;
}

interface CookingHudProps {
  mode: 'prep' | 'prep-summary' | 'cook' | 'cook-failed' | 'blitz';
  difficulty: DifficultyLevel;
  recipe: AdaptedRecipe | null;
  muted: boolean;
  onToggleMute: () => void;
  onBack: () => void;
  onOpenEncyclopedia: () => void;
  feedback: FloatingFeedback | null;

  // Prep mode state
  prepCountdown: number;
  ingredientIndex: number;
  activeIngredient: AdaptedPrepIngredient | null;
  directionIndex: number;
  cutsInDirection: number;
  totalCutsDone: number;
  prepSummary: PrepScoreSummary | null;
  onProceedToCook: () => void;

  // Blitz mode state
  blitzTimeLeft: number;
  blitzCuts: number;
  blitzPhase: number;
  blitzStarted: boolean;

  // Cook mode state
  cookStageIndex: number;
  activeCookStage: AdaptedCookStage | null;
  stepTimeLeft: number;
  flameLevel: 0 | 1 | 2 | 3;
  wokTemp: number;
  stageProgress: number;
  addedSeasonings: string[];
  tossCountInStage: number;
  burnRisk: number;
  failureInfo: CookFailureInfo | null;
  onSetFlame: (level: 0 | 1 | 2 | 3) => void;
  onWokToss: () => void;
  onAddSeasoning: (seasoningId: string) => void;
  onRetryCookOnly: () => void;
  onRetryFullRecipe: () => void;
}

const FLAME_LABELS: { level: 0 | 1 | 2 | 3; label: string; keyHint: string }[] = [
  { level: 0, label: '关火', keyHint: '0' },
  { level: 1, label: '文火', keyHint: '1' },
  { level: 2, label: '中火', keyHint: '2' },
  { level: 3, label: '旺火', keyHint: '3' },
];

export function CookingHud({
  mode,
  difficulty,
  recipe,
  muted,
  onToggleMute,
  onBack,
  onOpenEncyclopedia,
  feedback,
  prepCountdown,
  ingredientIndex,
  activeIngredient,
  directionIndex,
  cutsInDirection,
  totalCutsDone,
  prepSummary,
  onProceedToCook,
  blitzTimeLeft,
  blitzCuts,
  blitzPhase,
  blitzStarted,
  cookStageIndex,
  activeCookStage,
  stepTimeLeft,
  flameLevel,
  wokTemp,
  stageProgress,
  addedSeasonings,
  tossCountInStage,
  burnRisk,
  failureInfo,
  onSetFlame,
  onWokToss,
  onAddSeasoning,
  onRetryCookOnly,
  onRetryFullRecipe,
}: CookingHudProps) {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];

  let tempStatus = '温度适中';
  let tempColorClass = 'text-[#2B7A4B]';
  if (activeCookStage) {
    if (wokTemp > 86 || wokTemp > activeCookStage.adaptedTempMax + 8) {
      tempStatus = '锅温偏高 · 立即颠勺或收火';
      tempColorClass = 'text-[#C53030]';
    } else if (wokTemp < activeCookStage.adaptedTempMin) {
      tempStatus = '火候偏低 · 拧大火力';
      tempColorClass = 'text-[#B86A11]';
    } else if (wokTemp > activeCookStage.adaptedTempMax) {
      tempStatus = '略高于理想温区 · 适当调小';
      tempColorClass = 'text-[#C85A17]';
    } else {
      tempStatus = '理想火候 · 正在入味';
      tempColorClass = 'text-[#2B7A4B]';
    }
  }

  const nextRequiredSeasoningId =
    activeCookStage?.adaptedRequiredSeasonings.find((id) => !addedSeasonings.includes(id)) ?? null;
  const remainingNames =
    activeCookStage?.adaptedRequiredSeasonings
      .filter((id) => !addedSeasonings.includes(id))
      .map((id) => SEASONINGS[id]?.shortName ?? id) ?? [];

  // Single dedicated clean step instruction banner
  let guideTag = '';
  let guideAction = '';
  let guideSub = '';

  if (mode === 'blitz') {
    guideTag = '五秒狂切挑战';
    guideAction = blitzStarted
      ? '全速点击画面或连按 Space 下刀！'
      : '点击画面任意位置或按 Space 立即落刀计时';
    guideSub = '每切 12 刀自动转向，体验三向极速切丁';
  } else if (mode === 'prep' && recipe && activeIngredient) {
    const dirLabel =
      activeIngredient.directionLabels[directionIndex] ??
      `第 ${directionIndex + 1}/${activeIngredient.directions} 向`;
    guideTag = `${recipe.name} · ${diffCfg.label} · 备料 ${ingredientIndex + 1}/${recipe.adaptedPrep.length}`;
    guideAction =
      prepCountdown > 0
        ? `准备切【${activeIngredient.name}】：共 ${activeIngredient.directions} 个方向，切 ${activeIngredient.sizeSpecLabel}`
        : `${dirLabel}（${activeIngredient.sizeSpecLabel}）· 等亮线对齐金色切线落刀`;
    guideSub =
      prepCountdown > 0
        ? '先观察食材表面金色虚线间距，倒计时结束立刻下刀'
        : '点击画面或按 Space 下刀 · 绿线重合即完美落刀';
  } else if (mode === 'cook' && recipe && activeCookStage) {
    const flameText =
      activeCookStage.recommendedFlame === 1
        ? '文火'
        : activeCookStage.recommendedFlame === 2
          ? '中火'
          : '旺火';
    guideTag = `${recipe.name} · ${diffCfg.label} · 掌勺步骤 ${cookStageIndex + 1}/${recipe.adaptedStages.length}`;

    if (diffCfg.simplifySeasonings) {
      // Simplified crystal-clear beginner guidance
      guideAction =
        remainingNames.length > 0
          ? `保持【${flameText}】，依次加入：${remainingNames.join(' → ')}`
          : `调料已齐！保持【${flameText}】并点 1 次颠勺等待入味完成`;
      guideSub = `新手引导：系统已自动匹配推荐火候，限时内完成即可`;
    } else {
      guideAction = activeCookStage.actionHeadline;
      if (remainingNames.length > 0) {
        guideSub = diffCfg.strictSeasoningOrder
          ? `厨神严判：先控好【${flameText}】油温，再严格按序下料：${remainingNames.join(' → ')}`
          : `待投调料：${remainingNames.join(' → ')}（建议油温达标后下锅更香）`;
      } else if (
        diffCfg.requireTossForCompletion &&
        tossCountInStage < activeCookStage.adaptedTossRequired
      ) {
        guideSub = `调料已齐！还需颠勺 ${activeCookStage.adaptedTossRequired - tossCountInStage} 次并稳住火候`;
      } else {
        guideSub = `调料已齐！稳住理想温区，等待本步持续火候完成`;
      }
    }
  }

  const timeUrgent = mode === 'cook' && stepTimeLeft <= 4.5;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP AREA */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Top-left utility controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#18120E]/82 text-[#FFF8F0] transition-colors hover:bg-[#2B2019]"
              aria-label="返回菜单"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#18120E]/82 text-[#FFF8F0] transition-colors hover:bg-[#2B2019]"
              aria-label={muted ? '开启音效' : '静音'}
            >
              {muted ? <VolumeX className="h-4 w-4 text-[#E08A6C]" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenEncyclopedia}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-[#18120E]/82 px-3 text-xs font-medium text-[#FFF8F0] transition-colors hover:bg-[#2B2019] whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#F2A663]" />
              <span className="hidden sm:inline">烹饪百科</span>
            </button>
          </div>

          {/* Top-right compact counter / timer */}
          <div className="flex items-center gap-2">
            {mode === 'blitz' && (
              <div className="rounded-xl border border-white/15 bg-[#18120E]/84 px-3.5 py-1.5 text-center tabular-nums">
                <span className="text-lg font-bold text-[#F6C86E]">{blitzTimeLeft.toFixed(1)}</span>
                <span className="ml-0.5 text-xs text-[#DFCBB7]">秒</span>
              </div>
            )}

            {(mode === 'prep' || mode === 'blitz') && (
              <div className="rounded-xl border border-white/15 bg-[#18120E]/84 px-3.5 py-1.5 text-right tabular-nums">
                <span className="text-base font-bold text-white">
                  {mode === 'blitz' ? blitzCuts : totalCutsDone}
                </span>
                <span className="ml-0.5 text-xs text-[#DFCBB7]">刀</span>
                {mode === 'prep' && activeIngredient && (
                  <span className="ml-2 text-xs text-[#F2C97D]">
                    本向 {cutsInDirection}/{activeIngredient.adaptedCutsPerDirection}
                  </span>
                )}
              </div>
            )}

            {mode === 'cook' && activeCookStage && (
              <>
                <div
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold tabular-nums ${
                    timeUrgent
                      ? 'border-[#F87171]/60 bg-[#5C1515]/92 text-[#FFE4E4]'
                      : 'border-white/15 bg-[#18120E]/84 text-[#F6C86E]'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>限时 {stepTimeLeft.toFixed(1)}s</span>
                </div>

                <div className="hidden rounded-xl border border-white/15 bg-[#18120E]/84 px-3 py-1.5 text-right text-xs tabular-nums sm:block">
                  <span className="font-semibold text-white">
                    颠勺 {tossCountInStage}/{activeCookStage.adaptedTossRequired}
                  </span>
                  <span className="mx-2 text-white/30">·</span>
                  <span className={burnRisk > 35 ? 'font-semibold text-[#FF8C7A]' : 'text-[#DFCBB7]'}>
                    {burnRisk > 35
                      ? `糊锅 ${Math.round(burnRisk)}%`
                      : `进度 ${Math.round(stageProgress * 100)}%`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* DEDICATED, PROMINENT, CLEAN STEP INSTRUCTION BANNER */}
        {mode !== 'prep-summary' && mode !== 'cook-failed' && guideAction && (
          <div className="mx-auto w-full max-w-[620px] rounded-2xl border border-[#EADBC8] bg-[#FFFBF6] px-4 py-3 shadow-[0_10px_28px_rgba(12,7,4,0.34)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-wide text-[#C84B1D]">{guideTag}</span>

              {mode === 'prep' && activeIngredient && (
                <div className="flex items-center gap-2 text-xs text-[#6E5B4F]">
                  <span>
                    切菜方向 {directionIndex + 1}/{activeIngredient.directions}
                  </span>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: activeIngredient.directions }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-2 w-2 rounded-full ${
                          idx < directionIndex
                            ? 'bg-[#2B7A4B]'
                            : idx === directionIndex
                              ? 'bg-[#C84B1D]'
                              : 'bg-[#DFD0C0]'
                        }`}
                      />
                    ))}
                  </span>
                </div>
              )}

              {mode === 'blitz' && (
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className={`h-2 w-2 rounded-full ${
                        dot <= blitzPhase ? 'bg-[#C84B1D]' : 'bg-[#DFD0C0]'
                      }`}
                    />
                  ))}
                </div>
              )}

              {mode === 'cook' && activeCookStage && (
                <span className={`text-xs font-semibold tabular-nums ${tempColorClass}`}>
                  {tempStatus} · {Math.round(wokTemp * 2.4 + 35)}°C · 进度 {Math.round(stageProgress * 100)}%
                </span>
              )}
            </div>

            <div className="mt-1 text-sm font-bold leading-snug text-[#2A1E17] sm:text-[15px]">
              {guideAction}
            </div>

            <div className="mt-1 text-[11px] text-[#7D685B] sm:text-xs">{guideSub}</div>

            {mode === 'cook' && activeCookStage && (
              <div className="mt-2">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#EAE0D4]">
                  <div
                    className="absolute top-0 bottom-0 bg-[#2F9E5B]/80"
                    style={{
                      left: `${activeCookStage.adaptedTempMin}%`,
                      width: `${activeCookStage.adaptedTempMax - activeCookStage.adaptedTempMin}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-2 -translate-x-1/2 rounded-full bg-[#2A1E17]"
                    style={{ left: `${Math.min(100, Math.max(0, wokTemp))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3-SECOND PRE-CHOP COUNTDOWN OVERLAY */}
      {mode === 'prep' && prepCountdown > 0 && activeIngredient && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center rounded-[28px] bg-[#18120E]/82 px-9 py-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium tracking-wider text-[#F2C97D]">
              准备下刀 · {activeIngredient.name}（{activeIngredient.sizeSpecLabel}）
            </span>
            <div className="font-serif-cn mt-1 text-6xl font-black text-white tabular-nums">
              {Math.ceil(prepCountdown)}
            </div>
            <span className="mt-1 text-xs text-[#DFCBB7]">
              共 {activeIngredient.directions} 个切菜方向 · 沿着食材金色虚线落刀
            </span>
          </div>
        </div>
      )}

      {/* DEDICATED PREP PHASE SCORE MODAL */}
      {mode === 'prep-summary' && prepSummary && recipe && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center p-4 sm:items-center">
          <div className="pointer-events-auto w-full max-w-md rounded-[26px] bg-[#FFFBF6] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.56)]">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5E8DC] text-[#C84B1D]">
              <ChefHat className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-[#847063]">
              {recipe.name} · {diffCfg.label}模式 · 切菜刀工评分
            </p>

            <div className="mt-1.5 flex items-baseline justify-center gap-2.5">
              <span className="font-serif-cn text-4xl font-black text-[#C84B1D] tabular-nums">
                {prepSummary.knifeScore} 分
              </span>
              <span className="font-serif-cn text-lg font-bold text-[#2A1E17]">
                {prepSummary.grade} · {prepSummary.gradeLabel}
              </span>
            </div>

            <p className="mt-1 text-xs text-[#7A665A]">切配完成：{prepSummary.specsSummary}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#F5EBE0] p-2.5 tabular-nums">
              <div className="rounded-xl bg-white py-2.5">
                <div className="text-base font-bold text-[#2B7A4B]">{prepSummary.perfectCount}</div>
                <div className="text-[11px] text-[#847063]">完美落刀</div>
              </div>
              <div className="rounded-xl bg-white py-2.5">
                <div className="text-base font-bold text-[#C87A19]">{prepSummary.goodCount}</div>
                <div className="text-[11px] text-[#847063]">精准切线</div>
              </div>
              <div className="rounded-xl bg-white py-2.5">
                <div className="text-base font-bold text-[#8A7568]">{prepSummary.offCount}</div>
                <div className="text-[11px] text-[#847063]">略微偏刀</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCook}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C84B1D] py-3.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(200,75,29,0.34)] transition-colors hover:bg-[#AE3D14]"
            >
              <span>端菜入锅 · 开始掌勺</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* COOKING FAILURE MODAL (Step timeout or burnt dish) */}
      {mode === 'cook-failed' && failureInfo && recipe && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center p-4 sm:items-center">
          <div className="pointer-events-auto w-full max-w-md rounded-[26px] bg-[#FFFBF6] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDECEC] text-[#C53030]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-[#8A7568]">
              {recipe.name} · {diffCfg.label}模式 · 掌勺翻车
            </p>
            <h2 className="font-serif-cn mt-1 text-2xl font-bold text-[#2A1E17]">
              {failureInfo.reasonTitle}
            </h2>

            <div className="mt-3.5 rounded-2xl border border-[#F0DDD5] bg-white p-4 text-left">
              <div className="text-xs font-semibold text-[#C53030]">
                失败节点：{failureInfo.failedStepTitle}（已完成 {failureInfo.completedSteps}/
                {failureInfo.totalSteps} 步）
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5A473B]">
                {failureInfo.reasonDetail}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={onRetryCookOnly}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#C84B1D] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#AE3D14]"
              >
                <RotateCcw className="h-4 w-4" />
                <span>保留备料 · 重新掌勺</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onRetryFullRecipe}
                  className="rounded-xl bg-[#F3E9DD] py-2.5 text-xs font-semibold text-[#4A382D] transition-colors hover:bg-[#E8DAC9]"
                >
                  从切菜重来
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-xl bg-[#F3E9DD] py-2.5 text-xs font-semibold text-[#4A382D] transition-colors hover:bg-[#E8DAC9]"
                >
                  换道菜 / 调难度
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING POP FEEDBACK */}
      {feedback && prepCountdown <= 0 && mode !== 'prep-summary' && mode !== 'cook-failed' && (
        <div
          key={feedback.id}
          className="animate-float-pop pointer-events-none fixed top-[32%] left-1/2 z-20"
        >
          <span
            className={`rounded-xl px-3.5 py-1.5 text-sm font-bold shadow-md ${
              feedback.tone === 'good'
                ? 'bg-[#FFFBF6] text-[#B83D12]'
                : feedback.tone === 'warn'
                  ? 'bg-[#3B1814] text-[#FFB0A3]'
                  : 'bg-[#1A130F]/85 text-[#FFF8F0]'
            }`}
          >
            {feedback.text}
          </span>
        </div>
      )}

      {/* BOTTOM PURE CONTROL DOCK */}
      <div className="mx-auto w-full max-w-[680px]">
        {mode === 'cook' && recipe && activeCookStage && (
          <div className="pointer-events-auto rounded-[22px] bg-[#FFFBF6] p-3 shadow-[0_14px_40px_rgba(10,6,3,0.48)] sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-[#F3E9DD] p-1">
                {FLAME_LABELS.map((item) => {
                  const active = flameLevel === item.level;
                  const isRec = diffCfg.showSeasoningHint && activeCookStage.recommendedFlame === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => onSetFlame(item.level)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 sm:px-3 ${
                        active
                          ? item.level === 0
                            ? 'bg-[#3C3028] text-white'
                            : 'bg-[#C84B1D] text-white'
                          : 'text-[#5A473B] hover:bg-white/70'
                      }`}
                    >
                      {item.level > 0 && (
                        <Flame
                          className={`h-3.5 w-3.5 ${
                            active ? 'text-[#FFE2B8]' : isRec ? 'text-[#C84B1D]' : 'text-[#A08A7A]'
                          }`}
                        />
                      )}
                      <span>{item.label}</span>
                      <span className={`text-[10px] ${active ? 'text-white/70' : 'text-[#9A8577]'}`}>
                        {item.keyHint}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onWokToss}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                  wokTemp > 84
                    ? 'bg-[#C53030] text-white hover:bg-[#A62626]'
                    : 'bg-[#2A1E17] text-[#FFFBF6] hover:bg-[#3F2E24]'
                }`}
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>颠勺翻炒 (Space)</span>
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {recipe.adaptedAvailableSeasonings.map((sid) => {
                const s = SEASONINGS[sid];
                if (!s) return null;
                const alreadyDone = addedSeasonings.includes(sid);
                const isNext = diffCfg.showSeasoningHint && nextRequiredSeasoningId === sid;

                return (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => onAddSeasoning(sid)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      alreadyDone
                        ? 'border-[#CBE2D3] bg-[#EFF8F2] text-[#2B7A4B]'
                        : isNext
                          ? 'border-[#C84B1D] bg-[#FFF2EA] font-semibold text-[#B83D12]'
                          : 'border-[#E9DDD0] bg-white text-[#4A382E] hover:border-[#C9B4A1]'
                    }`}
                    title={s.note}
                  >
                    {alreadyDone ? (
                      <Check className="h-3.5 w-3.5 text-[#2B7A4B]" />
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                    )}
                    <span>{s.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
