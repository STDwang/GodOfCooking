export type IngredientShape =
  | 'tofu'
  | 'tomato'
  | 'scallion'
  | 'chicken'
  | 'cucumber'
  | 'potato'
  | 'pork-belly'
  | 'pork-loin'
  | 'carrot'
  | 'pepper';

export type ChopSoundTexture = 'soft' | 'crisp' | 'firm' | 'meat';

export type CutStyle = 'slice' | 'shred' | 'dice' | 'wedge' | 'cube';

export type SeasoningCategory = 'liquid' | 'paste' | 'powder' | 'aromatic';

export interface SeasoningDef {
  id: string;
  name: string;
  shortName: string;
  category: SeasoningCategory;
  color: string;
  note: string;
}

export interface PrepIngredient {
  id: string;
  name: string;
  shape: IngredientShape;
  baseColor: string;
  innerColor: string;
  crumbColor: string;
  soundTexture: ChopSoundTexture;
  cutStyle: CutStyle;
  cutStyleLabel: string;
  sizeSpecLabel: string; // e.g., "2cm 方丁" or "2mm 细丝"
  directions: number; // 1 = single axis, 2 = slices + shreds/cross, 3 = 3-axis dicing
  directionLabels: string[]; // Explicit per-direction labels
  cutsPerDirection: number;
  tip: string;
}

export interface CookStage {
  id: string;
  title: string;
  actionHeadline: string; // Ultra-clear 1-line step directive
  instruction: string;
  idealTempMin: number; // 0-100 scale
  idealTempMax: number;
  recommendedFlame: 1 | 2 | 3; // 1=文火, 2=中火, 3=旺火
  durationSec: number; // time needed in or near ideal temp to finish stage
  requiredSeasonings: string[]; // IDs from SEASONINGS in order
  tossRequired: number; // recommended wok tosses in this stage
  sauceColor: string; // visual sauce/glaze color tint in wok
  tip: string;
}

export interface RealRecipeGuide {
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: { item: string; amount: string }[];
  steps: string[];
  chefSecret: string;
}

export interface Recipe {
  id: string;
  name: string;
  region: string;
  flavor: string;
  difficulty: 1 | 2 | 3;
  difficultyLabel: string;
  tagline: string;
  accentColor: string;
  dishVisualColor: string;
  garnishColor: string;
  prepIngredients: PrepIngredient[];
  cookStages: CookStage[];
  availableSeasonings: string[];
  realRecipe: RealRecipeGuide;
}

export const SEASONINGS: Record<string, SeasoningDef> = {
  oil: {
    id: 'oil',
    name: '食用油',
    shortName: '热油',
    category: 'liquid',
    color: '#EAB308',
    note: '润锅传热，锁住食材水分',
  },
  douban: {
    id: 'douban',
    name: '郫县豆瓣酱',
    shortName: '豆瓣酱',
    category: 'paste',
    color: '#A92418',
    note: '小火慢炒出红油，川菜灵魂底味',
  },
  aromatics: {
    id: 'aromatics',
    name: '葱姜蒜末',
    shortName: '葱姜蒜',
    category: 'aromatic',
    color: '#65A30D',
    note: '炝锅爆香，去腥增鲜',
  },
  soyLight: {
    id: 'soyLight',
    name: '生抽',
    shortName: '生抽',
    category: 'liquid',
    color: '#6B3418',
    note: '沿锅边淋入，激发出酱香鲜味',
  },
  soyDark: {
    id: 'soyDark',
    name: '老抽',
    shortName: '老抽',
    category: 'liquid',
    color: '#34170B',
    note: '上色提亮，让红烧色泽红润诱人',
  },
  wine: {
    id: 'wine',
    name: '料酒',
    shortName: '料酒',
    category: 'liquid',
    color: '#C7923E',
    note: '高温锅边烹入，随蒸汽带走肉腥',
  },
  vinegar: {
    id: 'vinegar',
    name: '陈醋',
    shortName: '米醋',
    category: 'liquid',
    color: '#4B2817',
    note: '出锅前锅边淋醋，酸香爽脆不发苦',
  },
  sugar: {
    id: 'sugar',
    name: '白糖 / 冰糖',
    shortName: '白糖',
    category: 'powder',
    color: '#F5EFE6',
    note: '炒糖色或提鲜中和酸辣',
  },
  salt: {
    id: 'salt',
    name: '食盐',
    shortName: '食盐',
    category: 'powder',
    color: '#F8FAFC',
    note: '百味之本，最后定味更不易出水',
  },
  sichuanPepper: {
    id: 'sichuanPepper',
    name: '花椒面',
    shortName: '花椒面',
    category: 'powder',
    color: '#7C4A27',
    note: '起锅点睛，赋予醇厚酥麻香气',
  },
  starch: {
    id: 'starch',
    name: '水淀粉',
    shortName: '水淀粉',
    category: 'liquid',
    color: '#EFE9DD',
    note: '少量多次勾芡，让汤汁紧裹食材',
  },
  chili: {
    id: 'chili',
    name: '干辣椒 / 泡椒',
    shortName: '干辣椒',
    category: 'aromatic',
    color: '#C8281D',
    note: '低温煸出糊辣红香，切忌大火炸黑',
  },
  egg: {
    id: 'egg',
    name: '蛋液',
    shortName: '鸡蛋液',
    category: 'liquid',
    color: '#F5B82E',
    note: '顺时针打散加少许温水，炒出蓬松嫩滑',
  },
  peanut: {
    id: 'peanut',
    name: '油酥花生',
    shortName: '花生米',
    category: 'aromatic',
    color: '#C88D48',
    note: '最后下锅翻匀，保持香脆不回软',
  },
  broth: {
    id: 'broth',
    name: '清水 / 高汤',
    shortName: '清水',
    category: 'liquid',
    color: '#D8CFC2',
    note: '烧煮入味或小火慢炖的汤底载体',
  },
};

