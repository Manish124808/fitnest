import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import FoodSearchModal from '../components/nutrition/FoodSearchModal';
import { useToast } from '../hooks/useToast';
import { MICRO_RDA, MICRO_GROUPS } from '../data/indianFoodDB';

const today = () => new Date().toISOString().split('T')[0];

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch',     label: 'Lunch',     emoji: '☀️' },
  { key: 'dinner',    label: 'Dinner',    emoji: '🌆' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🍎' },
];

// ── Local food log (works without backend too) ────────────────
function useLocalFoodLog() {
  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fn_foodlog_' + today())) || { breakfast: [], lunch: [], dinner: [], snacks: [] }; }
    catch { return { breakfast: [], lunch: [], dinner: [], snacks: [] }; }
  });

  const save = (newLog) => {
    setLog(newLog);
    localStorage.setItem('fn_foodlog_' + today(), JSON.stringify(newLog));
  };

  const addFood = (mealType, food) => {
    const newLog = { ...log, [mealType]: [...(log[mealType] || []), { ...food, id: Date.now() }] };
    save(newLog);
  };

  const removeFood = (mealType, id) => {
    const newLog = { ...log, [mealType]: log[mealType].filter(f => f.id !== id) };
    save(newLog);
  };

  const allFoods = Object.values(log).flat();

  const totals = allFoods.reduce((acc, f) => ({
    cal: acc.cal + (f.cal || 0),
    p:   acc.p   + (f.p   || 0),
    c:   acc.c   + (f.c   || 0),
    f:   acc.f   + (f.f   || 0),
  }), { cal: 0, p: 0, c: 0, f: 0 });

  // Aggregate micronutrients across all logged foods
  const microTotals = allFoods.reduce((acc, food) => {
    if (!food.micros) return acc;
    Object.keys(food.micros).forEach(k => {
      acc[k] = (acc[k] || 0) + (food.micros[k] || 0);
    });
    return acc;
  }, {});

  return { log, addFood, removeFood, totals, microTotals };
}

// ── Micro progress bar row ────────────────────────────────────
function MicroRow({ microKey, value }) {
  const rda = MICRO_RDA[microKey];
  if (!rda) return null;
  const val = Math.round(value * 100) / 100;
  const pct = Math.min(100, Math.round((val / rda.value) * 100));
  const isSodium = microKey === 'sodium';
  const barColor = isSodium
    ? (pct > 80 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e')
    : (pct >= 20 ? '#22c55e' : pct >= 8 ? '#f59e0b' : '#cbd5e1');

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{rda.label}</span>
        <span style={{ fontWeight: 600 }}>
          {val} {rda.unit}
          <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400 }}>
            {pct}% DV
          </span>
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

