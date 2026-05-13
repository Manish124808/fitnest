import { useState, useMemo } from 'react';
import { INDIAN_FOOD_DB, FOOD_CATEGORIES, DIET_TAGS, searchFoods, GOAL_PICKS, MICRO_RDA, MICRO_GROUPS } from '../../data/indianFoodDB';
import { useSelector } from 'react-redux';

export default function FoodSearchModal({ onSelect, onClose, mealType }) {
  const user = useSelector(s => s.auth.user);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTag, setActiveTag] = useState('');
  const [mode, setMode] = useState('search'); // search | custom | goalPicks
  const [customFood, setCustomFood] = useState({ name: '', cal: '', p: '', c: '', f: '', serving: '100', unit: 'g' });
  const [selected, setSelected] = useState(null);
  const [servings, setServings] = useState(1);
  const [showMicros, setShowMicros] = useState(false);
  const [microTab, setMicroTab] = useState('vitamins'); // vitamins | minerals

  const results = useMemo(() => {
    return searchFoods(query, {
      category: activeCategory === 'all' ? null : activeCategory,
      tag: activeTag || null,
      limit: 40,
    });
  }, [query, activeCategory, activeTag]);

  const goal = user?.profile?.goal || 'maintenance';
  const goalPicks = useMemo(() => {
    const ids = GOAL_PICKS[goal] || [];
    return INDIAN_FOOD_DB.filter(f => ids.includes(f.id));
  }, [goal]);

  const displayList = mode === 'goalPicks' ? goalPicks : results;

  const handleSelect = (food) => {
    setSelected(food);
    setServings(1);
    setShowMicros(false);
  };

  const confirmSelect = () => {
    if (!selected) return;
    const ratio = servings;
    // Scale micros by servings if present
    const scaledMicros = selected.micros
      ? Object.fromEntries(
          Object.entries(selected.micros).map(([k, v]) => [k, Math.round(v * ratio * 100) / 100])
        )
      : undefined;
    onSelect({
      localFood: {
        ...selected,
        cal: Math.round(selected.cal * ratio),
        p: Math.round(selected.p * ratio * 10) / 10,
        c: Math.round(selected.c * ratio * 10) / 10,
        f: Math.round(selected.f * ratio * 10) / 10,
        micros: scaledMicros,
        servings,
        displayName: selected.name,
      },
      mealType,
    });
    onClose();
  };

  const confirmCustom = () => {
    if (!customFood.name || !customFood.cal) return;
    onSelect({
      localFood: {
        id: 'custom_' + Date.now(),
        name: customFood.name,
        cal: Number(customFood.cal),
        p: Number(customFood.p) || 0,
        c: Number(customFood.c) || 0,
        f: Number(customFood.f) || 0,
        serving: Number(customFood.serving) || 100,
        unit: customFood.unit,
        servings: 1,
        displayName: customFood.name,
        isCustom: true,
      },
      mealType,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '92vh' }}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>
            Add Food {mealType && <span className="tag tag-green" style={{ marginLeft: 6 }}>{mealType}</span>}
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>

        {/* Mode Tabs */}
        <div className="tab-bar">
          <div className={`tab ${mode === 'search' ? 'active' : ''}`} onClick={() => setMode('search')}>🔍 Search</div>
          <div className={`tab ${mode === 'goalPicks' ? 'active' : ''}`} onClick={() => setMode('goalPicks')}>🎯 For Goal</div>
          <div className={`tab ${mode === 'custom' ? 'active' : ''}`} onClick={() => setMode('custom')}>✏️ Custom</div>
        </div>

        {/* ── SEARCH MODE ── */}
        {mode === 'search' && (
          <>
            <input
              className="input"
              placeholder="Search dal, paneer, chicken, Haldiram, Nakpro..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{ marginBottom: 10 }}
            />

            {/* Category filter */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
              {FOOD_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`tag ${activeCategory === cat.id ? 'tag-green' : 'tag-gray'}`}
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '5px 10px', fontSize: 11 }}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Diet tag filter */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
              {['', ...DIET_TAGS.slice(0, 8)].map(tag => (
                <button
                  key={tag || 'all'}
                  className={`tag ${activeTag === tag ? 'tag-blue' : 'tag-gray'}`}
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '4px 8px', fontSize: 10 }}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag || 'All diets'}
                </button>
              ))}
            </div>

            <FoodList foods={displayList} onSelect={handleSelect} selectedId={selected?.id} />
          </>
        )}

        {/* ── GOAL PICKS MODE ── */}
        {mode === 'goalPicks' && (
          <>
            <div style={{ padding: '8px 12px', background: 'var(--green-50)', borderRadius: 8, marginBottom: 10, fontSize: 12, color: 'var(--green-dark)' }}>
              🎯 Best foods for your <strong>{goal}</strong> goal — curated from Indian cuisine
            </div>
            <FoodList foods={displayList} onSelect={handleSelect} selectedId={selected?.id} />
          </>
        )}

        {/* ── CUSTOM MODE ── */}
        {mode === 'custom' && (
          <div>
            <div className="input-group">
              <label className="input-label">Food Name *</label>
              <input className="input" placeholder="e.g. Homemade Paneer Sabzi" value={customFood.name} onChange={e => setCustomFood(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Serving Size</label>
                <input className="input" type="number" value={customFood.serving} onChange={e => setCustomFood(f => ({ ...f, serving: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Unit</label>
                <select className="select" value={customFood.unit} onChange={e => setCustomFood(f => ({ ...f, unit: e.target.value }))}>
                  <option>g</option><option>ml</option><option>piece</option><option>cup</option><option>tbsp</option><option>tsp</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Calories (kcal) *</label>
              <input className="input" type="number" placeholder="0" value={customFood.cal} onChange={e => setCustomFood(f => ({ ...f, cal: e.target.value }))} />
            </div>
            <div className="grid-3">
              <div className="input-group">
                <label className="input-label">Protein (g)</label>
                <input className="input" type="number" placeholder="0" value={customFood.p} onChange={e => setCustomFood(f => ({ ...f, p: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Carbs (g)</label>
                <input className="input" type="number" placeholder="0" value={customFood.c} onChange={e => setCustomFood(f => ({ ...f, c: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Fats (g)</label>
                <input className="input" type="number" placeholder="0" value={customFood.f} onChange={e => setCustomFood(f => ({ ...f, f: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={confirmCustom} disabled={!customFood.name || !customFood.cal}>
              ✅ Add Custom Food
            </button>
          </div>
        )}

        {/* ── SERVING SELECTOR + MICRONUTRIENTS (when item picked) ── */}
        {selected && mode !== 'custom' && (
          <div style={{ marginTop: 14, padding: 14, background: 'var(--green-50)', borderRadius: 10 }}>
            {/* Food name + brand badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{selected.name}</div>
              {selected.brand && (
                <span className="tag tag-blue" style={{ fontSize: 10 }}>🏷️ {selected.brand}</span>
              )}
            </div>

            {/* Servings control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <label className="input-label" style={{ margin: 0, flex: 1 }}>
                Servings ({selected.serving}{selected.unit})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-sm btn-ghost" onClick={() => setServings(s => Math.max(0.25, s - 0.25))}>−</button>
                <span style={{ fontWeight: 600, fontSize: 16, minWidth: 36, textAlign: 'center' }}>{servings}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => setServings(s => s + 0.25)}>+</button>
              </div>
            </div>

            {/* Macros summary */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--green)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                {Math.round(selected.cal * servings)} kcal
              </span>
              <span>💪 <strong>{Math.round(selected.p * servings * 10) / 10}g</strong> protein</span>
              <span>🍞 <strong>{Math.round(selected.c * servings * 10) / 10}g</strong> carbs</span>
              <span>🫒 <strong>{Math.round(selected.f * servings * 10) / 10}g</strong> fat</span>
              {selected.fiber > 0 && (
                <span>🌾 <strong>{Math.round(selected.fiber * servings * 10) / 10}g</strong> fiber</span>
              )}
            </div>

            {/* Micronutrients toggle */}
            {selected.micros && (
              <>
                <button
                  onClick={() => setShowMicros(v => !v)}
                  style={{
                    width: '100%', padding: '7px 0', marginBottom: showMicros ? 10 : 0,
                    background: showMicros ? 'var(--green-dark)' : 'var(--green)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3,
                  }}
                >
                  {showMicros ? '▲ Hide' : '🔬 View'} Vitamins & Minerals
                </button>

                {showMicros && (
                  <div style={{ marginBottom: 10 }}>
                    {/* Micro tabs */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {['vitamins', 'minerals'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setMicroTab(tab)}
                          style={{
                            flex: 1, padding: '6px 0', border: 'none', borderRadius: 8,
                            background: microTab === tab ? 'var(--green)' : 'var(--surface)',
                            color: microTab === tab ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          {tab === 'vitamins' ? '🧡 Vitamins' : '🪨 Minerals'}
                        </button>
                      ))}
                    </div>

                    {/* Micro rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {MICRO_GROUPS[microTab].map(key => {
                        const rda = MICRO_RDA[key];
                        if (!rda) return null;
                        const rawVal = selected.micros[key] || 0;
                        const scaledVal = Math.round(rawVal * servings * 100) / 100;
                        const pct = Math.min(100, Math.round((scaledVal / rda.value) * 100));
                        const isSodium = key === 'sodium';
                        const barColor = isSodium
                          ? (pct > 80 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e')
                          : (pct >= 20 ? '#22c55e' : pct >= 8 ? '#f59e0b' : '#e5e7eb');

                        return (
                          <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{rda.label}</span>
                              <span style={{ fontWeight: 600 }}>
                                {scaledVal} {rda.unit}
                                <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400 }}>
                                  ({pct}% DV)
                                </span>
                              </span>
                            </div>
                            <div style={{ height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                      DV = Daily Value (ICMR/USDA RDA) · Values per {servings} serving{servings !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </>
            )}

            <button className="btn btn-primary btn-full" onClick={confirmSelect}>
              ✅ Add to Log
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FoodList({ foods, onSelect, selectedId }) {
  if (!foods.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔍</div>
      <div className="empty-state-title">No foods found</div>
      <div className="empty-state-sub">Try a different search or add a custom food</div>
    </div>
  );

  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {foods.map(food => (
        <div
          key={food.id}
          className="food-item-row"
          onClick={() => onSelect(food)}
          style={{
            background: selectedId === food.id ? 'var(--green-50)' : undefined,
            borderLeft: selectedId === food.id ? '3px solid var(--green)' : '3px solid transparent',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="food-name">{food.name}</div>
              {food.brand && (
                <span className="tag tag-blue" style={{ fontSize: 9, padding: '1px 5px' }}>🏷️ {food.brand}</span>
              )}
            </div>
            <div className="food-meta">
              {food.serving}{food.unit} · P:{food.p}g C:{food.c}g F:{food.f}g
              {food.micros && (
                <span style={{ marginLeft: 5, color: 'var(--green)', fontSize: 9, fontWeight: 600 }}>🔬 micros</span>
              )}
              {food.tags.slice(0, 2).map(t => (
                <span key={t} className="tag tag-gray" style={{ marginLeft: 4, fontSize: 9 }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="food-cal">{food.cal} kcal</div>
        </div>
      ))}
    </div>
  );
}
