export interface PairingPartner {
  name: string;
  effect: string;
  classicDish: string;
}

export interface IngredientPairingEntry {
  id: string;
  name: string;
  category: '肉禽蛋' | '豆制品与蔬果' | '根茎菌菇';
  flavorProfile: string;
  prepTip: string;
  goldenPairings: PairingPartner[];
  cautions: string;
}

export interface TechniqueEntry {
  id: string;
  category: '刀工心法' | '油温与火候' | '经典味型比例';
  title: string;
  summary: string;
  keyMetrics: string;
  details: string[];
  proTip: string;
}

export const INGREDIENT_PAIRINGS: IngredientPairingEntry[] = [
  {
    id: 'ing-tofu',
    name: '嫩豆腐',
    category: '豆制品与蔬果',
    flavorProfile: '清淡豆香 · 极易吸味',
    prepTip: '切块后用加了少许盐的微沸水焯烫 1 分钟，能去豆腥并让表面紧实不易碎。',
    goldenPairings: [
      { name: '郫县豆瓣酱 + 牛肉末', effect: '重油浓香渗透清淡豆芯，麻辣滑嫩', classicDish: '麻婆豆腐' },
      { name: '香葱 + 皮蛋 / 鲫鱼', effect: '鲜上加鲜，汤色乳白浓郁', classicDish: '鲫鱼豆腐汤' },
      { name: '虾仁 + 青豆', effect: '鲜甜清爽，突出嫩滑质感', classicDish: '蟹黄/虾仁豆腐' },
    ],
    cautions: '炒烧时忌用锅铲反复翻搅，应以手腕晃锅或勺背轻推，否则极易碎成豆腐渣。',
  },
  {
    id: 'ing-pork-belly',
    name: '猪五花肉',
    category: '肉禽蛋',
    flavorProfile: '脂香丰腴 · 肥瘦相间',
    prepTip: '冷水加葱姜料酒焯水去腥，炒前先干煸出多余油脂再调味，成菜才肥而不腻。',
    goldenPairings: [
      { name: '冰糖 + 黄酒 + 八角', effect: '焦糖琥珀色提香解腻，酥烂醇厚', classicDish: '红烧肉' },
      { name: '梅干菜 / 酸菜', effect: '干菜吸油、五花增润，相得益彰', classicDish: '梅菜扣肉' },
      { name: '蒜苗 + 豆豉甜面酱', effect: '爆炒逼油，蒜香解腻下饭', classicDish: '回锅肉' },
    ],
    cautions: '炖煮中途切忌加冷水，肉质遇冷骤缩会发柴塞牙，务必一次性加足沸水。',
  },
  {
    id: 'ing-chicken',
    name: '鸡胸 / 鸡腿肉',
    category: '肉禽蛋',
    flavorProfile: '纤维细腻 · 鲜嫩清香',
    prepTip: '逆纹切丁或片，用盐、料酒、蛋清和少许玉米淀粉抓匀上浆，四成热油滑散最嫩。',
    goldenPairings: [
      { name: '干辣椒 + 酥花生 + 大葱', effect: '糊辣酸甜与脆嫩口感双重碰撞', classicDish: '宫保鸡丁' },
      { name: '香菇 + 土豆 + 姜片', effect: '菌菇鲜味与鸡脂融合，汤汁浓稠', classicDish: '黄焖鸡 / 小鸡炖蘑菇' },
      { name: '青椒 + 紫苏 / 仔姜', effect: '清新辛香去腥提味，脆辣爽口', classicDish: '辣子鸡 / 仔姜鸡' },
    ],
    cautions: '鸡胸肉脂肪少，久炒极易发柴；滑油变白即应盛出，最后回锅猛火快速裹汁即可。',
  },
  {
    id: 'ing-tomato',
    name: '熟透番茄',
    category: '豆制品与蔬果',
    flavorProfile: '酸甜多汁 · 天然谷氨酸提鲜',
    prepTip: '顶部划十字开水烫 15 秒即可轻松去皮；一半切小丁炒沙、一半切大块留口感。',
    goldenPairings: [
      { name: '土鸡蛋 + 小香葱', effect: '蛋香吸饱酸甜番茄沙汁，老少咸宜', classicDish: '番茄炒蛋' },
      { name: '牛腩 + 洋葱', effect: '果酸软化牛肉纤维，汤汁红亮开胃', classicDish: '番茄炖牛腩' },
      { name: '金针菇 + 肥牛', effect: '酸甜解腻，清爽下饭', classicDish: '番茄肥牛锅' },
    ],
    cautions: '炒番茄时先加少许盐帮助出汁，最后放半勺白糖平衡尖酸，切忌一开始就加大量生水。',
  },
  {
    id: 'ing-potato',
    name: '黄心土豆',
    category: '根茎菌菇',
    flavorProfile: '清甜淀粉 · 脆绵皆宜',
    prepTip: '炒脆丝选脆心黄土豆并淘洗两遍去淀粉；炖粉糯菜选沙面土豆并略煎焦边。',
    goldenPairings: [
      { name: '米醋 + 干辣椒 + 蒜片', effect: '高酸脆爽，旺火激发出农家锅气', classicDish: '酸辣土豆丝' },
      { name: '茄子 + 青椒', effect: '油润焦香，经典东北素菜三巨头', classicDish: '地三鲜' },
      { name: '牛腩 / 排骨', effect: '土豆吸饱肉汁，绵密香浓', classicDish: '土豆烧牛腩' },
    ],
    cautions: '炒土豆丝若未洗净表面淀粉或水分未沥干，下锅极易粘锅发坨，失去脆爽口感。',
  },
  {
    id: 'ing-pork-loin',
    name: '猪里脊肉',
    category: '肉禽蛋',
    flavorProfile: '纯瘦鲜嫩 · 适配滑炒糖醋',
    prepTip: '切丝顺纹不断，切片逆纹更嫩；上浆时少量多次打入清水或葱姜水，炒出多汁嫩感。',
    goldenPairings: [
      { name: '木耳 + 胡萝卜 + 泡椒鱼香汁', effect: '嫩滑配脆爽，咸甜酸辣层次分明', classicDish: '鱼香肉丝' },
      { name: '京葱丝 + 甜面酱', effect: '酱香浓郁，卷饼鲜香解腻', classicDish: '京酱肉丝' },
      { name: '番茄酱 / 白醋白糖', effect: '外酥里嫩，酸甜开胃', classicDish: '糖醋里脊 / 锅包肉' },
    ],
    cautions: '滑炒里脊丝切忌油温过高或翻炒超过 1 分钟，否则水分迅速流失导致干硬。',
  },
  {
    id: 'ing-egg',
    name: '鸡蛋',
    category: '肉禽蛋',
    flavorProfile: '醇厚蛋香 · 蓬松吸味',
    prepTip: '打蛋时顺同一方向搅匀，加 1 勺温水或几滴料酒，旺火热油下锅最容易蓬松起泡。',
    goldenPairings: [
      { name: '熟番茄 + 香葱', effect: '酸甜浓汁裹满嫩蛋，经典国民味道', classicDish: '番茄炒蛋' },
      { name: '韭菜 / 苦瓜', effect: '中和野菜辛苦味，鲜香嫩滑', classicDish: '韭菜炒蛋 / 苦瓜煎蛋' },
      { name: '木耳 + 黄瓜 + 肉片', effect: '色彩明快，清淡鲜美', classicDish: '木须肉' },
    ],
    cautions: '炒蛋用油不可太省，锅温不够低油下锅容易粘底且口感发死。',
  },
  {
    id: 'ing-beef',
    name: '牛里脊 / 牛腩',
    category: '肉禽蛋',
    flavorProfile: '肉香浓厚 · 纤维粗长',
    prepTip: '炒牛肉必须「横切牛羊」（垂直肌纤维切片），用葱姜水、生抽、淀粉抓匀并封油。',
    goldenPairings: [
      { name: '青红椒 / 杭椒 + 黑胡椒', effect: '大火快炒锁汁，辛香提肉味', classicDish: '小炒黄牛肉' },
      { name: '白萝卜 / 番茄', effect: '清甜解腻，越炖汤头越醇厚', classicDish: '萝卜炖牛腩' },
      { name: '芹菜 / 香菜', effect: '清香压膻，爽脆可口', classicDish: '野山椒炒牛肉' },
    ],
    cautions: '嫩炒牛肉切忌提前放太多盐腌制过久，以免盐分析出肉汁导致嚼不动。',
  },
];

