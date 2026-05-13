const express = require('express');
const Food = require('../models/Food');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── IFCT2017 helper ───────────────────────────────────────────────
let ifctSearch = null;
if (process.env.IFCT_ENABLED === 'true') {
  try {
    const ifct = require('ifct2017');
    ifctSearch = (query) => {
      try {
        const q = query.toLowerCase();
        const results = [];
        if (typeof ifct.corpus === 'function') {
          const corpus = ifct.corpus();
          for (const [code, food] of Object.entries(corpus || {})) {
            if (food.name && food.name.toLowerCase().includes(q)) {
              const comp = ifct.compositions ? ifct.compositions()[code] || {} : {};
              results.push({
                ifctCode: code,
                name: food.name,
                nameLocal: food.scie || '',
                category: mapIfctGroup(food.group),
                servingSize: 100,
                servingUnit: 'g',
                calories: Math.round(comp.energy || comp.enerc || 0),
                macros: {
                  protein: Math.round((comp.protein || comp.prot || 0) * 10) / 10,
                  carbs:   Math.round((comp.carbohydrate || comp.cho || 0) * 10) / 10,
                  fats:    Math.round((comp.fat || comp.fatce || 0) * 10) / 10,
                  fiber:   Math.round((comp.fibre || comp.fibts || 0) * 10) / 10,
                },
                micronutrients: {
                  calcium:  Math.round(comp.calcium || comp.ca || 0),
                  iron:     Math.round((comp.iron || comp.fe || 0) * 100) / 100,
                  vitaminC: Math.round(comp.vitaminC || comp.vitc || 0),
                  vitaminA: Math.round(comp.vitaminA || comp.vita || 0),
                  vitaminB12: Math.round((comp.vitaminB12 || comp.vitb12 || 0) * 100) / 100,
                  zinc:     Math.round((comp.zinc || comp.zn || 0) * 100) / 100,
                  potassium: Math.round(comp.potassium || comp.k || 0),
                  sodium:   Math.round(comp.sodium || comp.na || 0),
                  magnesium: Math.round(comp.magnesium || comp.mg || 0),
                },
                source: 'ifct2017',
                isVerified: true,
              });
              if (results.length >= 15) break;
            }
          }
        }
        return results;
      } catch (e) {
        console.warn('IFCT search error:', e.message);
        return [];
      }
    };
    console.log('✅ IFCT2017 loaded successfully');
  } catch (e) {
    console.warn('⚠️  IFCT2017 not installed. Run: cd server && npm install ifct2017');
  }
}

function mapIfctGroup(group) {
  if (!group) return 'other';
  const g = group.toLowerCase();
  if (g.includes('cereal') || g.includes('grain')) return 'grain';
  if (g.includes('pulse') || g.includes('legume')) return 'protein';
  if (g.includes('vegetable')) return 'vegetable';
  if (g.includes('fruit')) return 'fruit';
  if (g.includes('milk') || g.includes('dairy')) return 'dairy';
  if (g.includes('meat') || g.includes('poultry') || g.includes('fish')) return 'protein';
  if (g.includes('fat') || g.includes('oil')) return 'fat';
  if (g.includes('sugar') || g.includes('sweet')) return 'snack';
  return 'other';
}