// ── Daily Micronutrient Panel ─────────────────────────────────
function DailyMicroPanel({ microTotals }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('vitamins');

  const hasData = Object.values(microTotals).some(v => v > 0);

  // Compute how many nutrients hit 20%+ DV
  const metCount = Object.keys(MICRO_RDA).filter(k => {
    const val = microTotals[k] || 0;
    return Math.round((val / MICRO_RDA[k].value) * 100) >= 20;
  }).length;
  const totalMicros = Object.keys(MICRO_RDA).length;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🔬 Daily Micronutrients</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {hasData
              ? `${metCount}/${totalMicros} nutrients at 20%+ daily value`
              : 'Log foods to see vitamin & mineral totals'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasData && (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `conic-gradient(var(--green) ${metCount / totalMicros * 360}deg, var(--border) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Math.round(metCount / totalMicros * 100)}%
              </div>
            </div>
          )}
          <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && hasData && (
        <div style={{ marginTop: 14 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['vitamins', 'minerals'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '7px 0', border: 'none', borderRadius: 8,
                  background: tab === t ? 'var(--green)' : 'var(--surface)',
                  color: tab === t ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}
              >
                {t === 'vitamins' ? '🧡 Vitamins (10)' : '🪨 Minerals (7)'}
              </button>
            ))}
          </div>

          {/* Micro rows */}
          {MICRO_GROUPS[tab].map(key => (
            <MicroRow key={key} microKey={key} value={microTotals[key] || 0} />
          ))}

          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
            Based on ICMR / USDA Recommended Daily Values · Totals for today's logged foods
          </div>
        </div>
      )}

      {open && !hasData && (
        <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
          🍽️ Start logging foods with micronutrient data to see your daily vitamin & mineral totals.
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function NutritionPage() {
  const user = useSelector(s => s.auth.user);
  const toast = useToast();
  const { log, addFood, removeFood, totals, microTotals } = useLocalFoodLog();
  const [showModal, setShowModal] = useState(false);
  const [activeMeal, setActiveMeal] = useState('breakfast');
  const [date, setDate] = useState(today());

  const targets = user?.targets || { calories: 2000, protein: 150, carbs: 200, fats: 65 };
  const pct = (v, t) => Math.min(100, Math.round((v / t) * 100));
  const calLeft = Math.max(0, targets.calories - totals.cal);

  const handleFoodSelect = ({ localFood, mealType }) => {
    addFood(mealType, localFood);
    toast.success(`Added ${localFood.name} (${localFood.cal} kcal)`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="page-title">Nutrition Tracker 🥗</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ fontSize: 12, color: 'var(--muted)', border: 'none', background: 'none', cursor: 'pointer', marginTop: 2 }} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setActiveMeal('breakfast'); setShowModal(true); }}>
          + Add Food
        </button>
      </div>

      {/* Calorie summary */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg,var(--green-50),var(--teal-light))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '4px 0' }}>
          {[
            { label: 'Eaten', val: totals.cal, color: 'var(--green)' },
            { label: 'Goal',  val: targets.calories, color: 'var(--text)' },
            { label: 'Left',  val: calLeft, color: calLeft < 100 ? 'var(--red)' : 'var(--blue)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div className="progress-bar mt-3">
          <div className="progress-fill" style={{ width: pct(totals.cal, targets.calories) + '%', background: totals.cal > targets.calories ? 'var(--red)' : 'var(--green)' }} />
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="grid-3 mb-4">
        {[
          { label: 'Protein', val: totals.p, target: targets.protein, color: '#16a34a' },
          { label: 'Carbs',   val: totals.c, target: targets.carbs,   color: '#2563eb' },
          { label: 'Fats',    val: totals.f, target: targets.fats,    color: '#d97706' },
        ].map(m => (
          <div key={m.label} className="stat-card">
            <div className="stat-label">{m.label}</div>
            <div className="stat-value" style={{ color: m.color, fontSize: 18 }}>{Math.round(m.val)}g</div>
            <div className="stat-sub">/ {m.target}g</div>
            <div className="progress-bar mt-2"><div className="progress-fill" style={{ width: pct(m.val, m.target) + '%', background: m.color }} /></div>
          </div>
        ))}
      </div>

      {/* Meal sections */}
      {MEAL_TYPES.map(meal => {
        const foods = log[meal.key] || [];
        const mealCal = foods.reduce((s, f) => s + (f.cal || 0), 0);
        return (
          <div key={meal.key} className="meal-section">
            <div className="meal-section-header">
              <div className="meal-section-name">{meal.emoji} {meal.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {mealCal > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>{mealCal} kcal</span>}
                <button className="btn btn-secondary btn-sm" onClick={() => { setActiveMeal(meal.key); setShowModal(true); }}>+ Add</button>
              </div>
            </div>

            {foods.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--subtle)', padding: '6px 0' }}>No items logged yet</div>
            ) : (
              foods.map(food => (
                <div key={food.id} className="food-item-row" style={{ cursor: 'default' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="food-name">{food.displayName || food.name}</div>
                      {food.brand && (
                        <span className="tag tag-blue" style={{ fontSize: 9 }}>🏷️ {food.brand}</span>
                      )}
                      {food.micros && (
                        <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 600 }}>🔬</span>
                      )}
                    </div>
                    <div className="food-meta">
                      {food.servings && food.servings !== 1 ? `×${food.servings} · ` : ''}
                      P:{Math.round(food.p)}g · C:{Math.round(food.c)}g · F:{Math.round(food.f)}g
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="food-cal">{food.cal} kcal</div>
                    <button className="btn-icon btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }}
                      onClick={() => { removeFood(meal.key, food.id); toast.info('Food removed'); }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}

      {/* ── Daily Micronutrient Summary Panel ── */}
      <DailyMicroPanel microTotals={microTotals} />

      {/* Food Search Modal */}
      {showModal && (
        <FoodSearchModal
          mealType={activeMeal}
          onSelect={handleFoodSelect}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
