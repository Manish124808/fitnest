import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '../hooks/useToast';
import { CloudImg, getRecipeImage, RECIPE_IMAGES } from '../data/cloudinaryAssets.jsx';

const STARTER_RECIPES = [
  { id: 'r1', name: 'High Protein Egg Bowl', cal: 420, p: 38, c: 22, f: 18, time: 15, category: 'highProtein', tags: ['high-protein', 'keto'], difficulty: 'Easy', servings: 1, ingredients: ['3 boiled eggs', '1 cup moong sprouts', '1 tbsp olive oil', 'salt, pepper, cumin'] },
  { id: 'r2', name: 'Chicken Rice Meal Prep', cal: 520, p: 52, c: 48, f: 10, time: 35, category: 'highProtein', tags: ['high-protein', 'meal-prep'], difficulty: 'Easy', servings: 4, ingredients: ['200g chicken breast', '1 cup brown rice', 'broccoli', 'olive oil', 'spices'] },
  { id: 'r3', name: 'Dal Tadka + Chapati', cal: 380, p: 18, c: 55, f: 8, time: 30, category: 'vegetarian', tags: ['vegetarian', 'high-fiber'], difficulty: 'Easy', servings: 2, ingredients: ['1 cup toor dal', '2 chapati', 'onion', 'tomato', '1 tsp ghee', 'spices'] },
  { id: 'r4', name: 'Paneer Bhurji', cal: 340, p: 24, c: 8, f: 24, time: 20, category: 'vegetarian', tags: ['vegetarian', 'high-protein'], difficulty: 'Easy', servings: 2, ingredients: ['200g paneer', 'onion', 'tomato', 'capsicum', 'cumin', 'spices'] },
  { id: 'r5', name: 'Oats Protein Smoothie', cal: 310, p: 28, c: 35, f: 6, time: 5, category: 'quickMeal', tags: ['quick', 'pre-workout'], difficulty: 'Easy', servings: 1, ingredients: ['1 scoop whey protein', '50g rolled oats', '1 banana', '250ml milk', 'honey'] },
  { id: 'r6', name: 'Moong Dal Chilla', cal: 260, p: 18, c: 32, f: 7, time: 20, category: 'vegetarian', tags: ['vegetarian', 'gluten-free', 'high-protein'], difficulty: 'Medium', servings: 2, ingredients: ['1 cup moong dal (soaked)', 'onion', 'green chilli', 'coriander', 'cumin'] },
  { id: 'r7', name: 'Rajma Chawal', cal: 480, p: 18, c: 85, f: 5, time: 40, category: 'vegetarian', tags: ['vegetarian', 'high-fiber'], difficulty: 'Medium', servings: 2, ingredients: ['1 cup rajma', '1 cup basmati rice', 'onion', 'tomato', 'ginger-garlic', 'spices'] },
  { id: 'r8', name: 'Tandoori Chicken Salad', cal: 320, p: 42, c: 12, f: 11, time: 30, category: 'lowCarb', tags: ['low-carb', 'high-protein', 'cutting'], difficulty: 'Medium', servings: 1, ingredients: ['200g chicken thigh', 'curd', 'tandoori masala', 'mixed greens', 'lemon juice', 'onion rings'] },
  { id: 'r9', name: 'Soya Chunk Curry', cal: 290, p: 30, c: 20, f: 9, time: 25, category: 'highProtein', tags: ['vegan', 'high-protein'], difficulty: 'Easy', servings: 2, ingredients: ['100g soya chunks', 'onion', 'tomato', 'curd', 'garam masala', 'oil'] },
  { id: 'r10', name: 'Sprout Chaat', cal: 195, p: 14, c: 28, f: 3, time: 10, category: 'lowCarb', tags: ['vegan', 'low-cal', 'high-fiber'], difficulty: 'Easy', servings: 1, ingredients: ['1 cup chana sprouts', 'onion', 'tomato', 'chaat masala', 'lemon', 'coriander'] },
  { id: 'r11', name: 'Masala Dosa', cal: 230, p: 5, c: 38, f: 7, time: 25, category: 'vegetarian', tags: ['vegetarian', 'South Indian'], difficulty: 'Hard', servings: 1, ingredients: ['dosa batter', 'boiled potato', 'mustard seeds', 'curry leaves', 'sambar', 'chutney'] },
  { id: 'r12', name: 'Chole Bhature', cal: 620, p: 18, c: 82, f: 25, time: 50, category: 'vegetarian', tags: ['vegetarian', 'North Indian', 'bulking'], difficulty: 'Hard', servings: 2, ingredients: ['1 cup kabuli chana', '2 bhature', 'onion', 'tomato', 'spices', 'ghee'] },
];

const CATS = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'highProtein', label: 'High Protein', emoji: '💪' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🌱' },
  { id: 'lowCarb', label: 'Low Carb', emoji: '🥦' },
  { id: 'quickMeal', label: 'Quick (≤20 min)', emoji: '⚡' },
  { id: 'saved', label: 'Saved', emoji: '❤️' },
];

const DIFF_COLOR = { Easy: 'tag-green', Medium: 'tag-amber', Hard: 'tag-red' };