// ── GET /api/foods/search ─────────────────────────────────────────
router.get('/search', protect, async (req, res) => {
  try {
    const { q = '', category, limit = 20 } = req.query;
    const dbQuery = {};
    // Show public foods + user's own custom foods
    dbQuery.$or = [
      { isCustom: false },
      { isCustom: true, createdBy: req.user._id },
    ];
    if (q) dbQuery.$text = { $search: q };
    if (category) dbQuery.category = category;

    const dbFoods = await Food.find(dbQuery)
      .sort({ usageCount: -1 })
      .limit(Number(limit));

    let ifctFoods = [];
    if (ifctSearch && q.length >= 2) {
      ifctFoods = ifctSearch(q)
        .filter(f => !dbFoods.some(d => d.name.toLowerCase() === f.name.toLowerCase()));
    }

    const foods = [...dbFoods, ...ifctFoods].slice(0, Number(limit));
    res.json({ foods, ifctEnabled: !!ifctSearch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/foods/mine — user's custom foods ────────────────────
router.get('/mine', protect, async (req, res) => {
  try {
    const foods = await Food.find({ isCustom: true, createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/foods — create custom food ─────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const {
      name, brand, calories, servingSize, servingUnit,
      macros, micronutrients, category
    } = req.body;

    if (!name || calories === undefined) {
      return res.status(400).json({ error: 'name and calories are required' });
    }

    const food = await Food.create({
      name: name.trim(),
      brand: brand?.trim() || '',
      calories: Number(calories),
      servingSize: Number(servingSize) || 100,
      servingUnit: servingUnit || 'g',
      macros: {
        protein: Number(macros?.protein) || 0,
        carbs:   Number(macros?.carbs)   || 0,
        fats:    Number(macros?.fats)    || 0,
        fiber:   Number(macros?.fiber)   || 0,
        sugar:   Number(macros?.sugar)   || 0,
        saturatedFat: Number(macros?.saturatedFat) || 0,
      },
      micronutrients: {
        sodium:     Number(micronutrients?.sodium)     || undefined,
        potassium:  Number(micronutrients?.potassium)  || undefined,
        calcium:    Number(micronutrients?.calcium)    || undefined,
        iron:       Number(micronutrients?.iron)       || undefined,
        vitaminC:   Number(micronutrients?.vitaminC)   || undefined,
        vitaminD:   Number(micronutrients?.vitaminD)   || undefined,
      },
      category: category || 'other',
      isCustom: true,
      createdBy: req.user._id,
    });

    res.status(201).json({ food, message: 'Custom food created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT /api/foods/:id — update custom food ──────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, createdBy: req.user._id, isCustom: true });
    if (!food) return res.status(404).json({ error: 'Food not found or not yours' });

    const allowed = ['name','brand','calories','servingSize','servingUnit','macros','micronutrients','category'];
    allowed.forEach(k => { if (req.body[k] !== undefined) food[k] = req.body[k]; });
    await food.save();
    res.json({ food, message: 'Food updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/foods/:id ─────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, createdBy: req.user._id, isCustom: true });
    if (!food) return res.status(404).json({ error: 'Food not found or not yours' });
    await food.deleteOne();
    res.json({ message: 'Food deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/foods/seed ──────────────────────────────────────────
router.post('/seed', protect, async (req, res) => {
  try {
    const count = await Food.countDocuments({ isCustom: false });
    if (count > 0) return res.json({ message: 'Already seeded', count });

    const seedFoods = [
      { name:'Chicken Breast',        servingSize:100, calories:165, macros:{protein:31,carbs:0,fats:4},         category:'protein',   isVerified:true, micronutrients:{sodium:74,potassium:256,calcium:15,iron:1,vitaminC:0} },
      { name:'Boiled Egg',            servingSize:50,  calories:70,  macros:{protein:6,carbs:1,fats:5},          category:'protein',   isVerified:true, micronutrients:{sodium:62,potassium:63,calcium:25,iron:1,vitaminD:1} },
      { name:'Brown Rice (cooked)',   servingSize:186, calories:218, macros:{protein:5,carbs:46,fats:2,fiber:4}, category:'grain',     isVerified:true, micronutrients:{sodium:10,potassium:154,magnesium:84,iron:1} },
      { name:'Oats (dry)',            servingSize:100, calories:389, macros:{protein:17,carbs:66,fats:7,fiber:11},category:'grain',    isVerified:true, micronutrients:{iron:5,magnesium:177,zinc:4} },
      { name:'Paneer',                servingSize:100, calories:265, macros:{protein:18,carbs:3,fats:20},         category:'dairy',    isVerified:true, micronutrients:{calcium:480,sodium:25,potassium:65} },
      { name:'Dal (cooked)',          servingSize:200, calories:180, macros:{protein:13,carbs:25,fats:3,fiber:8}, category:'protein',  isVerified:true, micronutrients:{iron:3,potassium:477,magnesium:48} },
      { name:'Chapati (1 medium)',    servingSize:40,  calories:120, macros:{protein:3,carbs:19,fats:2},          category:'grain',    isVerified:true },
      { name:'Banana (medium)',       servingSize:118, calories:105, macros:{protein:1,carbs:27,fats:0,fiber:3},  category:'fruit',    isVerified:true, micronutrients:{potassium:422,vitaminC:10,magnesium:32} },
      { name:'Greek Yogurt',          servingSize:150, calories:130, macros:{protein:17,carbs:7,fats:4},          category:'dairy',    isVerified:true, micronutrients:{calcium:200,potassium:240,sodium:60} },
      { name:'Almonds',              servingSize:30,  calories:174, macros:{protein:6,carbs:6,fats:15,fiber:3},  category:'fat',      isVerified:true, micronutrients:{calcium:76,magnesium:76,iron:1,vitaminE:7} },
      { name:'Sweet Potato (cooked)',servingSize:150, calories:130, macros:{protein:3,carbs:30,fats:0,fiber:4},  category:'vegetable',isVerified:true, micronutrients:{potassium:450,vitaminC:25,vitaminA:961} },
      { name:'Milk (full fat)',       servingSize:250, calories:150, macros:{protein:8,carbs:12,fats:8},          category:'dairy',    isVerified:true, micronutrients:{calcium:300,vitaminD:3,potassium:370} },
      { name:'Whey Protein (1 scoop)',servingSize:30, calories:120, macros:{protein:25,carbs:3,fats:2},          category:'supplement',isVerified:true },
      { name:'Moong Sprouts',        servingSize:100, calories:97,  macros:{protein:7,carbs:14,fats:2,fiber:5},  category:'protein',  isVerified:true, micronutrients:{vitaminC:14,iron:1,calcium:13} },
      { name:'White Rice (cooked)',  servingSize:186, calories:240, macros:{protein:4,carbs:52,fats:1},          category:'grain',    isVerified:true },
      { name:'Curd / Dahi',          servingSize:150, calories:90,  macros:{protein:9,carbs:8,fats:4},           category:'dairy',    isVerified:true, micronutrients:{calcium:180,sodium:55} },
      { name:'Tuna (canned)',         servingSize:100, calories:132, macros:{protein:29,carbs:0,fats:1},          category:'protein',  isVerified:true, micronutrients:{sodium:247,potassium:176} },
      { name:'Peanut Butter',        servingSize:32,  calories:190, macros:{protein:8,carbs:7,fats:16},          category:'fat',      isVerified:true, micronutrients:{magnesium:54,potassium:189} },
      { name:'Rajma (cooked)',       servingSize:200, calories:225, macros:{protein:15,carbs:38,fats:1,fiber:10},category:'protein',  isVerified:true, micronutrients:{iron:4,potassium:607,magnesium:60} },
      { name:'Dosa (plain)',         servingSize:80,  calories:133, macros:{protein:3,carbs:23,fats:3},          category:'grain',    isVerified:true },
      { name:'Idli (2 pieces)',      servingSize:100, calories:134, macros:{protein:4,carbs:26,fats:1},          category:'grain',    isVerified:true },
      { name:'Poha (cooked)',        servingSize:150, calories:205, macros:{protein:3,carbs:42,fats:3},          category:'grain',    isVerified:true, micronutrients:{iron:2} },
      { name:'Spinach (cooked)',     servingSize:100, calories:41,  macros:{protein:3,carbs:7,fats:0,fiber:4},   category:'vegetable',isVerified:true, micronutrients:{iron:4,calcium:99,vitaminC:18,vitaminA:469,potassium:558} },
      { name:'Broccoli',            servingSize:100, calories:34,  macros:{protein:3,carbs:7,fats:0,fiber:3},   category:'vegetable',isVerified:true, micronutrients:{vitaminC:91,vitaminK:102,calcium:47,potassium:316} },
      { name:'Apple (medium)',       servingSize:182, calories:95,  macros:{protein:0,carbs:25,fats:0,fiber:4},  category:'fruit',    isVerified:true, micronutrients:{vitaminC:8,potassium:195} },
      { name:'Salmon (cooked)',      servingSize:100, calories:208, macros:{protein:20,carbs:0,fats:13},          category:'protein',  isVerified:true, micronutrients:{potassium:363,vitaminD:14,sodium:59} },
      { name:'Chana (boiled)',       servingSize:164, calories:269, macros:{protein:14,carbs:45,fats:4,fiber:12},category:'protein',  isVerified:true, micronutrients:{iron:5,calcium:80,potassium:477} },
      { name:'Tofu (firm)',          servingSize:126, calories:94,  macros:{protein:10,carbs:2,fats:6},           category:'protein',  isVerified:true, micronutrients:{calcium:350,iron:2} },
      { name:'Avocado (half)',       servingSize:100, calories:160, macros:{protein:2,carbs:9,fats:15,fiber:7},  category:'fat',      isVerified:true, micronutrients:{potassium:485,vitaminC:10,magnesium:29} },
      { name:'Quinoa (cooked)',      servingSize:185, calories:222, macros:{protein:8,carbs:39,fats:4,fiber:5},  category:'grain',    isVerified:true, micronutrients:{iron:3,magnesium:118,potassium:318} },
    ];

    await Food.insertMany(seedFoods);
    res.json({ message: 'Seeded successfully', count: seedFoods.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
