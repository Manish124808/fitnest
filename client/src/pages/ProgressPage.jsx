import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHistory } from '../store/slices/nutritionSlice';
import { fetchStats } from '../store/slices/workoutSlice';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const BASE = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:'#111827', padding:8, cornerRadius:6 } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:10, family:'DM Sans' }, color:'#9ca3af' } }, y:{ grid:{ color:'#f3f4f6' }, ticks:{ font:{ size:10, family:'DM Sans' }, color:'#9ca3af' } } } };

export default function ProgressPage() {
  const dispatch = useDispatch();
  const { history } = useSelector(s => s.nutrition);
  const { stats } = useSelector(s => s.workout);

  useEffect(() => {
    dispatch(fetchHistory(30));
    dispatch(fetchStats(30));
  }, [dispatch]);

  // Use real data if available, else demo
  const calLabels  = history.length ? history.slice(-7).map(h=>h.date.slice(5)) : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const calData    = history.length ? history.slice(-7).map(h=>h.totals?.calories||0) : [1920,2050,1780,1950,2100,1840,1640];
  const protData   = history.length ? history.slice(-7).map(h=>h.totals?.protein||0)  : [142,155,138,148,160,145,142];
  const weightData = [76,75.2,74.5,73.8,73.2,72.8,72.3,72];
  const weightLabels = ['W1','W2','W3','W4','W5','W6','W7','W8'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><div className="page-title">Progress Analytics 📈</div><div className="text-sm text-muted mt-2">Visual insights into your journey</div></div>
      </div>

      {/* Summary stats */}
      <div className="grid-4 mb-4">
        {[
          { label:'Avg Deficit',  val:'-412 kcal', sub:'per day this week',   color:'var(--green)' },
          { label:'Weight Lost',  val:'4.0 kg',    sub:'since start of cut',  color:'var(--blue)'  },
          { label:'Workouts',     val: stats ? String(stats.totalWorkouts) : '18', sub:'last 30 days', color:'var(--amber)' },
          { label:'Cal Burned',   val: stats ? `${stats.totalCalories} kcal` : '5,240 kcal', sub:'from workouts', color:'var(--red)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color, fontSize:18 }}>{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weight + Calories */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="section-title">Weight Trend (kg)</div>
          <div style={{ height:150 }}>
            <Line data={{ labels:weightLabels, datasets:[{ data:weightData, borderColor:'#16a34a', backgroundColor:'rgba(22,163,74,.08)', tension:.4, pointRadius:4, pointBackgroundColor:'#16a34a', fill:true, borderWidth:2 }] }} options={BASE} />
          </div>
        </div>
        <div className="card">
          <div className="section-title">Daily Calories (last 7 days)</div>
          <div style={{ height:150 }}>
            <Bar data={{ labels:calLabels, datasets:[{ data:calData, backgroundColor: calData.map(v => v > 2100 ? '#fca5a5' : '#bbf7d0'), borderRadius:5 }] }}
              options={{ ...BASE, scales:{ ...BASE.scales, y:{ ...BASE.scales.y, min:1000 } } }} />
          </div>
          <div style={{ fontSize:10, color:'var(--muted)', marginTop:6, display:'flex', justifyContent:'space-between' }}>
            <span>Avg: {Math.round(calData.reduce((s,v)=>s+v,0)/calData.length)} kcal</span>
            <span>Goal: 2,100 kcal</span>
          </div>
        </div>
      </div>

      {/* Protein + Macros */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="section-title">Protein Intake (g/day)</div>
          <div style={{ height:140 }}>
            <Line data={{ labels:calLabels, datasets:[{ data:protData, borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,.08)', tension:.3, pointRadius:3, fill:true, borderWidth:2 }] }} options={BASE} />
          </div>
        </div>
        <div className="card">
          <div className="section-title">Macro Split (avg)</div>
          <div style={{ height:140, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:140, height:140 }}>
              <Doughnut
                data={{ labels:['Protein','Carbs','Fats'], datasets:[{ data:[142*4, 160*4, 48*9], backgroundColor:['#16a34a','#2563eb','#d97706'], borderWidth:0 }] }}
                options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true, position:'right', labels:{ font:{ size:10, family:'DM Sans' }, color:'#6b7280', boxWidth:10 } } } }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workout volume */}
      <div className="card mb-4">
        <div className="section-title">Weekly Workout Volume (kg lifted)</div>
        <div style={{ height:150 }}>
          <Bar data={{ labels:['W1','W2','W3','W4','W5','W6','W7','W8'], datasets:[{ data:[6800,7200,7600,8100,8000,8400,8600,8900], backgroundColor:'#dbeafe', borderColor:'#2563eb', borderRadius:5, borderWidth:1.5 }] }} options={BASE} />
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <div className="section-title">Weekly Insights 🤖</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { bg:'var(--green-50)', border:'var(--green-100)', color:'var(--green-dark)', text:'💪 Protein averaging 145g/day — excellent for muscle retention during your cut!' },
            { bg:'var(--blue-light)', border:'#bfdbfe', color:'#1e40af', text:'📊 Calorie deficit averaged 412 kcal/day this week — right in the optimal 300–500 kcal range.' },
            { bg:'var(--amber-light)', border:'#fcd34d', color:'#92400e', text:'⚠️ Tuesday spike to 2,100 kcal — consider prepping meals ahead to avoid overshoot.' },
          ].map((ins, i) => (
            <div key={i} style={{ background:ins.bg, border:`1px solid ${ins.border}`, borderRadius:8, padding:'10px 12px', fontSize:12, color:ins.color }}>{ins.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