export const CULINARY_TECHNIQUES: TechniqueEntry[] = [
  {
    id: 'tech-knife-dice',
    category: '刀工心法',
    title: '三向切丁与均匀方块法',
    summary: '适用于嫩豆腐、鸡胸肉、黄瓜丁与胡萝卜丁等需要受热一致的菜品。',
    keyMetrics: '标准丁：1.2–1.5cm · 豆腐块：2cm · 麻将块：3cm',
    details: [
      '扶料手呈「猫爪状」，指尖自然内扣，以指关节轻贴刀背导向，既稳又安全。',
      '先水平片厚片，再竖切均匀长条，最后旋转 90° 横向切丁（豆腐类则直接三向落刀）。',
      '同锅配菜（如宫保鸡丁中的鸡丁、黄瓜丁、胡萝卜丁）大小保持一致，熟度才会整齐。',
    ],
    proTip: '切极嫩的豆腐时可先在刀面沾一点清水，能有效防止豆腐粘刀破边。',
  },
  {
    id: 'tech-knife-shred',
    category: '刀工心法',
    title: '先片后丝：脆爽细丝切法',
    summary: '酸辣土豆丝、鱼香肉丝的核心基本功，决定口感是否根根分明。',
    keyMetrics: '细丝宽度：2–3mm · 长度：5–6cm',
    details: [
      '切圆滚滚的土豆或胡萝卜时，先切去底部一薄片让它稳稳贴在砧板上，杜绝打滑。',
      '切出均匀薄片后，将薄片像阶梯一样错落叠放铺平，再垂直稳步推切细丝。',
      '肉丝顺纹切不易炒断，蔬菜丝切完立即过冷水可保持挺拔脆感。',
    ],
    proTip: '下刀时前推下压而非生硬直剁，刀口更平整，蔬菜不易流失汁水。',
  },
  {
    id: 'tech-oil-temp',
    category: '油温与火候',
    title: '中餐油温三至七成热肉眼辨别法',
    summary: '不用温度计，看油面波纹与筷子气泡即可精准拿捏下锅时机。',
    keyMetrics: '三四成热 100–120°C · 五六成热 150–180°C · 七成热 200°C+',
    details: [
      '三四成热（文火）：油面平静无烟，插筷子几乎无泡——适合炒糖色、煸干辣椒、滑嫩肉丝。',
      '五六成热（中火）：油面微动、四周向中心翻滚，放葱姜立刻起密集小泡——适合爆香炝锅与绝大多数家常小炒。',
      '七成热（旺火）：油面开始泛起淡淡青烟——适合旺火滑嫩蛋、猛火爆炒土豆丝与青菜锁脆。',
    ],
    proTip: '「热锅凉油」不粘锅秘诀：先干锅烧热，再倒入凉油润遍锅壁，随后立刻下肉滑炒。',
  },
  {
    id: 'tech-flame-control',
    category: '油温与火候',
    title: '文火、中火、旺火与颠勺配合',
    summary: '中餐讲究「火候不到不香，火候一过即糊」，懂得切换才是厨神分水岭。',
    keyMetrics: '爆香用文/中火 · 脆炒用旺火 · 慢炖用文火',
    details: [
      '豆瓣酱、甜面酱、冰糖含糖或发酵物，极易碳化发苦，务必调至文火耐心炒香。',
      '脆嫩蔬菜（土豆丝、青菜）靠旺火短时间逼出锅气，若火太小会大量出水变成水煮菜。',
      '锅温逼近焦糊上限时，果断离火或快速颠勺抛起食材，既能瞬间降温又能让油香包裹食材。',
    ],
    proTip: '收汁阶段调至旺火并持续轻推晃锅，让水分快速蒸发而油脂乳化，菜肴自然油亮诱人。',
  },
  {
    id: 'tech-sauce-yuxiang',
    category: '经典味型比例',
    title: '经典复合味型黄金比例口诀',
    summary: '提前按勺调好碗汁，旺火下锅一气呵成，家常炒菜也能有大厨水准。',
    keyMetrics: '鱼香 1:2:2:3 · 宫保荔枝 2:1.5:2 · 糖醋 1:2:3:4:5',
    details: [
      '【鱼香汁】生抽 1 勺 + 陈醋 2 勺 + 白糖 2 勺 + 清水 3 勺 + 淀粉 1 勺（突出酸甜辣咸鲜平衡）。',
      '【宫保荔枝汁】生抽 2 勺 + 米醋 1.5 勺 + 白糖 2 勺 + 料酒 1 勺 + 淀粉 1 勺（甜略大于酸，回味清爽）。',
      '【万能糖醋汁】料酒 1 勺 + 生抽 2 勺 + 白糖 3 勺 + 陈醋 4 勺 + 清水 5 勺（糖醋排骨、糖醋里脊通吃）。',
    ],
    proTip: '水淀粉勾芡的黄金配比通常是「淀粉 1 : 清水 3」，下锅前记得再搅匀一次避免沉淀。',
  },
  {
    id: 'tech-seasoning-order',
    category: '经典味型比例',
    title: '中餐放调料的先后铁律',
    summary: '同样几种调料，先后顺序不同，味道能差出一个档次。',
    keyMetrics: '锅边烹酒醋 · 肉菜晚放盐 · 蒜香分两次',
    details: [
      '去腥优先：料酒必须在肉类高温煸炒时沿锅边淋入，借高温挥发带走腥味。',
      '生抽增鲜、老抽上色：酱油沿热锅壁淋入能产生美拉德焦香；陈醋则应在出锅前锅边烹入保香。',
      '青菜与嫩肉临出锅再放盐，可防止水分提前大量渗出；蒜末一半炝锅、一半出锅前撒入香气翻倍。',
    ],
    proTip: '味精或鸡精在高温长时间沸腾下易失去鲜味，务必在关火前最后撒入拌匀。',
  },
];
