import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import {
  CookingHud,
  type CookFailureInfo,
  type FloatingFeedback,
  type PrepScoreSummary,
} from './components/CookingHud';
import { EncyclopediaDrawer } from './components/EncyclopediaDrawer';
import { RecipeSelectModal } from './components/RecipeSelectModal';
import {
  ResultModal,
  type CookingScoreReport,
  type StepCookScore,
} from './components/ResultModal';
import { TitleOverlay } from './components/TitleOverlay';
import {
  adaptRecipeForDifficulty,
  DIFFICULTY_CONFIGS,
  type AdaptedRecipe,
  type DifficultyLevel,
} from './data/difficulty';
import { RECIPES, SEASONINGS, type Recipe } from './data/recipes';
import { KitchenScene } from './engine/KitchenScene';
import type { CutLineRecord } from './engine/proceduralTextures';
import { loadChefProgress, saveChefProgress, type ChefProgress } from './utils/storage';

type GameScreen =
  | 'title'
  | 'recipes'
  | 'prep'
  | 'prep-summary'
  | 'cook'
  | 'cook-failed'
  | 'blitz'
  | 'result';

const FLAME_TARGET_TEMP: Record<0 | 1 | 2 | 3, number> = {
  0: 22,
  1: 45,
  2: 67,
  3: 96,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<KitchenScene | null>(null);

  const [progress, setProgress] = useState<ChefProgress>(() => {
    const loaded = loadChefProgress();
    soundEngine.setMuted(loaded.muted);
    return loaded;
  });

  const difficulty: DifficultyLevel = progress.difficulty;
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];

  const [screen, setScreen] = useState<GameScreen>('title');
  const [resultKind, setResultKind] = useState<'dish' | 'blitz'>('dish');
  const [encyclopediaOpen, setEncyclopediaOpen] = useState(false);
  const [encyclopediaRecipeId, setEncyclopediaRecipeId] = useState<string | undefined>(undefined);
  const [baseRecipe, setBaseRecipe] = useState<Recipe>(RECIPES[0]);
  const [feedback, setFeedback] = useState<FloatingFeedback | null>(null);
  const feedbackSeqRef = useRef(0);

  const adaptedRecipe: AdaptedRecipe = useMemo(
    () => adaptRecipeForDifficulty(baseRecipe, difficulty),
    [baseRecipe, difficulty],
  );

  // Prep mode state
  const [prepCountdown, setPrepCountdown] = useState(0);
  const [ingredientIndex, setIngredientIndex] = useState(0);
  const [directionIndex, setDirectionIndex] = useState(0);
  const [cutsInDirection, setCutsInDirection] = useState(0);
  const [totalCutsDone, setTotalCutsDone] = useState(0);
  const [prepSummary, setPrepSummary] = useState<PrepScoreSummary | null>(null);

  const axisCutsRef = useRef<[CutLineRecord[], CutLineRecord[], CutLineRecord[]]>([[], [], []]);
  const prepAccuracyRef = useRef({ perfect: 0, good: 0, off: 0, scoreSum: 0, count: 0 });

  // Blitz (5-second tofu challenge) state
  const [blitzStarted, setBlitzStarted] = useState(false);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(5.0);
  const [blitzCuts, setBlitzCuts] = useState(0);
  const blitzCutsRef = useRef(0);
  const blitzAxesRef = useRef<[CutLineRecord[], CutLineRecord[], CutLineRecord[]]>([[], [], []]);

  // Cook mode state
  const [cookStageIndex, setCookStageIndex] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(18);
  const [flameLevel, setFlameLevel] = useState<0 | 1 | 2 | 3>(1);
  const [wokTemp, setWokTemp] = useState(32);
  const [stageProgress, setStageProgress] = useState(0);
  const [addedSeasonings, setAddedSeasonings] = useState<string[]>([]);
  const [tossCountInStage, setTossCountInStage] = useState(0);
  const [burnRisk, setBurnRisk] = useState(0);
  const [failureInfo, setFailureInfo] = useState<CookFailureInfo | null>(null);
  const [scoreReport, setScoreReport] = useState<CookingScoreReport | null>(null);

  const cookSimRef = useRef({
    temp: 32,
    flame: 1 as 0 | 1 | 2 | 3,
    stageIdx: 0,
    stageProgress: 0,
    stepTimeLeft: 18,
    stageElapsed: 0,
    stageInZoneTime: 0,
    stageFlameMatchTime: 0,
    burnRisk: 0,
    inZoneTime: 0,
    flameMatchTime: 0,
    totalCookTime: 0,
    timingScoreSum: 0,
    timingEvents: 0,
    seasoningMistakes: 0,
    tossCountInStage: 0,
    addedSeasonings: [] as string[],
    stepScores: [] as StepCookScore[],
    knifeScore: 95,
  });

  const pushFeedback = useCallback((text: string, tone: FloatingFeedback['tone'] = 'neutral') => {
    feedbackSeqRef.current += 1;
    setFeedback({ id: feedbackSeqRef.current, text, tone });
  }, []);

  useEffect(() => {
    saveChefProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!canvasMountRef.current) return;
    const kitchen = new KitchenScene(canvasMountRef.current);
    sceneRef.current = kitchen;
    return () => {
      soundEngine.setFlameAndSizzle(0, 0);
      kitchen.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (screen === 'title' || screen === 'recipes') {
      scene.setMode('title');
      soundEngine.setFlameAndSizzle(0, 0);
    } else if (screen === 'prep') {
      scene.setMode('prep');
      soundEngine.setFlameAndSizzle(0, 0);
    } else if (screen === 'prep-summary') {
      scene.setMode('prep-summary');
      scene.setPrepGuideScanning(false, 0.5);
      soundEngine.setFlameAndSizzle(0, 0);
    } else if (screen === 'blitz') {
      scene.setMode('blitz');
      scene.setPrepGuideScanning(false, 0.1);
      soundEngine.setFlameAndSizzle(0, 0);
    } else if (screen === 'cook') {
      scene.setMode('cook');
    } else if (screen === 'cook-failed') {
      scene.setMode('cook');
      soundEngine.setFlameAndSizzle(0, 0);
    } else if (screen === 'result') {
      scene.setMode(resultKind === 'dish' ? 'result' : 'blitz');
      soundEngine.setFlameAndSizzle(0, 0);
    }
  }, [screen, resultKind]);

  const handleChangeDifficulty = useCallback((level: DifficultyLevel) => {
    setProgress((prev) => ({ ...prev, difficulty: level }));
  }, []);

  const handleToggleMute = useCallback(() => {
    soundEngine.unlock();
    setProgress((prev) => {
      const nextMuted = !prev.muted;
      soundEngine.setMuted(nextMuted);
      return { ...prev, muted: nextMuted };
    });
  }, []);

  const handleToggleBookmark = useCallback((entryId: string) => {
    setProgress((prev) => {
      const exists = prev.bookmarks.includes(entryId);
      const bookmarks = exists
        ? prev.bookmarks.filter((id) => id !== entryId)
        : [...prev.bookmarks, entryId];
      return { ...prev, bookmarks };
    });
  }, []);

  const loadIngredientOnBlock = useCallback(
    (recipe: AdaptedRecipe, idx: number, enableScan: boolean, level: DifficultyLevel) => {
      const ing = recipe.adaptedPrep[idx];
      if (!ing || !sceneRef.current) return;
      const cfg = DIFFICULTY_CONFIGS[level];
      axisCutsRef.current = [[], [], []];
      sceneRef.current.setIngredient({
        shape: ing.shape,
        baseColor: ing.baseColor,
        innerColor: ing.innerColor,
        crumbColor: ing.crumbColor,
        showGuides: true,
        directions: ing.directions,
        cutsPerDirection: ing.adaptedCutsPerDirection,
        activeDirection: 0,
        activeCutIndex: 0,
        axis1Cuts: [],
        axis2Cuts: [],
        axis3Cuts: [],
      });
      const firstTargetRatio = 1 / (ing.adaptedCutsPerDirection + 1);
      const baseSpeed = ing.cutStyle === 'shred' ? 3.0 : 2.45;
      sceneRef.current.setPrepGuideScanning(
        enableScan,
        firstTargetRatio,
        baseSpeed * cfg.sweepSpeedScale,
      );
    },
    [],
  );

  // Start recipe with 3-second pre-chop countdown
  const startRecipe = useCallback(
    (recipe: Recipe) => {
      soundEngine.unlock();
      setEncyclopediaOpen(false);
      setBaseRecipe(recipe);
      const adapted = adaptRecipeForDifficulty(recipe, difficulty);

      setResultKind('dish');
      setIngredientIndex(0);
      setDirectionIndex(0);
      setCutsInDirection(0);
      setTotalCutsDone(0);
      setPrepSummary(null);
      setFailureInfo(null);
      setScoreReport(null);
      prepAccuracyRef.current = { perfect: 0, good: 0, off: 0, scoreSum: 0, count: 0 };

      setScreen('prep');
      setPrepCountdown(3.0);
      loadIngredientOnBlock(adapted, 0, false, difficulty);
    },
    [difficulty, loadIngredientOnBlock],
  );

  // 3-second pre-chop countdown loop
  useEffect(() => {
    if (screen !== 'prep' || prepCountdown <= 0 || encyclopediaOpen) return;

    let raf = 0;
    let last = performance.now();
    let prevWhole = Math.ceil(prepCountdown);

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      setPrepCountdown((prev) => {
        const next = Math.max(0, prev - dt);
        const curWhole = Math.ceil(next);
        if (curWhole < prevWhole && curWhole > 0) {
          prevWhole = curWhole;
          soundEngine.playChop('soft', 1);
        }
        if (next <= 0) {
          const ing = adaptedRecipe.adaptedPrep[ingredientIndex];
          if (ing && sceneRef.current) {
            const targetRatio = 1 / (ing.adaptedCutsPerDirection + 1);
            const baseSpeed = ing.cutStyle === 'shred' ? 3.0 : 2.45;
            sceneRef.current.setPrepGuideScanning(
              true,
              targetRatio,
              baseSpeed * diffCfg.sweepSpeedScale,
            );
          }
          soundEngine.playStepComplete();
          pushFeedback('开始落刀！对准金色切线', 'good');
          return 0;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [
    screen,
    prepCountdown,
    encyclopediaOpen,
    adaptedRecipe,
    ingredientIndex,
    diffCfg.sweepSpeedScale,
    pushFeedback,
  ]);

  const startBlitz = useCallback(() => {
    soundEngine.unlock();
    setEncyclopediaOpen(false);
    setResultKind('blitz');
    setBlitzStarted(false);
    setBlitzTimeLeft(5.0);
    setBlitzCuts(0);
    blitzCutsRef.current = 0;
    blitzAxesRef.current = [[], [], []];
    setScreen('blitz');

    sceneRef.current?.setIngredient({
      shape: 'tofu',
      baseColor: '#F5EFE2',
      innerColor: '#FFFDF7',
      crumbColor: '#F7F2E8',
      showGuides: false,
      directions: 3,
      cutsPerDirection: 12,
      activeDirection: 0,
      activeCutIndex: 0,
      axis1Cuts: [],
      axis2Cuts: [],
      axis3Cuts: [],
    });
    pushFeedback('点击屏幕或按 Space 开始狂切！', 'good');
  }, [pushFeedback]);

  // Begin wok cooking stage (triggers 3D hand bowl pour + initial flame)
  const beginWokCooking = useCallback(
    (recipe: AdaptedRecipe, knifeScore: number) => {
      const cfg = DIFFICULTY_CONFIGS[difficulty];
      const firstIng = recipe.adaptedPrep[0];
      const firstStage = recipe.adaptedStages[0];
      // Novice auto-sets recommended flame; Expert/Master start at low flame (1) so player consciously adjusts knob!
      const startFlame: 0 | 1 | 2 | 3 = cfg.autoSetInitialFlame
        ? firstStage.recommendedFlame
        : 1;

      cookSimRef.current = {
        temp: 32,
        flame: startFlame,
        stageIdx: 0,
        stageProgress: 0,
        stepTimeLeft: firstStage.timeLimitSec,
        stageElapsed: 0,
        stageInZoneTime: 0,
        stageFlameMatchTime: 0,
        burnRisk: 0,
        inZoneTime: 0,
        flameMatchTime: 0,
        totalCookTime: 0,
        timingScoreSum: 0,
        timingEvents: 0,
        seasoningMistakes: 0,
        tossCountInStage: 0,
        addedSeasonings: [],
        stepScores: [],
        knifeScore,
      };

      setCookStageIndex(0);
      setStepTimeLeft(firstStage.timeLimitSec);
      setFlameLevel(startFlame);
      setWokTemp(32);
      setStageProgress(0);
      setAddedSeasonings([]);
      setTossCountInStage(0);
      setBurnRisk(0);
      setFailureInfo(null);

      sceneRef.current?.configureWokDish(
        firstIng.baseColor,
        recipe.dishVisualColor,
        firstStage.sauceColor,
        recipe.garnishColor,
      );
      sceneRef.current?.updateCookVisuals({
        flameLevel: startFlame,
        temp: 32,
        progress0to1: 0,
        sauceColor: firstStage.sauceColor,
      });

      setScreen('cook');
      soundEngine.playIgnite();
      sceneRef.current?.triggerIngredientPour(firstIng.baseColor);
      window.setTimeout(() => {
        sceneRef.current?.triggerKnobTurn(startFlame);
      }, 650);
      pushFeedback(`食材入锅 · 限时 ${firstStage.timeLimitSec} 秒`, 'good');
    },
    [difficulty, pushFeedback],
  );

  // Trigger cooking failure (timeout or burnt wok)
  const triggerCookFailure = useCallback(
    (kind: 'timeout' | 'burn', recipe: AdaptedRecipe, stageIdx: number) => {
      const stage = recipe.adaptedStages[stageIdx];
      soundEngine.setFlameAndSizzle(0, 0);
      soundEngine.playErrorCue();
      sceneRef.current?.triggerKnobTurn(0);

      setFailureInfo({
        reasonTitle: kind === 'timeout' ? '步骤超时 · 菜品过火' : '锅温失控 · 焦糊翻车',
        reasonDetail:
          kind === 'timeout'
            ? `「${stage.title}」未能在 ${stage.timeLimitSec} 秒内完成全部调料与控火进度。现实炒菜讲究一气呵成，拖延太久会导致食材变老出水。`
            : `在「${stage.title}」阶段持续处于过高锅温且未及时颠勺散热或拧小火候，菜肴已经粘锅糊底。`,
        failedStepTitle: stage.title,
        completedSteps: stageIdx,
        totalSteps: recipe.adaptedStages.length,
      });
      setScreen('cook-failed');
    },
    [],
  );

  // Compute detailed multi-factor cooking report & save best stars
  const finishDish = useCallback(
    (recipe: AdaptedRecipe) => {
      const sim = cookSimRef.current;
      const inZoneRatio = sim.totalCookTime > 0 ? sim.inZoneTime / sim.totalCookTime : 0.85;
      const flameMatchRatio = sim.totalCookTime > 0 ? sim.flameMatchTime / sim.totalCookTime : 0.85;
      const burnPenalty = Math.min(26, sim.burnRisk * 0.3);

      const flameControlScore = Math.max(
        52,
        Math.min(100, Math.round(52 + inZoneRatio * 32 + flameMatchRatio * 18 - burnPenalty)),
      );
      const avgTiming =
        sim.timingEvents > 0 ? sim.timingScoreSum / sim.timingEvents : 92;
      const timingScore = Math.max(
        50,
        Math.min(100, Math.round(avgTiming - sim.seasoningMistakes * 6)),
      );
      const stepAvg =
        sim.stepScores.length > 0
          ? sim.stepScores.reduce((s, st) => s + st.score, 0) / sim.stepScores.length
          : 85;
      const cookOverallScore = Math.round(
        flameControlScore * 0.45 + timingScore * 0.35 + stepAvg * 0.2,
      );
      const knifeScore = sim.knifeScore;
      const totalScore = Math.round(knifeScore * 0.3 + cookOverallScore * 0.7);

      const stars: 1 | 2 | 3 = totalScore >= 88 ? 3 : totalScore >= 74 ? 2 : 1;
      const chefTitle =
        totalScore >= 94
          ? '一代厨神'
          : totalScore >= 86
            ? '金牌掌勺大厨'
            : totalScore >= 74
              ? '地道家常好手'
              : '潜力新秀主厨';

      const report: CookingScoreReport = {
        difficulty,
        knifeScore,
        flameControlScore,
        timingScore,
        cookOverallScore,
        totalScore,
        stars,
        chefTitle,
        stepScores: [...sim.stepScores],
      };

      setScoreReport(report);
      setResultKind('dish');
      setScreen('result');
      soundEngine.setFlameAndSizzle(0, 0);
      soundEngine.playDishComplete();

      setProgress((prev) => {
        const existing = prev.dishes[recipe.id];
        const nextRecord = {
          bestScore: Math.max(existing?.bestScore ?? 0, totalScore),
          bestStars: Math.max(existing?.bestStars ?? 1, stars) as 1 | 2 | 3,
          completions: (existing?.completions ?? 0) + 1,
        };
        return {
          ...prev,
          dishes: {
            ...prev.dishes,
            [recipe.id]: nextRecord,
          },
        };
      });
    },
    [difficulty],
  );

  // Handle knife chop (Prep & Blitz)
  const handleChop = useCallback(() => {
    if (encyclopediaOpen) return;
    soundEngine.unlock();

    if (screen === 'blitz') {
      if (!blitzStarted) {
        setBlitzStarted(true);
      }
      const nextCuts = blitzCutsRef.current + 1;
      blitzCutsRef.current = nextCuts;
      setBlitzCuts(nextCuts);

      const phase = nextCuts <= 12 ? 0 : nextCuts <= 24 ? 1 : 2;
      const indexInPhase = (nextCuts - 1) % 12;
      const ratio = (indexInPhase + 1) / 13;
      blitzAxesRef.current[phase].push({ ratio, quality: 'perfect' });

      sceneRef.current?.updateIngredientCuts(
        {
          shape: 'tofu',
          baseColor: '#F5EFE2',
          innerColor: '#FFFDF7',
          crumbColor: '#F7F2E8',
          showGuides: false,
          directions: 3,
          cutsPerDirection: 12,
          activeDirection: phase,
          activeCutIndex: indexInPhase + 1,
          axis1Cuts: blitzAxesRef.current[0],
          axis2Cuts: blitzAxesRef.current[1],
          axis3Cuts: blitzAxesRef.current[2],
        },
        ratio,
      );
      sceneRef.current?.triggerChopImpact('#F7F2E8', 0.95);
      soundEngine.playChop('soft', nextCuts);

      if (nextCuts === 13) pushFeedback('二向切条！继续加速', 'good');
      else if (nextCuts === 25) pushFeedback('三向切丁！刀光如影', 'good');
      else if (nextCuts % 5 === 0) pushFeedback(`${nextCuts} 刀！`, 'neutral');
      return;
    }

    if (screen !== 'prep' || prepCountdown > 0) return;

    const ing = adaptedRecipe.adaptedPrep[ingredientIndex];
    if (!ing || !sceneRef.current) return;

    const sample = sceneRef.current.sampleBladeAlignment();
    const tol = diffCfg.perfectToleranceScale;
    let quality: CutLineRecord['quality'] = 'perfect';
    let cutScore = 100;
    if (sample.normalizedError <= 0.34 * tol) {
      quality = 'perfect';
      cutScore = 100;
      prepAccuracyRef.current.perfect += 1;
      pushFeedback('完美落刀！', 'good');
    } else if (sample.normalizedError <= 0.72 * tol) {
      quality = 'good';
      cutScore = 84;
      prepAccuracyRef.current.good += 1;
      pushFeedback('精准切线', 'neutral');
    } else {
      quality = 'off';
      cutScore = 60;
      prepAccuracyRef.current.off += 1;
      pushFeedback('略微偏刀 · 盯紧金线', 'warn');
    }
    prepAccuracyRef.current.scoreSum += cutScore;
    prepAccuracyRef.current.count += 1;

    const nextCutsInDir = cutsInDirection + 1;
    const nextTotal = totalCutsDone + 1;
    setTotalCutsDone(nextTotal);

    const recordedRatio = quality === 'perfect' ? sample.targetRatio : sample.actualRatio;
    axisCutsRef.current[directionIndex].push({ ratio: recordedRatio, quality });

    sceneRef.current.triggerChopImpact(ing.crumbColor, quality === 'perfect' ? 1.1 : 0.9);
    soundEngine.playChop(ing.soundTexture, nextTotal);

    const sweepSpeed = (ing.cutStyle === 'shred' ? 3.0 : 2.45) * diffCfg.sweepSpeedScale;

    if (nextCutsInDir >= ing.adaptedCutsPerDirection) {
      if (directionIndex + 1 < ing.directions) {
        const nextDir = directionIndex + 1;
        setDirectionIndex(nextDir);
        setCutsInDirection(0);
        soundEngine.playStepComplete();

        sceneRef.current.updateIngredientCuts({
          shape: ing.shape,
          baseColor: ing.baseColor,
          innerColor: ing.innerColor,
          crumbColor: ing.crumbColor,
          showGuides: true,
          directions: ing.directions,
          cutsPerDirection: ing.adaptedCutsPerDirection,
          activeDirection: nextDir,
          activeCutIndex: 0,
          axis1Cuts: axisCutsRef.current[0],
          axis2Cuts: axisCutsRef.current[1],
          axis3Cuts: axisCutsRef.current[2],
        });
        sceneRef.current.setPrepGuideScanning(
          true,
          1 / (ing.adaptedCutsPerDirection + 1),
          sweepSpeed,
        );
        pushFeedback(ing.directionLabels[nextDir] ?? `转向第 ${nextDir + 1} 刀向！`, 'good');
      } else if (ingredientIndex + 1 < adaptedRecipe.adaptedPrep.length) {
        const nextIdx = ingredientIndex + 1;
        setIngredientIndex(nextIdx);
        setDirectionIndex(0);
        setCutsInDirection(0);
        soundEngine.playStepComplete();
        loadIngredientOnBlock(adaptedRecipe, nextIdx, true, difficulty);
        const nextIng = adaptedRecipe.adaptedPrep[nextIdx];
        pushFeedback(
          `${ing.name}切好！切换 ${nextIng.name}（${nextIng.sizeSpecLabel}）`,
          'good',
        );
      } else {
        const acc = prepAccuracyRef.current;
        const knifeScore =
          acc.count > 0 ? Math.max(55, Math.min(100, Math.round(acc.scoreSum / acc.count))) : 92;
        const grade: PrepScoreSummary['grade'] =
          knifeScore >= 93 ? 'S' : knifeScore >= 84 ? 'A' : knifeScore >= 72 ? 'B' : 'C';
        const gradeLabel =
          grade === 'S'
            ? '刀神级刀工'
            : grade === 'A'
              ? '大厨级均匀'
              : grade === 'B'
                ? '熟练稳健'
                : '初入案板';

        const specsSummary = adaptedRecipe.adaptedPrep
          .map((i) => `${i.name}(${i.sizeSpecLabel})`)
          .join(' + ');

        sceneRef.current.updateIngredientCuts({
          shape: ing.shape,
          baseColor: ing.baseColor,
          innerColor: ing.innerColor,
          crumbColor: ing.crumbColor,
          showGuides: false,
          directions: ing.directions,
          cutsPerDirection: ing.adaptedCutsPerDirection,
          activeDirection: directionIndex,
          activeCutIndex: ing.adaptedCutsPerDirection,
          axis1Cuts: axisCutsRef.current[0],
          axis2Cuts: axisCutsRef.current[1],
          axis3Cuts: axisCutsRef.current[2],
        });

        setPrepSummary({
          knifeScore,
          grade,
          gradeLabel,
          perfectCount: acc.perfect,
          goodCount: acc.good,
          offCount: acc.off,
          totalCuts: acc.count,
          specsSummary,
        });
        soundEngine.playStepComplete();
        setScreen('prep-summary');
      }
    } else {
      setCutsInDirection(nextCutsInDir);
      sceneRef.current.updateIngredientCuts({
        shape: ing.shape,
        baseColor: ing.baseColor,
        innerColor: ing.innerColor,
        crumbColor: ing.crumbColor,
        showGuides: true,
        directions: ing.directions,
        cutsPerDirection: ing.adaptedCutsPerDirection,
        activeDirection: directionIndex,
        activeCutIndex: nextCutsInDir,
        axis1Cuts: axisCutsRef.current[0],
        axis2Cuts: axisCutsRef.current[1],
        axis3Cuts: axisCutsRef.current[2],
      });
      const nextRatio = (nextCutsInDir + 1) / (ing.adaptedCutsPerDirection + 1);
      sceneRef.current.setPrepGuideScanning(true, nextRatio, sweepSpeed);
    }
  }, [
    encyclopediaOpen,
    screen,
    blitzStarted,
    prepCountdown,
    adaptedRecipe,
    ingredientIndex,
    directionIndex,
    cutsInDirection,
    totalCutsDone,
    diffCfg,
    difficulty,
    loadIngredientOnBlock,
    pushFeedback,
  ]);

  // Blitz 5-second countdown
  useEffect(() => {
    if (screen !== 'blitz' || !blitzStarted || encyclopediaOpen) return;

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      setBlitzTimeLeft((prev) => {
        const next = Math.max(0, prev - dt);
        if (next <= 0) {
          const finalCuts = blitzCutsRef.current;
          soundEngine.playDishComplete();
          setProgress((p) => ({
            ...p,
            blitzBestCuts: Math.max(p.blitzBestCuts, finalCuts),
          }));
          setResultKind('blitz');
          setScreen('result');
          return 0;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [screen, blitzStarted, encyclopediaOpen]);

  // Cook mode controls (linked to 3D chef hands!)
  const handleSetFlame = useCallback(
    (level: 0 | 1 | 2 | 3) => {
      if (screen !== 'cook') return;
      soundEngine.unlock();
      const prev = cookSimRef.current.flame;
      if (prev === 0 && level > 0) {
        soundEngine.playIgnite();
      }
      cookSimRef.current.flame = level;
      setFlameLevel(level);
      sceneRef.current?.triggerKnobTurn(level);

      const stage = adaptedRecipe.adaptedStages[cookSimRef.current.stageIdx];
      if (stage && level === stage.recommendedFlame && prev !== level) {
        pushFeedback(
          `切换${level === 1 ? '文火' : level === 2 ? '中火' : '旺火'} · 火候对路！`,
          'good',
        );
      }
    },
    [screen, adaptedRecipe, pushFeedback],
  );

  const handleWokToss = useCallback(() => {
    if (screen !== 'cook' || encyclopediaOpen) return;
    soundEngine.unlock();
    const sim = cookSimRef.current;
    sim.temp = Math.max(24, sim.temp - 8.5);
    sim.burnRisk = Math.max(0, sim.burnRisk - 28);
    sim.tossCountInStage += 1;
    setWokTemp(sim.temp);
    setBurnRisk(sim.burnRisk);
    setTossCountInStage(sim.tossCountInStage);

    sceneRef.current?.triggerWokToss();
    soundEngine.playWokToss();
    pushFeedback('漂亮颠勺 · 锅气激发！', 'good');
  }, [screen, encyclopediaOpen, pushFeedback]);

  const handleAddSeasoning = useCallback(
    (seasoningId: string) => {
      if (screen !== 'cook' || encyclopediaOpen) return;
      soundEngine.unlock();
      const sim = cookSimRef.current;
      const stage = adaptedRecipe.adaptedStages[sim.stageIdx];
      const def = SEASONINGS[seasoningId];
      if (!stage || !def) return;

      if (sim.addedSeasonings.includes(seasoningId)) {
        pushFeedback(`${def.shortName}已投放`, 'neutral');
        return;
      }

      const nextExpectedId = stage.adaptedRequiredSeasonings.find(
        (id) => !sim.addedSeasonings.includes(id),
      );

      if (!stage.adaptedRequiredSeasonings.includes(seasoningId)) {
        sim.seasoningMistakes += 1;
        soundEngine.playErrorCue();
        const hintName = nextExpectedId ? SEASONINGS[nextExpectedId]?.shortName : '';
        pushFeedback(
          hintName ? `本步暂不放此料，应放「${hintName}」` : '本步调料已齐，请专心控火颠勺',
          'warn',
        );
        return;
      }

      // Master mode enforces strict recipe seasoning order!
      if (diffCfg.strictSeasoningOrder && nextExpectedId && seasoningId !== nextExpectedId) {
        sim.seasoningMistakes += 1;
        soundEngine.playErrorCue();
        const expectedName = SEASONINGS[nextExpectedId]?.shortName ?? '';
        pushFeedback(`厨神严判：请先放「${expectedName}」再放「${def.shortName}」`, 'warn');
        return;
      }

      // Evaluate real-world oil/wok temperature timing when adding seasoning!
      let timingPts = 100;
      let timingNote = `加入 ${def.name}`;
      let tone: FloatingFeedback['tone'] = 'good';

      if (diffCfg.checkOilTempTiming && seasoningId !== 'oil') {
        const inTemp = sim.temp >= stage.adaptedTempMin - 4 && sim.temp <= stage.adaptedTempMax + 4;
        const tooCold = sim.temp < stage.adaptedTempMin - 4;
        if (inTemp) {
          timingPts = 100;
          timingNote = `时机绝佳 · 加入 ${def.name}`;
        } else if (tooCold) {
          timingPts = 72;
          timingNote = `锅温偏低 · ${def.name}香气略减`;
          tone = 'warn';
        } else {
          timingPts = 68;
          timingNote = `锅温偏高 · 注意防焦`;
          tone = 'warn';
        }
      }

      sim.timingScoreSum += timingPts;
      sim.timingEvents += 1;
      sim.addedSeasonings = [...sim.addedSeasonings, seasoningId];
      setAddedSeasonings(sim.addedSeasonings);
      soundEngine.playSeasoningAdd(def.category);
      sceneRef.current?.triggerSeasoningPour(def.color, def.category);
      pushFeedback(timingNote, tone);
    },
    [screen, encyclopediaOpen, adaptedRecipe, diffCfg, pushFeedback],
  );

  // Cook mode real-time simulation (step countdown, flame/temp duration scoring, fail states!)
  useEffect(() => {
    if (screen !== 'cook' || encyclopediaOpen) {
      soundEngine.setFlameAndSizzle(0, 0);
      return;
    }

    let raf = 0;
    let last = performance.now();
    let uiSyncAcc = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const sim = cookSimRef.current;
      const stage = adaptedRecipe.adaptedStages[sim.stageIdx];
      if (!stage) return;

      // Update per-step countdown timer
      sim.stepTimeLeft = Math.max(0, sim.stepTimeLeft - dt);
      if (sim.stepTimeLeft <= 0) {
        triggerCookFailure('timeout', adaptedRecipe, sim.stageIdx);
        return;
      }

      // Smooth wok temperature physics
      const targetTemp = FLAME_TARGET_TEMP[sim.flame];
      const rate = targetTemp > sim.temp ? 0.58 + sim.flame * 0.25 : 0.44;
      sim.temp += (targetTemp - sim.temp) * Math.min(1, dt * rate);

      sim.totalCookTime += dt;
      sim.stageElapsed += dt;

      const inIdeal =
        sim.temp >= stage.adaptedTempMin && sim.temp <= stage.adaptedTempMax;
      const nearIdeal =
        sim.temp >= stage.adaptedTempMin - 10 && sim.temp <= stage.adaptedTempMax + 10;
      const overheating = sim.temp > stage.adaptedTempMax + 8 || sim.temp > 87;

      if (sim.flame === stage.recommendedFlame) {
        sim.flameMatchTime += dt;
        sim.stageFlameMatchTime += dt;
      }

      if (inIdeal) {
        sim.inZoneTime += dt;
        sim.stageInZoneTime += dt;
        sim.burnRisk = Math.max(0, sim.burnRisk - dt * 10);
      } else if (overheating) {
        sim.burnRisk = Math.min(100, sim.burnRisk + dt * 15 * diffCfg.burnSpeedScale);
        if (sim.burnRisk >= 100) {
          triggerCookFailure('burn', adaptedRecipe, sim.stageIdx);
          return;
        }
      } else {
        sim.burnRisk = Math.max(0, sim.burnRisk - dt * 5);
      }

      const allSeasoned = stage.adaptedRequiredSeasonings.every((id) =>
        sim.addedSeasonings.includes(id),
      );
      const tossMet =
        !diffCfg.requireTossForCompletion || sim.tossCountInStage >= stage.adaptedTossRequired;

      const speedMult = inIdeal ? 1.05 : nearIdeal ? 0.56 : sim.temp >= 28 ? 0.2 : 0;
      const capBeforeReady = allSeasoned && tossMet ? 1 : 0.9;
      sim.stageProgress = Math.min(
        capBeforeReady,
        sim.stageProgress + (dt * speedMult) / stage.durationSec,
      );

      const overallProgress =
        (sim.stageIdx + sim.stageProgress) / adaptedRecipe.adaptedStages.length;
      sceneRef.current?.updateCookVisuals({
        flameLevel: sim.flame,
        temp: sim.temp,
        progress0to1: overallProgress,
        sauceColor: stage.sauceColor,
      });
      soundEngine.setFlameAndSizzle(sim.flame, sim.temp);

      // Stage completed! Score this step individually
      if (allSeasoned && tossMet && sim.stageProgress >= 1) {
        const stepInZoneRatio =
          sim.stageElapsed > 0 ? sim.stageInZoneTime / sim.stageElapsed : 0.85;
        const stepFlameRatio =
          sim.stageElapsed > 0 ? sim.stageFlameMatchTime / sim.stageElapsed : 0.85;
        const tossBonus = sim.tossCountInStage >= stage.adaptedTossRequired ? 8 : 0;
        const timeRatioBonus = Math.min(8, (sim.stepTimeLeft / stage.timeLimitSec) * 14);
        const stepScore = Math.max(
          58,
          Math.min(
            100,
            Math.round(52 + stepInZoneRatio * 24 + stepFlameRatio * 14 + tossBonus + timeRatioBonus),
          ),
        );

        sim.stepScores.push({
          title: stage.title,
          score: stepScore,
          timeRemainingSec: sim.stepTimeLeft,
        });

        if (sim.stageIdx + 1 < adaptedRecipe.adaptedStages.length) {
          const nextIdx = sim.stageIdx + 1;
          const nextStage = adaptedRecipe.adaptedStages[nextIdx];
          sim.stageIdx = nextIdx;
          sim.stageProgress = 0;
          sim.stepTimeLeft = nextStage.timeLimitSec;
          sim.stageElapsed = 0;
          sim.stageInZoneTime = 0;
          sim.stageFlameMatchTime = 0;
          sim.addedSeasonings = [];
          sim.tossCountInStage = 0;

          if (diffCfg.autoSetInitialFlame) {
            sim.flame = nextStage.recommendedFlame;
            setFlameLevel(nextStage.recommendedFlame);
            sceneRef.current?.triggerKnobTurn(nextStage.recommendedFlame);
          }

          setCookStageIndex(nextIdx);
          setStepTimeLeft(nextStage.timeLimitSec);
          setStageProgress(0);
          setAddedSeasonings([]);
          setTossCountInStage(0);
          soundEngine.playStepComplete();
          pushFeedback(`第 ${nextIdx} 步完成（${stepScore}分）· 进入：${nextStage.title}`, 'good');
        } else {
          finishDish(adaptedRecipe);
          return;
        }
      }

      uiSyncAcc += dt;
      if (uiSyncAcc >= 0.05) {
        uiSyncAcc = 0;
        setWokTemp(sim.temp);
        setStageProgress(sim.stageProgress);
        setStepTimeLeft(sim.stepTimeLeft);
        setBurnRisk(sim.burnRisk);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      soundEngine.setFlameAndSizzle(0, 0);
    };
  }, [screen, encyclopediaOpen, adaptedRecipe, diffCfg, triggerCookFailure, finishDish, pushFeedback]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          setEncyclopediaOpen(false);
        }
        return;
      }

      if (e.key === 'Escape' && encyclopediaOpen) {
        e.preventDefault();
        setEncyclopediaOpen(false);
        return;
      }
      if (encyclopediaOpen) return;

      if (e.key === 'Enter' && screen === 'title') {
        e.preventDefault();
        soundEngine.unlock();
        setScreen('recipes');
        return;
      }

      if ((e.key === 'Enter' || e.code === 'Space') && screen === 'prep-summary' && prepSummary) {
        e.preventDefault();
        beginWokCooking(adaptedRecipe, prepSummary.knifeScore);
        return;
      }

      if (e.code === 'Space') {
        if (screen === 'prep' || screen === 'blitz') {
          e.preventDefault();
          if (!e.repeat) handleChop();
        } else if (screen === 'cook') {
          e.preventDefault();
          if (!e.repeat) handleWokToss();
        }
        return;
      }

      if (screen === 'cook') {
        if (e.key === '0') handleSetFlame(0);
        else if (e.key === '1') handleSetFlame(1);
        else if (e.key === '2') handleSetFlame(2);
        else if (e.key === '3') handleSetFlame(3);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screen,
    encyclopediaOpen,
    prepSummary,
    adaptedRecipe,
    beginWokCooking,
    handleChop,
    handleWokToss,
    handleSetFlame,
  ]);

  const activeIngredient = adaptedRecipe.adaptedPrep[ingredientIndex] ?? null;
  const activeCookStage = adaptedRecipe.adaptedStages[cookStageIndex] ?? null;
  const blitzPhase = blitzCuts <= 12 ? 0 : blitzCuts <= 24 ? 1 : 2;

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#1C1612]">
      {/* Isolated Full-Viewport 3D Kitchen WebGL Canvas */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 h-full w-full touch-none select-none"
        onPointerDown={() => {
          if (screen === 'prep' || screen === 'blitz') {
            handleChop();
          }
        }}
        role={screen === 'prep' || screen === 'blitz' ? 'button' : undefined}
        aria-label={screen === 'prep' || screen === 'blitz' ? '点击砧板下刀切菜' : '3D中式厨房视口'}
      />

      {screen === 'title' && (
        <TitleOverlay
          progress={progress}
          difficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          onStartCooking={() => {
            soundEngine.unlock();
            setScreen('recipes');
          }}
          onStartBlitz={startBlitz}
          onOpenEncyclopedia={() => {
            setEncyclopediaRecipeId(undefined);
            setEncyclopediaOpen(true);
          }}
        />
      )}

      {screen === 'recipes' && (
        <RecipeSelectModal
          progress={progress}
          difficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          onSelectRecipe={startRecipe}
          onStartBlitz={startBlitz}
          onOpenEncyclopedia={(recipeId) => {
            setEncyclopediaRecipeId(recipeId);
            setEncyclopediaOpen(true);
          }}
          onBack={() => setScreen('title')}
        />
      )}

      {(screen === 'prep' ||
        screen === 'prep-summary' ||
        screen === 'cook' ||
        screen === 'cook-failed' ||
        screen === 'blitz') && (
        <CookingHud
          mode={screen}
          difficulty={difficulty}
          recipe={adaptedRecipe}
          muted={progress.muted}
          onToggleMute={handleToggleMute}
          onBack={() => {
            soundEngine.setFlameAndSizzle(0, 0);
            setScreen('recipes');
          }}
          onOpenEncyclopedia={() => {
            setEncyclopediaRecipeId(baseRecipe.id);
            setEncyclopediaOpen(true);
          }}
          feedback={feedback}
          prepCountdown={prepCountdown}
          ingredientIndex={ingredientIndex}
          activeIngredient={activeIngredient}
          directionIndex={directionIndex}
          cutsInDirection={cutsInDirection}
          totalCutsDone={totalCutsDone}
          prepSummary={prepSummary}
          onProceedToCook={() => {
            if (prepSummary) {
              beginWokCooking(adaptedRecipe, prepSummary.knifeScore);
            }
          }}
          blitzTimeLeft={blitzTimeLeft}
          blitzCuts={blitzCuts}
          blitzPhase={blitzPhase}
          blitzStarted={blitzStarted}
          cookStageIndex={cookStageIndex}
          activeCookStage={activeCookStage}
          stepTimeLeft={stepTimeLeft}
          flameLevel={flameLevel}
          wokTemp={wokTemp}
          stageProgress={stageProgress}
          addedSeasonings={addedSeasonings}
          tossCountInStage={tossCountInStage}
          burnRisk={burnRisk}
          failureInfo={failureInfo}
          onSetFlame={handleSetFlame}
          onWokToss={handleWokToss}
          onAddSeasoning={handleAddSeasoning}
          onRetryCookOnly={() =>
            beginWokCooking(adaptedRecipe, prepSummary?.knifeScore ?? cookSimRef.current.knifeScore)
          }
          onRetryFullRecipe={() => startRecipe(baseRecipe)}
        />
      )}

      {screen === 'result' && (
        <ResultModal
          mode={resultKind}
          recipe={baseRecipe}
          report={scoreReport}
          blitzCuts={blitzCuts}
          blitzBest={progress.blitzBestCuts}
          onReplay={() => {
            if (resultKind === 'blitz') startBlitz();
            else startRecipe(baseRecipe);
          }}
          onSelectAnother={() => setScreen('recipes')}
          onOpenEncyclopedia={(recipeId) => {
            setEncyclopediaRecipeId(recipeId);
            setEncyclopediaOpen(true);
          }}
        />
      )}

      {encyclopediaOpen && (
        <EncyclopediaDrawer
          initialRecipeId={encyclopediaRecipeId}
          bookmarks={progress.bookmarks}
          onToggleBookmark={handleToggleBookmark}
          onCookRecipe={startRecipe}
          onClose={() => setEncyclopediaOpen(false)}
        />
      )}
    </main>
  );
}
