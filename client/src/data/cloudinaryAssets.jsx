// ================================================================
// FitNest Cloudinary Image Assets
// All images served via Cloudinary CDN with transformations
// Base: https://res.cloudinary.com/demo (public demo account)
// For production: replace CLOUD_NAME with your Cloudinary cloud name
// ================================================================

const CLD = 'https://res.cloudinary.com/dxqv8mbpg';
const UNSPLASH = 'https://images.unsplash.com';

// ── Cloudinary transform helper ────────────────────────────────
// w = width, h = height, c = crop mode, q = quality, f = format
export const cld = (publicId, opts = {}) => {
  const { w = 400, h = 300, c = 'fill', q = 'auto', f = 'auto', g = 'auto' } = opts;
  return `${CLD}/image/upload/w_${w},h_${h},c_${c},q_${q},f_${f},g_${g}/${publicId}`;
};

// ── Hero / Onboarding images ───────────────────────────────────
export const HERO_IMAGES = {
  fitness:    `${UNSPLASH}/photo-1517836357463-d25dfeac3438?w=800&q=80&fit=crop`,
  nutrition:  `${UNSPLASH}/photo-1490645935967-10de6ba17061?w=800&q=80&fit=crop`,
  workout:    `${UNSPLASH}/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop`,
  healthy:    `${UNSPLASH}/photo-1559056199-641a0ac8b55e?w=800&q=80&fit=crop`,
};

// ── Dashboard background banners ──────────────────────────────
export const BANNER_IMAGES = {
  morning:    `${UNSPLASH}/photo-1506126613408-eca07ce68773?w=600&q=75&fit=crop`,
  workout:    `${UNSPLASH}/photo-1526506118085-60ce8714f8c5?w=600&q=75&fit=crop`,
  nutrition:  `${UNSPLASH}/photo-1512621776951-a57141f2eefd?w=600&q=75&fit=crop`,
};

// ── Recipe Images (real food photography) ─────────────────────
export const RECIPE_IMAGES = {
  // Indian meals
  dal_tadka:        `${UNSPLASH}/photo-1546833999-b9f581a1996d?w=400&h=240&q=80&fit=crop`,
  chicken_curry:    `${UNSPLASH}/photo-1603894584373-5ac82b2ae398?w=400&h=240&q=80&fit=crop`,
  biryani:          `${UNSPLASH}/photo-1589302168068-964664d93dc0?w=400&h=240&q=80&fit=crop`,
  paneer:           `${UNSPLASH}/photo-1567188040759-fb8a883dc6d8?w=400&h=240&q=80&fit=crop`,
  rajma:            `${UNSPLASH}/photo-1545247181-516773cae754?w=400&h=240&q=80&fit=crop`,
  idli_sambar:      `${UNSPLASH}/photo-1630383249896-483b64b5b88b?w=400&h=240&q=80&fit=crop`,
  dosa:             `${UNSPLASH}/photo-1589301760014-d929f3979dbc?w=400&h=240&q=80&fit=crop`,
  roti_sabzi:       `${UNSPLASH}/photo-1565557623262-b51c2513a641?w=400&h=240&q=80&fit=crop`,
  chole_bhature:    `${UNSPLASH}/photo-1606491956689-2ea866880c84?w=400&h=240&q=80&fit=crop`,
  poha:             `${UNSPLASH}/photo-1606755456206-b25206cde27e?w=400&h=240&q=80&fit=crop`,

  // High protein meals
  egg_bowl:         `${UNSPLASH}/photo-1482049016688-2d3e1b311543?w=400&h=240&q=80&fit=crop`,
  chicken_rice:     `${UNSPLASH}/photo-1547592180-85f173990554?w=400&h=240&q=80&fit=crop`,
  protein_shake:    `${UNSPLASH}/photo-1622480916113-9000ac49b79b?w=400&h=240&q=80&fit=crop`,
  oats:             `${UNSPLASH}/photo-1517673400267-0251440c45dc?w=400&h=240&q=80&fit=crop`,
  salad:            `${UNSPLASH}/photo-1512621776951-a57141f2eefd?w=400&h=240&q=80&fit=crop`,
  smoothie_bowl:    `${UNSPLASH}/photo-1490323914169-4b89d867a2be?w=400&h=240&q=80&fit=crop`,
  meal_prep:        `${UNSPLASH}/photo-1466637574441-749b8f19452f?w=400&h=240&q=80&fit=crop`,
  grilled_chicken:  `${UNSPLASH}/photo-1532550907401-a500c9a57435?w=400&h=240&q=80&fit=crop`,
  sprout_salad:     `${UNSPLASH}/photo-1540420773420-3366772f4999?w=400&h=240&q=80&fit=crop`,
  besan_chilla:     `${UNSPLASH}/photo-1565958011703-44f9829ba187?w=400&h=240&q=80&fit=crop`,
};