export const RECIPES: Recipe[] = [
  {
    id: 'mapo-tofu',
    name: '麻婆豆腐',
    region: '川菜经典',
    flavor: '麻辣鲜香 · 嫩滑滚烫',
    difficulty: 1,
    difficultyLabel: '入门推荐',
    tagline: '嫩豆腐三向切 2cm 方块，豆瓣小火炒红油，勾芡紧裹每一块。',
    accentColor: '#C84B1D',
    dishVisualColor: '#B8331B',
    garnishColor: '#4D8B31',
    prepIngredients: [
      {
        id: 'tofu-block',
        name: '嫩豆腐',
        shape: 'tofu',
        baseColor: '#F5EFE2',
        innerColor: '#FFFDF7',
        crumbColor: '#F7F2E8',
        soundTexture: 'soft',
        cutStyle: 'dice',
        cutStyleLabel: '三向切块',
        sizeSpecLabel: '2cm 方块',
        directions: 3,
        directionLabels: ['第1向 · 纵切厚片', '第2向 · 横切长条', '第3向 · 切 2cm 方块'],
        cutsPerDirection: 4,
        tip: '对准金色虚线稳步落刀，切成约 2cm 见方的均匀方块，入锅不易碎。',
      },
      {
        id: 'scallion-garlic',
        name: '香葱蒜苗',
        shape: 'scallion',
        baseColor: '#4E8A38',
        innerColor: '#D9E8C6',
        crumbColor: '#7BB356',
        soundTexture: 'crisp',
        cutStyle: 'slice',
        cutStyleLabel: '单向切花',
        sizeSpecLabel: '5mm 葱花',
        directions: 1,
        directionLabels: ['单向 · 等距切 5mm 葱花'],
        cutsPerDirection: 6,
        tip: '切匀 5mm 小葱花，起锅前撒入瞬间提升麻辣鲜香。',
      },
    ],
    availableSeasonings: ['oil', 'douban', 'aromatics', 'broth', 'soyLight', 'starch', 'sichuanPepper'],
    cookStages: [
      {
        id: 'mapo-1',
        title: '小火煸炒红油',
        actionHeadline: '拧至【文火】，依次放入热油、豆瓣酱、葱姜蒜，轻颠 1 次',
        instruction: '先下热油，再放郫县豆瓣酱与葱姜蒜末，文火炒出红亮油色',
        idealTempMin: 30,
        idealTempMax: 58,
        recommendedFlame: 1,
        durationSec: 5.5,
        requiredSeasonings: ['oil', 'douban', 'aromatics'],
        tossRequired: 1,
        sauceColor: '#B82D18',
        tip: '豆瓣酱极易糊锅，保持文火慢慢炒香出红油是关键。',
      },
      {
        id: 'mapo-2',
        title: '中火烧煮入味',
        actionHeadline: '调至【中火】，倒入清水与生抽，颠勺 2 次让豆腐吸饱汤汁',
        instruction: '倒入清水与生抽，中火轻轻晃锅烧煮，让豆腐吸饱麻辣汤汁',
        idealTempMin: 48,
        idealTempMax: 74,
        recommendedFlame: 2,
        durationSec: 6.5,
        requiredSeasonings: ['broth', 'soyLight'],
        tossRequired: 2,
        sauceColor: '#C4381E',
        tip: '烧豆腐时轻推晃锅而非猛铲，既能入味又保持方正不碎。',
      },
      {
        id: 'mapo-3',
        title: '勾芡撒花椒出锅',
        actionHeadline: '保持【中火】，淋入水淀粉并撒花椒面，颠勺亮油出锅',
        instruction: '淋入水淀粉收浓汤汁，最后撒上花椒面并颠勺亮油',
        idealTempMin: 58,
        idealTempMax: 84,
        recommendedFlame: 2,
        durationSec: 5,
        requiredSeasonings: ['starch', 'sichuanPepper'],
        tossRequired: 1,
        sauceColor: '#A92416',
        tip: '家庭做麻婆豆腐可分两次勾薄芡，汤汁才能油亮挂勺。',
      },
    ],
    realRecipe: {
      servings: '2–3 人份',
      prepTime: '8 分钟',
      cookTime: '10 分钟',
      ingredients: [
        { item: '嫩豆腐（内酯或南豆腐）', amount: '1 盒（约 400g）' },
        { item: '牛肉末或猪肉末', amount: '80g' },
        { item: '郫县豆瓣酱（剁细）', amount: '1.5 勺' },
        { item: '葱姜蒜末 / 蒜苗花', amount: '各 1 勺' },
        { item: '生抽', amount: '1 勺' },
        { item: '花椒面', amount: '半勺（按喜好增减）' },
        { item: '水淀粉（淀粉 1 : 清水 3）', amount: '3 勺' },
      ],
      steps: [
        '嫩豆腐切 2 厘米见方小块，冷水加少许盐下锅，水微沸焯烫 1 分钟捞出，去豆腥且不易碎。',
        '热锅凉油煸酥肉末，转小火下剁细的郫县豆瓣酱、葱姜蒜末，慢慢炒出红亮底油。',
        '冲入一碗热清水，调入生抽与少许白糖提鲜，轻轻滑入豆腐块，中火咕嘟 4 分钟入味。',
        '分两次淋入水淀粉，用勺背轻推晃锅至汤汁浓稠包裹豆腐，撒花椒面与蒜苗花出锅。',
      ],
      chefSecret: '豆腐下锅前用微咸开水焯烫 1 分钟，既去除涩味又让豆腐内部紧实，翻炒不易烂。',
    },
  },
  {
    id: 'tomato-egg',
    name: '番茄炒蛋',
    region: '国民家常',
    flavor: '酸甜多汁 · 嫩滑下饭',
    difficulty: 1,
    difficultyLabel: '新手必学',
    tagline: '番茄两向切滚刀块，旺火滑嫩蛋，中火炒出沙汁融为一体。',
    accentColor: '#D44727',
    dishVisualColor: '#DA5629',
    garnishColor: '#569A3A',
    prepIngredients: [
      {
        id: 'fresh-tomato',
        name: '熟透番茄',
        shape: 'tomato',
        baseColor: '#D63826',
        innerColor: '#E95B42',
        crumbColor: '#EA5D44',
        soundTexture: 'soft',
        cutStyle: 'wedge',
        cutStyleLabel: '两向滚刀块',
        sizeSpecLabel: '3cm 滚刀块',
        directions: 2,
        directionLabels: ['第1向 · 纵切厚瓣', '第2向 · 斜切 3cm 滚刀块'],
        cutsPerDirection: 4,
        tip: '选熟透的沙瓤番茄，顺切线切成 3cm 左右大块，更容易一半出沙一半留果肉。',
      },
      {
        id: 'green-scallion',
        name: '小香葱',
        shape: 'scallion',
        baseColor: '#4B8B36',
        innerColor: '#D8EAC5',
        crumbColor: '#6EB051',
        soundTexture: 'crisp',
        cutStyle: 'slice',
        cutStyleLabel: '单向切花',
        sizeSpecLabel: '5mm 葱花',
        directions: 1,
        directionLabels: ['单向 · 切 5mm 香葱花'],
        cutsPerDirection: 5,
        tip: '葱白爆香、葱绿点缀，一葱两用香气更立体。',
      },
    ],
    availableSeasonings: ['oil', 'egg', 'aromatics', 'salt', 'sugar'],
    cookStages: [
      {
        id: 'te-1',
        title: '旺火快滑嫩蛋',
        actionHeadline: '开至【旺火】，倒热油与鸡蛋液，快速颠勺 2 次滑嫩定型',
        instruction: '热锅倒油烧至六成热，倒入蛋液并旺火快炒颠勺，趁嫩定型',
        idealTempMin: 60,
        idealTempMax: 86,
        recommendedFlame: 3,
        durationSec: 5,
        requiredSeasonings: ['oil', 'egg'],
        tossRequired: 2,
        sauceColor: '#EAB32B',
        tip: '油热下蛋液能瞬间蓬松，蛋液刚凝固八成即可盛出或推至锅边。',
      },
      {
        id: 'te-2',
        title: '中火炒出番茄沙汁',
        actionHeadline: '收至【中火】，加葱姜蒜与食盐，翻炒颠勺 2 次逼出番茄浓汁',
        instruction: '放入葱花爆香，加少许食盐加速番茄出汁，中火翻炒起沙',
        idealTempMin: 46,
        idealTempMax: 72,
        recommendedFlame: 2,
        durationSec: 6,
        requiredSeasonings: ['aromatics', 'salt'],
        tossRequired: 2,
        sauceColor: '#D94326',
        tip: '炒番茄时先加一点盐能利用渗透压快速逼出酸甜浓汁。',
      },
      {
        id: 'te-3',
        title: '蛋汁交融提鲜',
        actionHeadline: '保持【中火】，撒少许白糖提鲜，颠匀裹汁立刻出锅',
        instruction: '加少许白糖中和酸味，快速颠勺让嫩蛋吸满浓稠番茄汁',
        idealTempMin: 52,
        idealTempMax: 78,
        recommendedFlame: 2,
        durationSec: 4.5,
        requiredSeasonings: ['sugar'],
        tossRequired: 1,
        sauceColor: '#DC5326',
        tip: '半勺白糖是灵魂，无需放味精也能酸甜浓郁、汤汁拌饭一绝。',
      },
    ],
    realRecipe: {
      servings: '2 人份',
      prepTime: '5 分钟',
      cookTime: '6 分钟',
      ingredients: [
        { item: '自然成熟大番茄', amount: '2 个（约 350g）' },
        { item: '土鸡蛋', amount: '3–4 枚' },
        { item: '小香葱', amount: '2 根' },
        { item: '食盐', amount: '约 4g（分两次放）' },
        { item: '白砂糖', amount: '1 小勺（约 5g）' },
        { item: '食用油', amount: '2.5 勺' },
      ],
      steps: [
        '鸡蛋打入碗中，加少许盐和 1 勺温水充分搅打均匀；番茄去蒂切滚刀块。',
        '锅烧热倒宽油至微冒青烟，倒入蛋液，用铲背快速推散成大片蓬松嫩蛋后盛出。',
        '底油爆香葱白，倒入番茄块并撒少许盐，中火按压翻炒约 2 分钟至炒出浓稠红沙汁。',
        '倒回滑好的鸡蛋，加 1 小勺白糖调匀，大火翻炒 20 秒让鸡蛋裹汁，撒葱绿出锅。',
      ],
      chefSecret: '蛋液里加一勺温水或几滴料酒，旺火热油下锅，炒出的鸡蛋比饭店还蓬松嫩滑。',
    },
  },
  {
    id: 'kung-pao-chicken',
    name: '宫保鸡丁',
    region: '川鲁名菜',
    flavor: '糊辣荔枝口 · 滑嫩香脆',
    difficulty: 2,
    difficultyLabel: '进阶掌勺',
    tagline: '鸡胸与黄瓜两向切 1.5cm 匀丁，爆香干辣椒，猛火烹出经典荔枝味。',
    accentColor: '#B83C1A',
    dishVisualColor: '#9E381B',
    garnishColor: '#C88D48',
    prepIngredients: [
      {
        id: 'chicken-breast',
        name: '鸡胸肉',
        shape: 'chicken',
        baseColor: '#EBC2AE',
        innerColor: '#F6D8C9',
        crumbColor: '#EFC9B8',
        soundTexture: 'meat',
        cutStyle: 'dice',
        cutStyleLabel: '两向切丁',
        sizeSpecLabel: '1.5cm 匀丁',
        directions: 2,
        directionLabels: ['第1向 · 纵切长条', '第2向 · 横切 1.5cm 鸡丁'],
        cutsPerDirection: 5,
        tip: '沿切线切出 1.5cm 见方均匀鸡丁，受热一致、滑油后弹嫩不柴。',
      },
      {
        id: 'crisp-cucumber',
        name: '脆嫩黄瓜',
        shape: 'cucumber',
        baseColor: '#3E7A34',
        innerColor: '#CBE3A8',
        crumbColor: '#98C76D',
        soundTexture: 'crisp',
        cutStyle: 'dice',
        cutStyleLabel: '两向切丁',
        sizeSpecLabel: '1.5cm 匀丁',
        directions: 2,
        directionLabels: ['第1向 · 剖长条', '第2向 · 切 1.5cm 黄瓜丁'],
        cutsPerDirection: 5,
        tip: '黄瓜丁与鸡丁保持相同尺寸，翻炒后口感清脆、卖相利落。',
      },
    ],
    availableSeasonings: ['oil', 'chili', 'aromatics', 'wine', 'soyLight', 'vinegar', 'sugar', 'starch', 'peanut'],
    cookStages: [
      {
        id: 'kp-1',
        title: '煸香干辣椒与鸡丁',
        actionHeadline: '拧至【中火】，下热油、干辣椒、葱姜蒜并烹料酒，颠勺 2 次',
        instruction: '热油下干辣椒与葱姜蒜，中火煸出糊辣棕红香气，烹料酒去腥',
        idealTempMin: 44,
        idealTempMax: 70,
        recommendedFlame: 2,
        durationSec: 5.5,
        requiredSeasonings: ['oil', 'chili', 'aromatics', 'wine'],
        tossRequired: 2,
        sauceColor: '#A9411D',
        tip: '干辣椒要炒至棕红发亮而非焦黑，这就是宫保菜独有的「糊辣香」。',
      },
      {
        id: 'kp-2',
        title: '旺火烹入荔枝碗汁',
        actionHeadline: '转【旺火】，依次烹入生抽、白糖、米醋，猛火颠勺 2 次激香',
        instruction: '调高火候，依次烹入生抽、白糖与米醋，猛火颠勺激出小酸甜香',
        idealTempMin: 64,
        idealTempMax: 90,
        recommendedFlame: 3,
        durationSec: 6,
        requiredSeasonings: ['soyLight', 'sugar', 'vinegar'],
        tossRequired: 2,
        sauceColor: '#8B2F16',
        tip: '糖略大于醋、咸鲜托底，猛火激香后酸甜回味如荔枝般清爽。',
      },
      {
        id: 'kp-3',
        title: '收汁裹酱拌花生',
        actionHeadline: '保持【旺火】，淋水淀粉后下花生米，快颠 1 次立刻出锅',
        instruction: '淋水淀粉紧汁亮油，最后倒入酥脆花生米快颠出锅',
        idealTempMin: 56,
        idealTempMax: 84,
        recommendedFlame: 3,
        durationSec: 4.5,
        requiredSeasonings: ['starch', 'peanut'],
        tossRequired: 1,
        sauceColor: '#923418',
        tip: '花生米一定要在关火前最后十秒下锅翻匀，入口才嘎嘣脆。',
      },
    ],
    realRecipe: {
      servings: '2–3 人份',
      prepTime: '12 分钟',
      cookTime: '6 分钟',
      ingredients: [
        { item: '鸡胸肉或去骨鸡腿肉', amount: '300g' },
        { item: '黄瓜 / 胡萝卜丁', amount: '100g' },
        { item: '去皮油酥花生米', amount: '60g' },
        { item: '干辣椒段与花椒', amount: '10g / 1小撮' },
        { item: '大葱白（切马蹄段）', amount: '1 根' },
        { item: '宫保碗汁（生抽2勺、米醋1.5勺、白糖2勺、淀粉1勺、水2勺）', amount: '提前调匀' },
      ],
      steps: [
        '鸡丁用少许盐、料酒、蛋清与淀粉抓匀上浆，封一勺油静置 10 分钟；提前调好宫保碗汁。',
        '热锅凉油四成热滑散鸡丁至刚变白立刻盛出，锁住嫩滑口感。',
        '留底油小火煸香花椒与干辣椒至棕红，放入大葱段、姜蒜片爆香。',
        '转旺火倒回鸡丁与配菜，沿锅边烹入宫保碗汁快速颠炒至浓亮挂汁，下花生米翻匀即成。',
      ],
      chefSecret: '宫保鸡丁讲究「快」，提前把生抽、醋、糖、淀粉兑成一碗汁，旺火一气呵成绝不手忙脚乱。',
    },
  },
  {
    id: 'sour-spicy-potato',
    name: '酸辣土豆丝',
    region: '国民快炒',
    flavor: '脆爽酸辣 · 锅气十足',
    difficulty: 2,
    difficultyLabel: '刀工考验',
    tagline: '土豆两向先片后切 2mm 细丝，猛火急炒断生，出锅前锅边淋醋。',
    accentColor: '#C57B20',
    dishVisualColor: '#E3B956',
    garnishColor: '#C82D1F',
    prepIngredients: [
      {
        id: 'fresh-potato',
        name: '黄心土豆',
        shape: 'potato',
        baseColor: '#C99B58',
        innerColor: '#F3DF9E',
        crumbColor: '#F5E5AF',
        soundTexture: 'crisp',
        cutStyle: 'shred',
        cutStyleLabel: '两向切丝',
        sizeSpecLabel: '2mm 细丝',
        directions: 2,
        directionLabels: ['第1向 · 切 2mm 均匀薄片', '第2向 · 码齐切 2mm 细丝'],
        cutsPerDirection: 8,
        tip: '紧盯密集的细丝切线节奏下刀，粗细一致炒出来才根根脆响！',
      },
      {
        id: 'chili-pepper',
        name: '青红辣椒',
        shape: 'pepper',
        baseColor: '#3C8C3A',
        innerColor: '#7AC462',
        crumbColor: '#5DA84E',
        soundTexture: 'crisp',
        cutStyle: 'shred',
        cutStyleLabel: '单向切丝',
        sizeSpecLabel: '2mm 椒丝',
        directions: 1,
        directionLabels: ['单向 · 斜切 2mm 细椒丝'],
        cutsPerDirection: 6,
        tip: '去籽斜切细丝，与土豆丝粗细呼应、清辣增色。',
      },
    ],
    availableSeasonings: ['oil', 'chili', 'aromatics', 'vinegar', 'salt', 'sugar'],
    cookStages: [
      {
        id: 'sp-1',
        title: '炝锅爆出蒜辣香',
        actionHeadline: '拧至【中火】，加食用油、干辣椒、葱姜蒜炝出香味',
        instruction: '热油下干辣椒与葱蒜，迅速煸香但不焦糊',
        idealTempMin: 50,
        idealTempMax: 76,
        recommendedFlame: 2,
        durationSec: 4.5,
        requiredSeasonings: ['oil', 'chili', 'aromatics'],
        tossRequired: 1,
        sauceColor: '#D6A63E',
        tip: '蒜片与干辣椒微卷发香时立刻下土豆丝，激发出地道农家炝锅香。',
      },
      {
        id: 'sp-2',
        title: '猛火急炒锁脆爽',
        actionHeadline: '拉满【旺火】，加食盐与少许白糖，快速颠勺 3 次脆爽断生',
        instruction: '开至旺火快速颠勺翻炒，加食盐与一点白糖提鲜断生',
        idealTempMin: 68,
        idealTempMax: 94,
        recommendedFlame: 3,
        durationSec: 5.5,
        requiredSeasonings: ['salt', 'sugar'],
        tossRequired: 3,
        sauceColor: '#E5BE5C',
        tip: '土豆丝最怕小火慢焖变绵软，必须全程旺火快颠、迅速断生。',
      },
      {
        id: 'sp-3',
        title: '锅边烹醋激发锅气',
        actionHeadline: '保持【旺火】，沿锅边淋入米醋，快颠 2 次出锅',
        instruction: '沿滚烫锅边淋入米醋，猛火颠匀立刻出锅',
        idealTempMin: 66,
        idealTempMax: 92,
        recommendedFlame: 3,
        durationSec: 4,
        requiredSeasonings: ['vinegar'],
        tossRequired: 2,
        sauceColor: '#D4A141',
        tip: '醋要沿热锅壁淋下而非直接浇在菜心上，醋香挥发后柔和爽口。',
      },
    ],
    realRecipe: {
      servings: '2 人份',
      prepTime: '10 分钟',
      cookTime: '3 分钟',
      ingredients: [
        { item: '脆爽型黄心大土豆', amount: '2 个（约 400g）' },
        { item: '青红尖椒丝', amount: '半根' },
        { item: '干辣椒段与大蒜片', amount: '适量' },
        { item: '白醋或米醋', amount: '1.5 勺' },
        { item: '食盐 / 白糖', amount: '3g / 少许' },
      ],
      steps: [
        '土豆去皮先切均匀薄片，码齐后切成 2 毫米细丝，用清水淘洗 2–3 遍至水清澈并沥干。',
        '净锅烧热倒油，下干辣椒段与蒜片炝出香味。',
        '转最大旺火倒入沥干的土豆丝与青红椒丝，快速翻炒约 40 秒至微透亮。',
        '沿锅边烹入米醋，调入食盐和少许白糖提鲜，旺火快颠 15 秒立刻装盘。',
      ],
      chefSecret: '切好的土豆丝一定要洗净表面游离淀粉，并彻底沥干水分，下旺火才能炒出根根脆响的饭店水准。',
    },
  },
  {
    id: 'braised-pork',
    name: '红烧肉',
    region: '传统硬菜',
    flavor: '肥而不腻 · 入口即化',
    difficulty: 3,
    difficultyLabel: '火候大师',
    tagline: '五花肉两向切 3cm 麻将块，小火炒糖色，慢炖后大火收出琥珀亮汁。',
    accentColor: '#8E2B19',
    dishVisualColor: '#7C2814',
    garnishColor: '#5B8F38',
    prepIngredients: [
      {
        id: 'pork-belly-slab',
        name: '精品五花肉',
        shape: 'pork-belly',
        baseColor: '#C9665B',
        innerColor: '#F3DFD7',
        crumbColor: '#E5B2A8',
        soundTexture: 'meat',
        cutStyle: 'cube',
        cutStyleLabel: '两向切大块',
        sizeSpecLabel: '3cm 麻将块',
        directions: 2,
        directionLabels: ['第1向 · 纵切 3cm 宽条', '第2向 · 横切 3cm 麻将块'],
        cutsPerDirection: 4,
        tip: '五花肉炖煮后会略微缩水，按宽切线切成 3cm 见方大块最为适口。',
      },
      {
        id: 'ginger-scallion',
        name: '姜片葱段',
        shape: 'scallion',
        baseColor: '#5B923C',
        innerColor: '#E3DFB6',
        crumbColor: '#8FB55C',
        soundTexture: 'firm',
        cutStyle: 'slice',
        cutStyleLabel: '单向切段',
        sizeSpecLabel: '3cm 葱段',
        directions: 1,
        directionLabels: ['单向 · 切 3cm 炖肉葱段'],
        cutsPerDirection: 4,
        tip: '炖肉用大段葱姜，香气柔和持久且方便出锅前挑出。',
      },
    ],
    availableSeasonings: ['oil', 'sugar', 'wine', 'aromatics', 'soyLight', 'soyDark', 'broth', 'salt'],
    cookStages: [
      {
        id: 'bp-1',
        title: '文火慢炒琥珀糖色',
        actionHeadline: '拧至【文火】，放热油与白糖/冰糖，耐心炒出琥珀枣红糖色',
        instruction: '少许底油下冰糖，保持文火耐心炒至枣红微冒泡，切忌大火发苦',
        idealTempMin: 28,
        idealTempMax: 52,
        recommendedFlame: 1,
        durationSec: 5.5,
        requiredSeasonings: ['oil', 'sugar'],
        tossRequired: 1,
        sauceColor: '#9C4212',
        tip: '炒糖色宁慢勿急，呈琥珀枣红色即刻下肉裹色，温度过高会迅速焦苦。',
      },
      {
        id: 'bp-2',
        title: '中火煸香上色去腥',
        actionHeadline: '调至【中火】，加葱姜蒜、料酒、生抽、老抽，颠勺 2 次上色',
        instruction: '加入葱姜、料酒、生抽与老抽，中火翻炒让每块五花肉均匀裹上红润色泽',
        idealTempMin: 48,
        idealTempMax: 74,
        recommendedFlame: 2,
        durationSec: 6,
        requiredSeasonings: ['aromatics', 'wine', 'soyLight', 'soyDark'],
        tossRequired: 2,
        sauceColor: '#7A2512',
        tip: '先煸出多余油脂再加酱油，红烧肉才会油亮醇香、肥而不腻。',
      },
      {
        id: 'bp-3',
        title: '慢炖入味与大火收汁',
        actionHeadline: '加清水与食盐，转【旺火】颠勺 2 次收出油亮浓汁',
        instruction: '注入热水炖透，调入食盐后转旺火不断颠勺收浓至油亮挂汁',
        idealTempMin: 64,
        idealTempMax: 90,
        recommendedFlame: 3,
        durationSec: 6,
        requiredSeasonings: ['broth', 'salt'],
        tossRequired: 2,
        sauceColor: '#691D0F',
        tip: '炖肉一定要加热水！冷水会让肉质遇冷收缩变柴。最后大火收汁是色泽诱人的秘诀。',
      },
    ],
    realRecipe: {
      servings: '3–4 人份',
      prepTime: '15 分钟',
      cookTime: '55 分钟',
      ingredients: [
        { item: '带皮三层五花肉', amount: '600g' },
        { item: '老冰糖', amount: '25g' },
        { item: '花雕或黄酒', amount: '3 勺' },
        { item: '生抽 / 老抽', amount: '2 勺 / 1 勺' },
        { item: '葱结、姜片、八角 1 颗、桂皮 1 小块', amount: '适量' },
        { item: '沸水', amount: '没过肉面' },
      ],
      steps: [
        '五花肉切 3 厘米见方块，冷水下锅加葱姜料酒焯去血沫，温水洗净沥干。',
        '热锅少油小火煸炒五花肉至四面微黄、逼出多余猪油后盛出。',
        '留少许底油放入冰糖，全程最小火炒至化开起密集小泡呈琥珀枣红色，倒入肉块迅速翻匀裹色。',
        '烹入黄酒、生抽、老抽与香料，冲入足量沸水盖盖小火慢炖 45 分钟，最后加盐转大火收浓汤汁。',
      ],
      chefSecret: '炖煮中途务必加沸水而非凉水，盐在最后 10 分钟放入，肉皮软糯 Q 弹、瘦肉酥烂不塞牙。',
    },
  },
  {
    id: 'yuxiang-pork',
    name: '鱼香肉丝',
    region: '川味名肴',
    flavor: '咸甜酸辣 · 鱼香复合',
    difficulty: 3,
    difficultyLabel: '厨神进阶',
    tagline: '里脊与胡萝卜两向切 3mm 细丝，泡椒爆红油，鱼香碗汁一气呵成。',
    accentColor: '#C24220',
    dishVisualColor: '#A8381E',
    garnishColor: '#4F8F37',
    prepIngredients: [
      {
        id: 'pork-loin-cut',
        name: '猪里脊肉',
        shape: 'pork-loin',
        baseColor: '#DA8A84',
        innerColor: '#EAA8A2',
        crumbColor: '#E5A19B',
        soundTexture: 'meat',
        cutStyle: 'shred',
        cutStyleLabel: '两向切丝',
        sizeSpecLabel: '3mm 肉丝',
        directions: 2,
        directionLabels: ['第1向 · 切 3mm 薄肉片', '第2向 · 顺纹切 3mm 细丝'],
        cutsPerDirection: 6,
        tip: '顺着肉纹切成火柴棍粗细的 3mm 细丝，滑炒时不易碎断且滑嫩入味。',
      },
      {
        id: 'carrot-shred',
        name: '胡萝卜丝',
        shape: 'carrot',
        baseColor: '#DF6D22',
        innerColor: '#F29346',
        crumbColor: '#EB8336',
        soundTexture: 'firm',
        cutStyle: 'shred',
        cutStyleLabel: '两向切丝',
        sizeSpecLabel: '3mm 细丝',
        directions: 2,
        directionLabels: ['第1向 · 斜切薄片', '第2向 · 切 3mm 细丝'],
        cutsPerDirection: 6,
        tip: '胡萝卜切与肉丝等粗的 3mm 细丝，同锅成熟度一致、清甜爽脆。',
      },
    ],
    availableSeasonings: ['oil', 'chili', 'douban', 'aromatics', 'soyLight', 'vinegar', 'sugar', 'starch'],
    cookStages: [
      {
        id: 'yx-1',
        title: '爆香泡椒与豆瓣',
        actionHeadline: '拧至【中火】，下热油、干辣椒、豆瓣酱与葱姜蒜，煸出红油',
        instruction: '热油下泡椒、豆瓣酱与葱姜蒜，中火煸炒出亮丽红油与蒜香',
        idealTempMin: 42,
        idealTempMax: 68,
        recommendedFlame: 2,
        durationSec: 5.5,
        requiredSeasonings: ['oil', 'chili', 'douban', 'aromatics'],
        tossRequired: 1,
        sauceColor: '#B53319',
        tip: '「鱼香不见鱼」，靠泡椒、姜蒜、葱与糖醋比例模拟出川渝糟鱼的复合鲜香。',
      },
      {
        id: 'yx-2',
        title: '烹入经典鱼香汁',
        actionHeadline: '转【旺火】，依次烹入生抽、白糖、米醋，颠勺 2 次裹匀鱼香味',
        instruction: '转旺火依次调入生抽、白糖与陈醋，快速颠勺让肉丝与配丝充分裹味',
        idealTempMin: 62,
        idealTempMax: 88,
        recommendedFlame: 3,
        durationSec: 6,
        requiredSeasonings: ['soyLight', 'sugar', 'vinegar'],
        tossRequired: 2,
        sauceColor: '#9C2F18',
        tip: '记住黄金鱼香口诀「1 勺生抽、2 勺糖、2 勺醋」，酸甜微辣平衡得恰到好处。',
      },
      {
        id: 'yx-3',
        title: '亮油勾芡急火起锅',
        actionHeadline: '保持【旺火】，淋入水淀粉并快颠 2 次，亮油收汁出锅',
        instruction: '淋入水淀粉快速翻匀，让每根肉丝红亮油润、不见明汁',
        idealTempMin: 60,
        idealTempMax: 86,
        recommendedFlame: 3,
        durationSec: 4.5,
        requiredSeasonings: ['starch'],
        tossRequired: 2,
        sauceColor: '#A1311A',
        tip: '勾芡后快速大颠两下，做到「见油不见汁」，整盘菜清爽利落。',
      },
    ],
    realRecipe: {
      servings: '2–3 人份',
      prepTime: '15 分钟',
      cookTime: '5 分钟',
      ingredients: [
        { item: '猪通脊 / 里脊肉', amount: '250g' },
        { item: '胡萝卜丝、水发木耳丝、青椒丝', amount: '各 50g' },
        { item: '剁碎泡椒 / 郫县豆瓣酱', amount: '1 勺 / 半勺' },
        { item: '姜末与蒜末（蒜量略多）', amount: '各 1 大勺' },
        { item: '鱼香碗汁（生抽1勺、陈醋2勺、白糖2勺、清水3勺、淀粉1勺）', amount: '提前调匀' },
      ],
      steps: [
        '里脊肉切火柴棍粗细丝，用盐、料酒、蛋清与玉米淀粉抓匀，淋少许油封住水分。',
        '热锅凉油四成热滑散肉丝至九成熟捞出备用。',
        '底油中小火炒香泡椒碎、豆瓣酱、大量蒜末与姜末，炒出红亮鱼香底油。',
        '转旺火下木耳、胡萝卜、青椒丝翻炒断生，倒回肉丝并烹入鱼香碗汁，快炒 15 秒亮油起锅。',
      ],
      chefSecret: '蒜末一定要比姜末多一倍，且在最后起锅前留一小撮葱花激香，鱼香味层次瞬间拉满。',
    },
  },
];

export function getRecipeById(id: string): Recipe {
  return RECIPES.find((r) => r.id === id) ?? RECIPES[0];
}