export default function RecipesPage() {
  const toast = useToast();
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState(STARTER_RECIPES);
  const [saved, setSaved] = useState(new Set(['r1', 'r3', 'r6', 'r10']));
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ name: '', cal: '', p: '', c: '', f: '', time: 30, category: 'vegetarian', ingredients: '', servings: 2 });

  const filtered = recipes.filter(r => {
    if (cat === 'saved') return saved.has(r.id);
    if (cat !== 'all' && r.category !== cat) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSave = (id, e) => {
    e.stopPropagation();
    setSaved(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    toast.success(saved.has(id) ? 'Removed from saved' : '❤️ Recipe saved!');
  };

  const createRecipe = () => {
    if (!form.name || !form.cal) { toast.error('Name and calories required'); return; }
    const newR = { id: 'r' + Date.now(), ...form, cal: +form.cal, p: +form.p||0, c: +form.c||0, f: +form.f||0, time: +form.time||30, servings: +form.servings||2, tags: [], difficulty: 'Easy', ingredients: form.ingredients.split('\n').filter(Boolean) };
    setRecipes(prev => [newR, ...prev]);
    toast.success('Recipe created! 🍳');
    setShowCreate(false);
    setForm({ name: '', cal: '', p: '', c: '', f: '', time: 30, category: 'vegetarian', ingredients: '', servings: 2 });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="page-title">Recipe Manager 🍳</div>
          <div className="text-sm text-muted mt-2">Indian meals · {recipes.length} recipes · Auto-calculated macros</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create</button>
      </div>

      {/* Search */}
      <input className="input mb-3" placeholder="🔍  Search recipes..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`tag ${cat === c.id ? 'tag-green' : 'tag-gray'}`}
            style={{ cursor: 'pointer', padding: '6px 12px', whiteSpace: 'nowrap', fontSize: 11 }}>
            {c.emoji} {c.label} {c.id === 'saved' && `(${saved.size})`}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      <div className="grid-3">
        {filtered.map(r => (
          <div key={r.id} className="recipe-card card-hover" onClick={() => setShowDetail(r)}>
            {/* Real image from Unsplash/Cloudinary */}
            <CloudImg
              src={getRecipeImage(r.name)}
              alt={r.name}
              height={110}
              style={{ width: '100%' }}
              fallback="🍽️"
            />
            <div className="recipe-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                <div className="recipe-card-name">{r.name}</div>
                <button onClick={(e) => toggleSave(r.id, e)} style={{ fontSize: 16, flexShrink: 0 }}>
                  {saved.has(r.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '6px 0' }}>
                <span className={`tag ${DIFF_COLOR[r.difficulty] || 'tag-gray'}`} style={{ fontSize: 9 }}>{r.difficulty}</span>
                <span className="tag tag-gray" style={{ fontSize: 9 }}>{r.category === 'highProtein' ? 'High Protein' : r.category}</span>
              </div>
              <div className="recipe-card-meta">⏱ {r.time}min · 👥 {r.servings} serving{r.servings > 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{r.cal} kcal</span>
                <span style={{ fontSize: 10, color: 'var(--muted)', alignSelf: 'flex-end' }}>P:{r.p}g C:{r.c}g F:{r.f}g</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🍳</div>
          <div className="empty-state-title">No recipes found</div>
          <div className="empty-state-sub">Try a different filter or create your own</div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-handle" />
            {/* Hero image */}
            <CloudImg
              src={getRecipeImage(showDetail.name)}
              alt={showDetail.name}
              height={180}
              style={{ width: '100%', borderRadius: 12, marginBottom: 14 }}
              fallback="🍽️"
            />
            <div className="flex items-center justify-between mb-3">
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{showDetail.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>⏱ {showDetail.time}min · {showDetail.difficulty} · {showDetail.servings} servings</div>
              </div>
              <button className="btn-icon btn-ghost" onClick={() => setShowDetail(null)} style={{ fontSize: 20 }}>✕</button>
            </div>

            {/* Macro cards */}
            <div className="grid-4 mb-4" style={{ gap: 8 }}>
              {[
                { label: 'Calories', val: showDetail.cal + ' kcal', color: 'var(--green)' },
                { label: 'Protein', val: showDetail.p + 'g', color: '#16a34a' },
                { label: 'Carbs', val: showDetail.c + 'g', color: '#2563eb' },
                { label: 'Fats', val: showDetail.f + 'g', color: '#d97706' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {showDetail.tags.map(t => <span key={t} className="tag tag-blue" style={{ fontSize: 10 }}>{t}</span>)}
            </div>

            {/* Ingredients */}
            <div className="section-title">Ingredients</div>
            <div style={{ marginBottom: 14 }}>
              {showDetail.ingredients.map((ing, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓</span>
                  {ing}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { toast.success(`${showDetail.name} added to meal log!`); setShowDetail(null); }}>
                🍽️ Add to Meal Log
              </button>
              <button className={`btn ${saved.has(showDetail.id) ? 'btn-danger' : 'btn-secondary'}`} onClick={e => { toggleSave(showDetail.id, e); }}>
                {saved.has(showDetail.id) ? '💔 Unsave' : '❤️ Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Create Recipe 🍳</div>
            <div className="input-group"><label className="input-label">Recipe Name *</label>
              <input className="input" placeholder="e.g. High Protein Dal Palak" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid-2">
              <div className="input-group"><label className="input-label">Category</label>
                <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="highProtein">High Protein</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="lowCarb">Low Carb</option>
                  <option value="quickMeal">Quick Meal</option>
                </select>
              </div>
              <div className="input-group"><label className="input-label">Cook Time (min)</label>
                <input className="input" type="number" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="grid-4" style={{ gap: 8 }}>
              {[['cal','Kcal *'],['p','Protein(g)'],['c','Carbs(g)'],['f','Fats(g)']].map(([k, l]) => (
                <div key={k}><label className="input-label">{l}</label>
                  <input className="input" type="number" placeholder="0" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="input-group"><label className="input-label">Servings</label>
              <input className="input" type="number" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} />
            </div>
            <div className="input-group"><label className="input-label">Ingredients (one per line)</label>
              <textarea className="input textarea" rows={4} placeholder={'200g chicken breast\n1 cup brown rice\n2 tbsp olive oil'} value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-full" onClick={createRecipe}>✅ Create Recipe</button>
          </div>
        </div>
      )}
    </div>
  );
}
