import {
  Bookmark,
  BookOpen,
  Flame,
  Search,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CULINARY_TECHNIQUES,
  INGREDIENT_PAIRINGS,
  type IngredientPairingEntry,
  type TechniqueEntry,
} from '../data/encyclopedia';
import { RECIPES, type Recipe } from '../data/recipes';

type EncyclopediaTab = 'recipes' | 'pairings' | 'techniques';

interface EncyclopediaDrawerProps {
  initialRecipeId?: string;
  bookmarks: string[];
  onToggleBookmark: (entryId: string) => void;
  onCookRecipe: (recipe: Recipe) => void;
  onClose: () => void;
}

export function EncyclopediaDrawer({
  initialRecipeId,
  bookmarks,
  onToggleBookmark,
  onCookRecipe,
  onClose,
}: EncyclopediaDrawerProps) {
  const [activeTab, setActiveTab] = useState<EncyclopediaTab>('recipes');
  const [query, setQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialRecipeId ?? RECIPES[0].id,
  );
  const [pairingCategory, setPairingCategory] = useState<string>('全部');
  const [techCategory, setTechCategory] = useState<string>('全部');

  const q = query.trim().toLowerCase();

  const filteredRecipes = useMemo(() => {
    if (!q) return RECIPES;
    return RECIPES.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.flavor.toLowerCase().includes(q) ||
        r.realRecipe.ingredients.some((i) => i.item.toLowerCase().includes(q)),
    );
  }, [q]);

  const filteredPairings = useMemo(() => {
    return INGREDIENT_PAIRINGS.filter((item) => {
      if (pairingCategory !== '全部' && item.category !== pairingCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.flavorProfile.toLowerCase().includes(q) ||
        item.goldenPairings.some(
          (p) => p.name.toLowerCase().includes(q) || p.classicDish.toLowerCase().includes(q),
        )
      );
    });
  }, [pairingCategory, q]);

  const filteredTechniques = useMemo(() => {
    return CULINARY_TECHNIQUES.filter((item) => {
      if (techCategory !== '全部' && item.category !== techCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.keyMetrics.toLowerCase().includes(q) ||
        item.details.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [techCategory, q]);

  const activeRecipe =
    filteredRecipes.find((r) => r.id === selectedRecipeId) ?? filteredRecipes[0] ?? null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#120C09]/76 p-2 sm:p-5">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] bg-[#FFFBF6] shadow-[0_24px_75px_rgba(0,0,0,0.6)]">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE0D4] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[#C84B1D]" />
            <div>
              <h2 className="font-serif-cn text-xl font-bold text-[#2A1E17]">中华烹饪百科</h2>
              <p className="text-xs text-[#847063]">
                国民家常菜谱 · 食材黄金搭配 · 刀工油温与调味秘籍
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#937F71]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜菜名、食材、火候..."
                className="w-44 rounded-xl border border-[#E5D8C9] bg-white py-2 pr-3 pl-8 text-xs text-[#2A1E17] placeholder:text-[#A49184] focus:border-[#C84B1D] focus:outline-none sm:w-56"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3E9DD] text-[#4E3B30] transition-colors hover:bg-[#E7D8C7]"
              aria-label="关闭烹饪百科"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EFE5D9] bg-[#FBF5EE] px-5 py-2.5 sm:px-7">
          <div className="flex items-center gap-1 rounded-xl bg-[#EFE4D7] p-1">
            {(
              [
                { id: 'recipes', label: '经典菜谱库' },
                { id: 'pairings', label: '食材搭配图谱' },
                { id: 'techniques', label: '刀工与调味秘籍' },
              ] as { id: EncyclopediaTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#C84B1D]'
                    : 'text-[#6D594D] hover:text-[#2A1E17]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="hidden text-xs text-[#8A7568] sm:inline tabular-nums">
            已收藏 {bookmarks.length} 条技巧
          </span>
        </div>

        {/* Main Content Body */}
        <div className="culinary-scroll flex-1 overflow-y-auto p-5 sm:p-7">
          {/* TAB 1: RECIPES */}
          {activeTab === 'recipes' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left recipe list */}
              <div className="space-y-2 lg:col-span-4">
                {filteredRecipes.length === 0 ? (
                  <p className="rounded-xl bg-white p-4 text-center text-xs text-[#8A7568]">
                    未找到匹配的菜谱，请换个关键词试试。
                  </p>
                ) : (
                  filteredRecipes.map((r) => {
                    const selected = activeRecipe?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRecipeId(r.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-colors ${
                          selected
                            ? 'border-[#C84B1D] bg-white'
                            : 'border-[#EDE1D5] bg-[#FAF4EC] hover:bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-serif-cn text-base font-bold text-[#2A1E17]">
                            {r.name}
                          </div>
                          <div className="mt-0.5 text-xs text-[#806C5F]">
                            {r.region} · {r.difficultyLabel}
                          </div>
                        </div>
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: r.dishVisualColor }}
                        />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right recipe detail sheet */}
              <div className="lg:col-span-8">
                {activeRecipe && (
                  <div className="rounded-2xl border border-[#ECE0D3] bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F2E8DD] pb-4">
                      <div>
                        <h3 className="font-serif-cn text-2xl font-bold text-[#2A1E17]">
                          {activeRecipe.name}
                        </h3>
                        <p className="mt-1 text-xs text-[#7E6A5E]">
                          {activeRecipe.region} · {activeRecipe.flavor} · {activeRecipe.realRecipe.servings} · 备料 {activeRecipe.realRecipe.prepTime} / 烹制 {activeRecipe.realRecipe.cookTime}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(`recipe:${activeRecipe.id}`)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                            bookmarks.includes(`recipe:${activeRecipe.id}`)
                              ? 'border-[#C84B1D] bg-[#FFF2EA] text-[#C84B1D]'
                              : 'border-[#E6D9CB] bg-[#FAF4EC] text-[#6B584C]'
                          }`}
                          aria-label="收藏菜谱"
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              bookmarks.includes(`recipe:${activeRecipe.id}`) ? 'fill-current' : ''
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => onCookRecipe(activeRecipe)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#C84B1D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#AE3D14] whitespace-nowrap shrink-0"
                        >
                          <Flame className="h-3.5 w-3.5" />
                          <span>立即开火试做</span>
                        </button>
                      </div>
                    </div>

                    {/* Ingredients table */}
                    <div className="mt-5">
                      <h4 className="text-xs font-semibold text-[#847063]">主料与黄金调味配比</h4>
                      <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        {activeRecipe.realRecipe.ingredients.map((item) => (
                          <div
                            key={item.item}
                            className="flex items-center justify-between border-b border-[#F4EAE0] py-1.5 text-[13px]"
                          >
                            <span className="text-[#2E2119]">{item.item}</span>
                            <span className="font-medium text-[#7C6759]">{item.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Real steps */}
                    <div className="mt-5">
                      <h4 className="text-xs font-semibold text-[#847063]">标准烹制步骤</h4>
                      <ol className="mt-2.5 space-y-2.5">
                        {activeRecipe.realRecipe.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-[13px] leading-relaxed text-[#3E2F26]">
                            <span className="font-serif-cn font-bold text-[#C84B1D] tabular-nums">
                              0{idx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Chef secret */}
                    <div className="mt-5 rounded-xl bg-[#F8F0E7] p-4">
                      <div className="text-xs font-semibold text-[#B83D12]">大厨提鲜秘诀</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#4C3B31]">
                        {activeRecipe.realRecipe.chefSecret}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INGREDIENT PAIRINGS */}
          {activeTab === 'pairings' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {['全部', '肉禽蛋', '豆制品与蔬果', '根茎菌菇'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPairingCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      pairingCategory === cat
                        ? 'bg-[#2A1E17] text-white'
                        : 'bg-[#F3E9DD] text-[#614E42] hover:bg-[#E9DAC9]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredPairings.length === 0 ? (
                <p className="rounded-2xl bg-white p-8 text-center text-xs text-[#847063]">
                  未找到相关食材搭配，请尝试清空筛选或搜索其他关键词。
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredPairings.map((entry: IngredientPairingEntry) => {
                    const saved = bookmarks.includes(entry.id);
                    return (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-[#ECE0D3] bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif-cn text-lg font-bold text-[#2A1E17]">
                              {entry.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-[#826E61]">
                              {entry.category} · {entry.flavorProfile}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleBookmark(entry.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                              saved ? 'bg-[#FFF2EA] text-[#C84B1D]' : 'bg-[#F5ECE2] text-[#847063]'
                            }`}
                            aria-label="收藏搭配"
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-[#5C493E]">
                          <span className="font-semibold text-[#2A1E17]">预处理要点：</span>
                          {entry.prepTip}
                        </p>

                        <div className="mt-3.5 space-y-2 border-t border-[#F3E9DD] pt-3">
                          <div className="text-[11px] font-semibold text-[#B83D12]">黄金搭档</div>
                          {entry.goldenPairings.map((p) => (
                            <div key={p.name} className="text-xs leading-relaxed text-[#3F3027]">
                              <span className="font-semibold">{p.name}</span>
                              <span className="mx-1.5 text-[#BBA899]">—</span>
                              <span>{p.effect}</span>
                              <span className="ml-1.5 text-[#8A7568]">（{p.classicDish}）</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3.5 rounded-xl bg-[#FBF3EB] px-3.5 py-2.5 text-xs leading-relaxed text-[#6E4736]">
                          <span className="font-semibold text-[#B33919]">避坑提醒：</span>
                          {entry.cautions}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TECHNIQUES & SEASONING RATIOS */}
          {activeTab === 'techniques' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {['全部', '刀工心法', '油温与火候', '经典味型比例'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTechCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      techCategory === cat
                        ? 'bg-[#2A1E17] text-white'
                        : 'bg-[#F3E9DD] text-[#614E42] hover:bg-[#E9DAC9]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredTechniques.length === 0 ? (
                <p className="rounded-2xl bg-white p-8 text-center text-xs text-[#847063]">
                  未找到匹配的烹饪秘籍。
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredTechniques.map((tech: TechniqueEntry) => {
                    const saved = bookmarks.includes(tech.id);
                    return (
                      <div
                        key={tech.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#ECE0D3] bg-white p-5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-semibold text-[#C84B1D]">
                                {tech.category}
                              </p>
                              <h3 className="font-serif-cn mt-0.5 text-lg font-bold text-[#2A1E17]">
                                {tech.title}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => onToggleBookmark(tech.id)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                saved ? 'bg-[#FFF2EA] text-[#C84B1D]' : 'bg-[#F5ECE2] text-[#847063]'
                              }`}
                              aria-label="收藏技巧"
                            >
                              <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          <p className="mt-2 text-xs text-[#7A665A]">{tech.summary}</p>

                          <div className="mt-3 rounded-xl bg-[#F6EDE3] px-3 py-2 text-xs font-semibold text-[#3C2B21] tabular-nums">
                            {tech.keyMetrics}
                          </div>

                          <ul className="mt-3 space-y-2">
                            {tech.details.map((line, i) => (
                              <li key={i} className="text-xs leading-relaxed text-[#46362C]">
                                <span className="mr-1.5 font-semibold text-[#C84B1D]">0{i + 1}.</span>
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 border-t border-[#F2E8DD] pt-3 text-xs leading-relaxed text-[#6E594C]">
                          <span className="font-semibold text-[#2A1E17]">实战诀窍：</span>
                          {tech.proTip}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