// ── Exercise / Workout Images ──────────────────────────────────
export const EXERCISE_IMAGES = {
  bench_press:      `${UNSPLASH}/photo-1534438327276-14e5300c3a48?w=300&h=200&q=75&fit=crop`,
  deadlift:         `${UNSPLASH}/photo-1574680096145-d05b474e2155?w=300&h=200&q=75&fit=crop`,
  squat:            `${UNSPLASH}/photo-1566241142559-40e1dab266c6?w=300&h=200&q=75&fit=crop`,
  pullups:          `${UNSPLASH}/photo-1598971639058-fab3c3109a67?w=300&h=200&q=75&fit=crop`,
  running:          `${UNSPLASH}/photo-1476480862126-209bfaa8edc8?w=300&h=200&q=75&fit=crop`,
  cycling:          `${UNSPLASH}/photo-1558618666-fcd25c85cd64?w=300&h=200&q=75&fit=crop`,
  yoga:             `${UNSPLASH}/photo-1506126613408-eca07ce68773?w=300&h=200&q=75&fit=crop`,
  walking:          `${UNSPLASH}/photo-1571008887538-b36bb32f4571?w=300&h=200&q=75&fit=crop`,
  pushups:          `${UNSPLASH}/photo-1598971861713-54ad16a7e72e?w=300&h=200&q=75&fit=crop`,
  ohp:              `${UNSPLASH}/photo-1583454110551-21f2fa2afe61?w=300&h=200&q=75&fit=crop`,
  rows:             `${UNSPLASH}/photo-1530822847156-5df684ec5105?w=300&h=200&q=75&fit=crop`,
  plank:            `${UNSPLASH}/photo-1571019614242-c5c5dee9f50b?w=300&h=200&q=75&fit=crop`,
  gym_general:      `${UNSPLASH}/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&q=75&fit=crop`,
  hiit:             `${UNSPLASH}/photo-1609899537878-5e3a2e4ff175?w=300&h=200&q=75&fit=crop`,
  jump_rope:        `${UNSPLASH}/photo-1601422407692-ec4eeec1d9b3?w=300&h=200&q=75&fit=crop`,
};

// ── Food / Nutrition Images ────────────────────────────────────
export const FOOD_IMAGES = {
  eggs:             `${UNSPLASH}/photo-1482049016688-2d3e1b311543?w=200&h=160&q=75&fit=crop`,
  chicken:          `${UNSPLASH}/photo-1604503468506-a8da13d11560?w=200&h=160&q=75&fit=crop`,
  fish:             `${UNSPLASH}/photo-1467003909585-2f8a72700288?w=200&h=160&q=75&fit=crop`,
  paneer:           `${UNSPLASH}/photo-1567188040759-fb8a883dc6d8?w=200&h=160&q=75&fit=crop`,
  dal:              `${UNSPLASH}/photo-1546833999-b9f581a1996d?w=200&h=160&q=75&fit=crop`,
  rice:             `${UNSPLASH}/photo-1536304993881-ff86e0c4d8e9?w=200&h=160&q=75&fit=crop`,
  roti:             `${UNSPLASH}/photo-1565557623262-b51c2513a641?w=200&h=160&q=75&fit=crop`,
  oats:             `${UNSPLASH}/photo-1517673400267-0251440c45dc?w=200&h=160&q=75&fit=crop`,
  banana:           `${UNSPLASH}/photo-1571771894821-ce9b6c11b08e?w=200&h=160&q=75&fit=crop`,
  apple:            `${UNSPLASH}/photo-1567306226416-28f0efdc88ce?w=200&h=160&q=75&fit=crop`,
  nuts:             `${UNSPLASH}/photo-1509622905150-fa66d3906e09?w=200&h=160&q=75&fit=crop`,
  milk:             `${UNSPLASH}/photo-1550583724-b2692b85b150?w=200&h=160&q=75&fit=crop`,
  vegetables:       `${UNSPLASH}/photo-1512621776951-a57141f2eefd?w=200&h=160&q=75&fit=crop`,
  fruits:           `${UNSPLASH}/photo-1490567674101-9f54a5d99a62?w=200&h=160&q=75&fit=crop`,
  protein_powder:   `${UNSPLASH}/photo-1622480916113-9000ac49b79b?w=200&h=160&q=75&fit=crop`,
  sprouts:          `${UNSPLASH}/photo-1540420773420-3366772f4999?w=200&h=160&q=75&fit=crop`,
  curd:             `${UNSPLASH}/photo-1571047424082-15f6cec8b5ed?w=200&h=160&q=75&fit=crop`,
  green_tea:        `${UNSPLASH}/photo-1556679343-c7306c1976bc?w=200&h=160&q=75&fit=crop`,
};

