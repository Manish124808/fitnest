/**
 * FitNest — Custom Foods Manager
 * Route: /custom-foods
 * Allows users to create, edit, and delete their own food items.
 * Data is saved to the server (Food model, isCustom:true).
 */
import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Utensils, FlaskConical, Save, X, AlertCircle, Loader2,
} from 'lucide-react';
import { foodAPI } from '../api';
import { useToast } from '../hooks/useToast';

const EMPTY_FORM = {
  name: '', brand: '', category: 'other',
  calories: '', servingSize: '100', servingUnit: 'g',
  protein: '', carbs: '', fats: '', fiber: '', sugar: '', saturatedFat: '',
  sodium: '', potassium: '', calcium: '', iron: '',
  vitaminC: '', vitaminD: '',
};

const CATEGORIES = [
  'grain','protein','dairy','vegetable','fruit','fat','beverage','snack','supplement','other'
];
const UNITS = ['g','ml','oz','cup','tbsp','tsp','piece','slice','scoop'];

function MacroBadge({ label, value, color }) {
  if (!value && value !== 0) return null;
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}33`,
      borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600,
    }}>
      {label}: {value}g
    </span>
  );
}

function FoodCard({ food, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const hasMicros = food.micronutrients && Object.values(food.micronutrients).some(v => v > 0);

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,var(--brand-dark),#0d9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Utensils size={18} color="#fff" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{food.name}</span>
            {food.brand && (
              <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)', borderRadius: 5, padding: '1px 6px' }}>
                {food.brand}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)', borderRadius: 5, padding: '1px 6px', textTransform: 'capitalize' }}>
              {food.category}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{
              background: 'var(--brand-dark)', color: '#fff',
              borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700,
            }}>
              {food.calories} kcal
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>
              per {food.servingSize}{food.servingUnit}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
            <MacroBadge label="P" value={food.macros?.protein} color="#16a34a" />
            <MacroBadge label="C" value={food.macros?.carbs}   color="#2563eb" />
            <MacroBadge label="F" value={food.macros?.fats}    color="#d97706" />
            {food.macros?.fiber > 0 && <MacroBadge label="Fiber" value={food.macros.fiber} color="#7c3aed" />}
          </div>

          {hasMicros && (
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <FlaskConical size={12} />
              Micronutrients
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          {expanded && hasMicros && (
            <div style={{
              marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))',
              gap: 4, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8,
            }}>
              {Object.entries(food.micronutrients).map(([k, v]) => {
                if (!v && v !== 0) return null;
                const labels = {
                  sodium:'Sodium', potassium:'Potassium', calcium:'Calcium',
                  iron:'Iron', vitaminC:'Vitamin C', vitaminD:'Vitamin D',
                };
                const units = {
                  sodium:'mg', potassium:'mg', calcium:'mg',
                  iron:'mg', vitaminC:'mg', vitaminD:'µg',
                };
                return (
                  <div key={k} style={{ fontSize: 11, color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{labels[k] || k}</span>: {v}{units[k] || 'mg'}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(food)}
            className="btn btn-ghost"
            style={{ padding: '6px 8px', borderRadius: 8 }}
            title="Edit"
          >
            <Pencil size={14} color="var(--brand)" />
          </button>
          <button
            onClick={() => onDelete(food)}
            className="btn btn-ghost"
            style={{ padding: '6px 8px', borderRadius: 8 }}
            title="Delete"
          >
            <Trash2 size={14} color="#ef4444" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FoodForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [showMicros, setShowMicros] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.calories || isNaN(form.calories)) e.calories = 'Valid calories required';
    if (form.servingSize && isNaN(form.servingSize)) e.servingSize = 'Must be a number';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    onSave({
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      calories: Number(form.calories),
      servingSize: Number(form.servingSize) || 100,
      servingUnit: form.servingUnit,
      macros: {
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fats: Number(form.fats) || 0,
        fiber: Number(form.fiber) || 0,
        sugar: Number(form.sugar) || 0,
        saturatedFat: Number(form.saturatedFat) || 0,
      },
      micronutrients: {
        sodium: form.sodium !== '' ? Number(form.sodium) : undefined,
        potassium: form.potassium !== '' ? Number(form.potassium) : undefined,
        calcium: form.calcium !== '' ? Number(form.calcium) : undefined,
        iron: form.iron !== '' ? Number(form.iron) : undefined,
        vitaminC: form.vitaminC !== '' ? Number(form.vitaminC) : undefined,
        vitaminD: form.vitaminD !== '' ? Number(form.vitaminD) : undefined,
      },
    });
  };

  const Field = ({ label, fieldKey, type = 'text', placeholder, suffix, error }) => (
    <div className="input-group">
      <label className="input-label">
        {label}{suffix && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> ({suffix})</span>}
      </label>
      <input
        className={`input${error ? ' input-error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={form[fieldKey]}
        onChange={e => set(fieldKey, e.target.value)}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 'any' : undefined}
      />
      {error && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}><AlertCircle size={10} /> {error}</div>}
    </div>
  );

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Basic info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Food Name *" fieldKey="name" placeholder="e.g. Homemade Dal" error={errors.name} />
        </div>
        <Field label="Brand" fieldKey="brand" placeholder="Optional" />
        <div className="input-group">
          <label className="input-label">Category</label>
          <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Serving + Calories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Serving Size" fieldKey="servingSize" type="number" placeholder="100" error={errors.servingSize} />
        <div className="input-group">
          <label className="input-label">Unit</label>
          <select className="select" value={form.servingUnit} onChange={e => set('servingUnit', e.target.value)}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <Field label="Calories *" fieldKey="calories" type="number" suffix="kcal" placeholder="0" error={errors.calories} />
      </div>

      {/* Macros */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Macronutrients
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          <Field label="Protein" fieldKey="protein" type="number" suffix="g" placeholder="0" />
          <Field label="Carbs"   fieldKey="carbs"   type="number" suffix="g" placeholder="0" />
          <Field label="Fats"    fieldKey="fats"    type="number" suffix="g" placeholder="0" />
          <Field label="Fiber"   fieldKey="fiber"   type="number" suffix="g" placeholder="0" />
          <Field label="Sugar"   fieldKey="sugar"   type="number" suffix="g" placeholder="0" />
          <Field label="Sat. Fat" fieldKey="saturatedFat" type="number" suffix="g" placeholder="0" />
        </div>
      </div>

      {/* Micronutrients toggle */}
      <button
        onClick={() => setShowMicros(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          color: 'var(--brand)', background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '7px 12px', cursor: 'pointer', marginBottom: 10, width: '100%',
        }}
      >
        <FlaskConical size={14} />
        {showMicros ? 'Hide' : 'Add'} Vitamins & Minerals (optional)
        {showMicros ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
      </button>

      {showMicros && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          <Field label="Sodium"    fieldKey="sodium"    type="number" suffix="mg" placeholder="0" />
          <Field label="Potassium" fieldKey="potassium" type="number" suffix="mg" placeholder="0" />
          <Field label="Calcium"   fieldKey="calcium"   type="number" suffix="mg" placeholder="0" />
          <Field label="Iron"      fieldKey="iron"      type="number" suffix="mg" placeholder="0" />
          <Field label="Vitamin C" fieldKey="vitaminC"  type="number" suffix="mg" placeholder="0" />
          <Field label="Vitamin D" fieldKey="vitaminD"  type="number" suffix="µg" placeholder="0" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Food'}
        </button>
        <button className="btn btn-ghost" onClick={onCancel} disabled={saving} style={{ padding: '10px 16px' }}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function CustomFoodsPage() {
  const toast = useToast();
  const [foods, setFoods]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]       = useState('list'); // list | create | edit
  const [editFood, setEditFood] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await foodAPI.getMine();
      setFoods(data.foods || []);
    } catch {
      toast.error('Failed to load custom foods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editFood) {
        await foodAPI.updateCustom(editFood._id, formData);
        toast.success('Food updated!');
      } else {
        await foodAPI.createCustom(formData);
        toast.success('Custom food created!');
      }
      setMode('list');
      setEditFood(null);
      load();
    } catch (err) {
      toast.error(err?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (food) => {
    if (deleteId !== food._id) { setDeleteId(food._id); return; }
    try {
      await foodAPI.deleteCustom(food._id);
      toast.info(`"${food.name}" deleted`);
      setDeleteId(null);
      setFoods(f => f.filter(x => x._id !== food._id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (food) => {
    setEditFood(food);
    // Map DB model → form
    setMode('edit');
  };

  const filtered = foods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  // Build initial form values from a food object
  const foodToForm = (food) => ({
    name: food.name || '',
    brand: food.brand || '',
    category: food.category || 'other',
    calories: food.calories ?? '',
    servingSize: food.servingSize ?? '100',
    servingUnit: food.servingUnit || 'g',
    protein: food.macros?.protein ?? '',
    carbs: food.macros?.carbs ?? '',
    fats: food.macros?.fats ?? '',
    fiber: food.macros?.fiber ?? '',
    sugar: food.macros?.sugar ?? '',
    saturatedFat: food.macros?.saturatedFat ?? '',
    sodium: food.micronutrients?.sodium ?? '',
    potassium: food.micronutrients?.potassium ?? '',
    calcium: food.micronutrients?.calcium ?? '',
    iron: food.micronutrients?.iron ?? '',
    vitaminC: food.micronutrients?.vitaminC ?? '',
    vitaminD: food.micronutrients?.vitaminD ?? '',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Utensils size={22} color="var(--brand)" />
            My Custom Foods
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
            Add foods not in the database — reuse them in meal logging
          </div>
        </div>
        {mode === 'list' && (
          <button className="btn btn-primary" onClick={() => { setMode('create'); setEditFood(null); }}>
            <Plus size={15} /> New Food
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="card card-glow" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--brand)' }}>
            {mode === 'edit' ? `✏️ Edit: ${editFood?.name}` : '➕ New Custom Food'}
          </div>
          <FoodForm
            initial={editFood ? foodToForm(editFood) : undefined}
            onSave={handleSave}
            onCancel={() => { setMode('list'); setEditFood(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* Search bar */}
      {mode === 'list' && foods.length > 0 && (
        <div className="input-group" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Search your custom foods…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Food list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <Loader2 size={24} className="spin" style={{ marginBottom: 8 }} />
          <div>Loading your foods…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Utensils size={40} color="var(--muted)" style={{ marginBottom: 12, opacity: 0.4, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {search ? 'No foods match your search' : 'No custom foods yet'}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
            {search ? 'Try a different term' : 'Create foods with exact macros & micros for accurate logging'}
          </div>
          {!search && (
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              <Plus size={14} /> Create First Food
            </button>
          )}
        </div>
      ) : (
        <>
          {deleteId && (
            <div className="card" style={{ background: '#7f1d1d22', border: '1px solid #ef444444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ flex: 1, fontSize: 13 }}>Tap the delete button again to confirm deletion.</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          )}
          {filtered.map(food => (
            <FoodCard
              key={food._id}
              food={food}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
            {filtered.length} custom food{filtered.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
