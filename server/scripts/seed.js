const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: String, servingSize: Number, servingUnit: String,
  calories: Number,
  macros: { protein: Number, carbs: Number, fats: Number, fiber: Number },
  category: String, isCustom: Boolean, isVerified: Boolean, usageCount: Number
}, { timestamps: true });
foodSchema.index({ name: 'text' });
const Food = mongoose.model('Food', foodSchema);

const FOODS = [
  // ── Existing verified foods ─────────────────────────────────────
  { name:'Chicken Breast (cooked)',   servingSize:100, servingUnit:'g',  calories:165, macros:{protein:31,  carbs:0,   fats:3.6, fiber:0},   category:'protein',   isVerified:true },
  { name:'Boiled Egg (1 large)',      servingSize:50,  servingUnit:'g',  calories:68,  macros:{protein:5.5, carbs:0.6, fats:4.8, fiber:0},   category:'protein',   isVerified:true },
  { name:'Brown Rice (cooked)',       servingSize:195, servingUnit:'g',  calories:218, macros:{protein:5,   carbs:46,  fats:1.8, fiber:3.5}, category:'grain',     isVerified:true },
  { name:'Oats (dry)',                servingSize:100, servingUnit:'g',  calories:389, macros:{protein:17,  carbs:66,  fats:7,   fiber:11},  category:'grain',     isVerified:true },
  { name:'Paneer',                    servingSize:100, servingUnit:'g',  calories:265, macros:{protein:18,  carbs:3.4, fats:20,  fiber:0},   category:'dairy',     isVerified:true },
  { name:'Toor Dal (cooked)',         servingSize:200, servingUnit:'ml', calories:216, macros:{protein:15,  carbs:37,  fats:0.7, fiber:7},   category:'protein',   isVerified:true },
  { name:'Chapati / Roti (1 piece)', servingSize:40,  servingUnit:'g',  calories:104, macros:{protein:3.5, carbs:18,  fats:2.5, fiber:2.2}, category:'grain',     isVerified:true },
  { name:'Banana (1 medium)',         servingSize:118, servingUnit:'g',  calories:105, macros:{protein:1.3, carbs:27,  fats:0.4, fiber:3.1}, category:'fruit',     isVerified:true },
  { name:'Greek Yogurt',              servingSize:100, servingUnit:'g',  calories:59,  macros:{protein:10,  carbs:3.6, fats:0.4, fiber:0},   category:'dairy',     isVerified:true },
  { name:'Almonds',                   servingSize:30,  servingUnit:'g',  calories:174, macros:{protein:6,   carbs:6,   fats:15,  fiber:3},   category:'fat',       isVerified:true },
  { name:'Sweet Potato (boiled)',     servingSize:150, servingUnit:'g',  calories:130, macros:{protein:3,   carbs:30,  fats:0.1, fiber:4},   category:'vegetable', isVerified:true },
  { name:'Milk (full fat)',           servingSize:250, servingUnit:'ml', calories:150, macros:{protein:8,   carbs:12,  fats:8,   fiber:0},   category:'dairy',     isVerified:true },
  { name:'Whey Protein (1 scoop)',    servingSize:30,  servingUnit:'g',  calories:120, macros:{protein:25,  carbs:3,   fats:1.5, fiber:0},   category:'supplement',isVerified:true },
  { name:'Rajma (cooked)',            servingSize:200, servingUnit:'g',  calories:225, macros:{protein:15,  carbs:38,  fats:0.9, fiber:10},  category:'protein',   isVerified:true },
  { name:'Moong Sprouts',            servingSize:104, servingUnit:'g',  calories:31,  macros:{protein:3.2, carbs:6,   fats:0.2, fiber:2},   category:'protein',   isVerified:true },
  { name:'Soya Chunks (raw)',         servingSize:50,  servingUnit:'g',  calories:175, macros:{protein:25,  carbs:18,  fats:0.5, fiber:5},   category:'protein',   isVerified:true },
  { name:'Peanut Butter (1 tbsp)',    servingSize:16,  servingUnit:'g',  calories:94,  macros:{protein:4,   carbs:3.5, fats:8,   fiber:0.9}, category:'fat',       isVerified:true },
  { name:'Curd / Dahi',              servingSize:100, servingUnit:'g',  calories:61,  macros:{protein:3.5, carbs:4.7, fats:3.4, fiber:0},   category:'dairy',     isVerified:true },
  { name:'Poha (cooked)',             servingSize:150, servingUnit:'g',  calories:205, macros:{protein:3,   carbs:42,  fats:3.2, fiber:1.5}, category:'grain',     isVerified:true },
  { name:'Idli (1 piece)',            servingSize:40,  servingUnit:'g',  calories:58,  macros:{protein:2,   carbs:11,  fats:0.4, fiber:0.5}, category:'grain',     isVerified:true },
  { name:'Tuna (canned)',             servingSize:100, servingUnit:'g',  calories:132, macros:{protein:29,  carbs:0,   fats:1,   fiber:0},   category:'protein',   isVerified:true },
  { name:'Buttermilk / Chaas',       servingSize:250, servingUnit:'ml', calories:50,  macros:{protein:3,   carbs:5,   fats:1.5, fiber:0},   category:'dairy',     isVerified:true },
  { name:'Coconut Water',            servingSize:240, servingUnit:'ml', calories:45,  macros:{protein:1.7, carbs:8.9, fats:0.5, fiber:2.6}, category:'beverage',  isVerified:true },
  { name:'Dal Makhani (1 bowl)',      servingSize:250, servingUnit:'ml', calories:380, macros:{protein:13,  carbs:42,  fats:18,  fiber:9},   category:'protein',   isVerified:true },
  { name:'Besan Chilla (1 piece)',    servingSize:80,  servingUnit:'g',  calories:156, macros:{protein:9,   carbs:20,  fats:4,   fiber:4},   category:'grain',     isVerified:true },

  // ── Hostel Mess Monday foods ────────────────────────────────────
  { name:'Aloo Paratha (1 piece)',    servingSize:120, servingUnit:'g',  calories:235, macros:{protein:5,   carbs:38,  fats:8,   fiber:3},   category:'grain',     isVerified:true },
  { name:'Arhar Dal (cooked)',        servingSize:200, servingUnit:'ml', calories:182, macros:{protein:12,  carbs:30,  fats:1.5, fiber:6},   category:'protein',   isVerified:true },
  { name:'Chawal / Steamed Rice',    servingSize:150, servingUnit:'g',  calories:195, macros:{protein:4,   carbs:43,  fats:0.4, fiber:0.6}, category:'grain',     isVerified:true },
  { name:'Mausami Sabzi (seasonal)', servingSize:100, servingUnit:'g',  calories:65,  macros:{protein:2.5, carbs:10,  fats:2,   fiber:3},   category:'vegetable', isVerified:true },
  { name:'Salad (mixed)',            servingSize:80,  servingUnit:'g',  calories:25,  macros:{protein:1.2, carbs:4.5, fats:0.2, fiber:2},   category:'vegetable', isVerified:true },
  { name:'Achar / Pickle (1 tsp)',   servingSize:10,  servingUnit:'g',  calories:12,  macros:{protein:0.2, carbs:1.5, fats:0.7, fiber:0.3}, category:'other',     isVerified:true },
  { name:'Kali Masoor Dal (cooked)', servingSize:200, servingUnit:'ml', calories:190, macros:{protein:14,  carbs:32,  fats:0.8, fiber:8},   category:'protein',   isVerified:true },
  { name:'Chai / Tea (with milk)',   servingSize:150, servingUnit:'ml', calories:45,  macros:{protein:1.5, carbs:7,   fats:1.2, fiber:0},   category:'beverage',  isVerified:true },
  { name:'Biscuit (2 pieces)',       servingSize:20,  servingUnit:'g',  calories:85,  macros:{protein:1.2, carbs:13,  fats:3.5, fiber:0.3}, category:'snack',     isVerified:true },

  // ── Hostel Mess Tuesday foods ───────────────────────────────────
  { name:'Halwa Chana (breakfast)',  servingSize:150, servingUnit:'g',  calories:280, macros:{protein:7,   carbs:44,  fats:9,   fiber:5},   category:'grain',     isVerified:true },
  { name:'Urad Chhilka Dal (cooked)',servingSize:200, servingUnit:'ml', calories:198, macros:{protein:14,  carbs:34,  fats:0.8, fiber:8},   category:'protein',   isVerified:true },
  { name:'Mix Dal (cooked)',         servingSize:200, servingUnit:'ml', calories:185, macros:{protein:12,  carbs:31,  fats:1,   fiber:7},   category:'protein',   isVerified:true },

  // ── Hostel Mess Wednesday foods ─────────────────────────────────
  { name:'Sada Paratha (1 piece)',   servingSize:80,  servingUnit:'g',  calories:185, macros:{protein:4,   carbs:28,  fats:7,   fiber:2},   category:'grain',     isVerified:true },
  { name:'Chana Dal (cooked)',       servingSize:200, servingUnit:'ml', calories:210, macros:{protein:13,  carbs:35,  fats:1.5, fiber:8},   category:'protein',   isVerified:true },

  // ── Hostel Mess Thursday foods ──────────────────────────────────
  { name:'Poha (breakfast, plain)',  servingSize:150, servingUnit:'g',  calories:190, macros:{protein:3,   carbs:40,  fats:2.5, fiber:1.5}, category:'grain',     isVerified:true },
  { name:'Jawa / Daliya (cooked)',   servingSize:150, servingUnit:'g',  calories:160, macros:{protein:5,   carbs:32,  fats:1.5, fiber:4},   category:'grain',     isVerified:true },
  { name:'Kadhi (with pakoda)',      servingSize:200, servingUnit:'ml', calories:175, macros:{protein:6,   carbs:18,  fats:9,   fiber:1.5}, category:'protein',   isVerified:true },
  { name:'Aloo Jeera Sabzi',        servingSize:100, servingUnit:'g',  calories:110, macros:{protein:2,   carbs:18,  fats:4,   fiber:2},   category:'vegetable', isVerified:true },
  { name:'Sauce / Tamatar Chutney', servingSize:30,  servingUnit:'g',  calories:20,  macros:{protein:0.5, carbs:4,   fats:0.2, fiber:0.5}, category:'other', isVerified:true },
  { name:'Aloo Matar Sabzi',        servingSize:150, servingUnit:'g',  calories:145, macros:{protein:4,   carbs:22,  fats:5,   fiber:4},   category:'vegetable', isVerified:true },
  { name:'Kheer (rice pudding)',     servingSize:150, servingUnit:'ml', calories:195, macros:{protein:5,   carbs:32,  fats:6,   fiber:0.5}, category:'snack',   isVerified:true },
  { name:'Chole (chickpea curry)',   servingSize:200, servingUnit:'ml', calories:270, macros:{protein:14,  carbs:38,  fats:8,   fiber:11},  category:'protein',   isVerified:true },
  { name:'Puri (1 piece)',           servingSize:40,  servingUnit:'g',  calories:145, macros:{protein:2.5, carbs:18,  fats:7,   fiber:0.8}, category:'grain',     isVerified:true },

  // ── Hostel Mess Friday foods ────────────────────────────────────
  { name:'Rajma Chawal (full plate)',servingSize:350, servingUnit:'g',  calories:420, macros:{protein:18,  carbs:72,  fats:4,   fiber:12},  category:'protein',   isVerified:true },
  { name:'Lal Masoor Dal (cooked)', servingSize:200, servingUnit:'ml', calories:178, macros:{protein:12,  carbs:30,  fats:0.6, fiber:7},   category:'protein',   isVerified:true },

  // ── Hostel Mess Saturday foods ──────────────────────────────────
  { name:'Macaroni Sauce (breakfast)',servingSize:200,servingUnit:'g',  calories:280, macros:{protein:8,   carbs:48,  fats:6,   fiber:2},   category:'grain',     isVerified:true },
  { name:'Ghova/Chola Dal (cooked)', servingSize:200, servingUnit:'ml', calories:195, macros:{protein:13,  carbs:33,  fats:1.2, fiber:7},  category:'protein',   isVerified:true },
  { name:'Sabut Urad Dal (cooked)',  servingSize:200, servingUnit:'ml', calories:210, macros:{protein:14,  carbs:36,  fats:0.8, fiber:9},   category:'protein',   isVerified:true },
  { name:'Sabut Rajma Dal (cooked)', servingSize:200, servingUnit:'ml', calories:220, macros:{protein:15,  carbs:38,  fats:0.9, fiber:10},  category:'protein',   isVerified:true },

  // ── Hostel Mess Sunday foods ────────────────────────────────────
  { name:'Bread Slice (1 piece)',    servingSize:25,  servingUnit:'g',  calories:67,  macros:{protein:2.5, carbs:12,  fats:1,   fiber:0.6}, category:'grain',     isVerified:true },
  { name:'Butter (1 tsp)',           servingSize:5,   servingUnit:'g',  calories:36,  macros:{protein:0,   carbs:0,   fats:4,   fiber:0},   category:'fat',       isVerified:true },
  { name:'Sandwich (veg, 2 slices)', servingSize:120, servingUnit:'g',  calories:195, macros:{protein:6,   carbs:30,  fats:6,   fiber:2.5}, category:'grain',     isVerified:true },
  { name:'Matar Paneer Curry',       servingSize:200, servingUnit:'ml', calories:295, macros:{protein:14,  carbs:16,  fats:20,  fiber:4},   category:'protein',   isVerified:true },
  { name:'Pulao (veg, 1 plate)',     servingSize:200, servingUnit:'g',  calories:290, macros:{protein:6,   carbs:52,  fats:7,   fiber:3},   category:'grain',     isVerified:true },
  { name:'Chutney (green/mint)',     servingSize:20,  servingUnit:'g',  calories:15,  macros:{protein:0.5, carbs:2.5, fats:0.3, fiber:1},   category:'other', isVerified:true },
  { name:'Chole Bhature (1 plate)',  servingSize:300, servingUnit:'g',  calories:590, macros:{protein:17,  carbs:78,  fats:24,  fiber:12},  category:'grain',     isVerified:true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    const existing = await Food.countDocuments({ isVerified: true });
    if (existing >= FOODS.length) {
      console.log(`ℹ️  Already seeded (${existing} foods). Use --force to re-seed.`);
      if (!process.argv.includes('--force')) { process.exit(0); return; }
    }
    await Food.deleteMany({ isVerified: true });
    await Food.insertMany(FOODS.map(f => ({ ...f, isCustom: false, usageCount: 0 })));
    console.log(`🌿 Seeded ${FOODS.length} foods (including hostel mess items)!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}
seed();