// ── Avatar placeholder images ──────────────────────────────────
export const AVATAR_COLORS = [
  '#16a34a', '#0d9488', '#2563eb', '#7c3aed',
  '#d97706', '#dc2626', '#db2777', '#0891b2',
];

export const getAvatarColor = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

// ── Community / Social images ──────────────────────────────────
export const SOCIAL_IMAGES = {
  progress1: `${UNSPLASH}/photo-1571019614242-c5c5dee9f50b?w=400&h=300&q=75&fit=crop`,
  progress2: `${UNSPLASH}/photo-1526506118085-60ce8714f8c5?w=400&h=300&q=75&fit=crop`,
  meal_post: `${UNSPLASH}/photo-1512621776951-a57141f2eefd?w=400&h=300&q=75&fit=crop`,
  gym_post:  `${UNSPLASH}/photo-1534438327276-14e5300c3a48?w=400&h=300&q=75&fit=crop`,
};

// ── Auth page illustration ─────────────────────────────────────
export const AUTH_BG = `${UNSPLASH}/photo-1517836357463-d25dfeac3438?w=1200&q=70&fit=crop`;

// ── Map recipe name to image ───────────────────────────────────
export const RECIPE_IMAGE_MAP = {
  'High Protein Egg Bowl':        RECIPE_IMAGES.egg_bowl,
  'Chicken Rice Meal Prep':       RECIPE_IMAGES.chicken_rice,
  'Dal Tadka + Chapati':          RECIPE_IMAGES.dal_tadka,
  'Paneer Bhurji':                RECIPE_IMAGES.paneer,
  'Oats Protein Smoothie':        RECIPE_IMAGES.protein_shake,
  'Moong Dal Chilla':             RECIPE_IMAGES.besan_chilla,
  'Soya Chunk Curry':             RECIPE_IMAGES.chicken_curry,
  'Rajma Chawal':                 RECIPE_IMAGES.rajma,
  'Tandoori Chicken Salad':       RECIPE_IMAGES.grilled_chicken,
  'Sprout Chaat':                 RECIPE_IMAGES.sprout_salad,
  'Veg Biryani':                  RECIPE_IMAGES.biryani,
  'Chole Bhature':                RECIPE_IMAGES.chole_bhature,
  'Masala Dosa':                  RECIPE_IMAGES.dosa,
  'Idli Sambar':                  RECIPE_IMAGES.idli_sambar,
  'Aloo Paratha':                 RECIPE_IMAGES.roti_sabzi,
  'Poha':                         RECIPE_IMAGES.poha,
  'Besan Chilla':                 RECIPE_IMAGES.besan_chilla,
  default:                        RECIPE_IMAGES.meal_prep,
};

export const getRecipeImage = (name) =>
  RECIPE_IMAGE_MAP[name] || RECIPE_IMAGE_MAP.default;

// ── Map exercise name to image ─────────────────────────────────
export const EXERCISE_IMAGE_MAP = {
  'Bench Press':          EXERCISE_IMAGES.bench_press,
  'Deadlift':             EXERCISE_IMAGES.deadlift,
  'Squat':                EXERCISE_IMAGES.squat,
  'Pull-ups':             EXERCISE_IMAGES.pullups,
  'Running':              EXERCISE_IMAGES.running,
  'Cycling':              EXERCISE_IMAGES.cycling,
  'Walking':              EXERCISE_IMAGES.walking,
  'OHP':                  EXERCISE_IMAGES.ohp,
  'Barbell Row':          EXERCISE_IMAGES.rows,
  'Plank':                EXERCISE_IMAGES.plank,
  'Jump Rope':            EXERCISE_IMAGES.jump_rope,
  'Push-ups':             EXERCISE_IMAGES.pushups,
  'HIIT':                 EXERCISE_IMAGES.hiit,
  default:                EXERCISE_IMAGES.gym_general,
};

export const getExerciseImage = (name) =>
  EXERCISE_IMAGE_MAP[name] || EXERCISE_IMAGE_MAP.default;

// ── Lazy image component with blur placeholder ─────────────────
export function CloudImg({ src, alt = '', width, height, style = {}, className = '', fallback = '🖼️' }) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-light)', fontSize: 32, ...style }} className={className}>
        {fallback}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', width, height, ...style }} className={className}>
      {!loaded && (
        <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          opacity: loaded ? 1 : 0, transition: 'opacity .3s',
        }}
      />
    </div>
  );
}

import React from 'react';
export default { RECIPE_IMAGES, EXERCISE_IMAGES, FOOD_IMAGES, HERO_IMAGES, BANNER_IMAGES };
