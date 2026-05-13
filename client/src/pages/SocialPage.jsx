import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from '../hooks/useToast';
import { CloudImg, SOCIAL_IMAGES, getAvatarColor } from '../data/cloudinaryAssets.jsx';

const SEED_POSTS = [
  { id:1, name:'Arjun K.', initials:'AK', time:'2h ago', content:'Just hit a new PR on deadlift — 160kg! Started at 100kg 6 months ago. Consistency is everything 💪', likes:14, liked:false, comments:3, image: SOCIAL_IMAGES.gym_post },
  { id:2, name:'Priya M.', initials:'PM', time:'4h ago', content:'Meal prepped for the whole week! 6 containers of chicken rice + veggies. Zero excuses now 🍱', likes:21, liked:false, comments:7, image: SOCIAL_IMAGES.meal_post },
  { id:3, name:'Rahul S.', initials:'RS', time:'Yesterday', content:'Completed 30-day step challenge: 12,000 steps every day. Down 2.5kg! Who else is joining next month?', likes:38, liked:false, comments:12, image: SOCIAL_IMAGES.progress1 },
  { id:4, name:'Sneha T.', initials:'ST', time:'2 days ago', content:'First time hitting 10k steps every day for 2 weeks straight! The Mi Band has been super helpful for tracking 🎯', likes:27, liked:false, comments:5, image: null },
];

const FRIENDS = [
  { name:'Arjun K.',  initials:'AK', streak:22, cal:2100, goal:'bulking' },
  { name:'Priya M.',  initials:'PM', streak:5,  cal:1650, goal:'cutting' },
  { name:'Rahul S.',  initials:'RS', streak:12, cal:1890, goal:'maintenance' },
  { name:'Sneha T.',  initials:'ST', streak:3,  cal:1720, goal:'cutting' },
];

export default function SocialPage() {
  const user = useSelector(s => s.auth.user);
  const toast = useToast();
  const [posts, setPosts] = useState(SEED_POSTS);
  const [newPost, setNewPost] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const me = { name: user?.name||'You', initials: (user?.name||'Me').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) };
  const leaderboard = [...FRIENDS, { ...me, streak: user?.streak||7, cal:1640, goal: user?.profile?.goal||'cutting' }].sort((a,b) => b.streak - a.streak);
  const medals = ['🥇','🥈','🥉'];

  const like = (id) => setPosts(p => p.map(x => x.id===id ? { ...x, likes: x.liked?x.likes-1:x.likes+1, liked:!x.liked } : x));

  const submitPost = () => {
    if (!newPost.trim()) return;
    setPosts(p => [{ id:Date.now(), name:me.name, initials:me.initials, time:'Just now', content:newPost, likes:0, liked:false, comments:0, image:null }, ...p]);
    setNewPost(''); setShowCompose(false);
    toast.success('Post shared! 🎉');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><div className="page-title">Community 👥</div><div className="text-sm text-muted mt-2">Share progress · Motivate friends</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(true)}>+ Share</button>
      </div>

      {/* Friends + Leaderboard */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="section-title">Your Friends ({FRIENDS.length})</div>
          {FRIENDS.map(f => (
            <div key={f.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border-light)' }}>
              <div className="avatar" style={{ width:30, height:30, fontSize:11, background: getAvatarColor(f.name), flexShrink:0 }}>{f.initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500 }}>{f.name}</div>
                <div style={{ fontSize:9, color:'var(--muted)' }}>🔥 {f.streak}-day streak · {f.goal}</div>
              </div>
              <div style={{ fontSize:10, color:'var(--green)', fontWeight:600 }}>{f.cal}kcal</div>
            </div>
          ))}
          <div style={{ marginTop:8 }}>
            <input className="input" placeholder="🔍 Find friends..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ fontSize:12 }}/>
            {searchQ && <div style={{ fontSize:12, color:'var(--muted)', padding:'6px 0' }}>No users found — invite them!</div>}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Weekly Leaderboard 🏆</div>
          {leaderboard.map((f,i) => (
            <div key={f.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0' }}>
              <div style={{ fontSize:14, width:20, textAlign:'center' }}>{medals[i] || `#${i+1}`}</div>
              <div className="avatar" style={{ width:26, height:26, fontSize:10, background: f.name===me.name ? 'var(--green)' : getAvatarColor(f.name), flexShrink:0 }}>{f.initials}</div>
              <div style={{ flex:1, fontSize:11, fontWeight: f.name===me.name?600:400 }}>{f.name === me.name ? 'You' : f.name}</div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>{f.streak}d 🔥</div>
            </div>
          ))}
        </div>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="card mb-4" style={{ border:'2px solid var(--green-100)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div className="avatar" style={{ width:34, height:34, fontSize:12, background:'var(--green)' }}>{me.initials}</div>
            <div style={{ fontSize:13, fontWeight:500 }}>{me.name}</div>
          </div>
          <textarea className="input textarea" rows={3} placeholder="Share a win, a meal, a PR, or a tip... 💪" value={newPost} onChange={e=>setNewPost(e.target.value)} autoFocus />
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary btn-sm" onClick={submitPost} disabled={!newPost.trim()}>🚀 Post</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>{ setShowCompose(false); setNewPost(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="section-title">Activity Feed</div>
      {posts.map(p => (
        <div key={p.id} className="card mb-3">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div className="avatar" style={{ width:36, height:36, fontSize:12, background: getAvatarColor(p.name) }}>{p.initials}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>{p.time}</div>
            </div>
          </div>
          <div style={{ fontSize:13, lineHeight:1.6, marginBottom:10 }}>{p.content}</div>
          {p.image && (
            <CloudImg src={p.image} alt="post" height={160} style={{ width:'100%', borderRadius:10, marginBottom:10 }} />
          )}
          <div style={{ display:'flex', gap:16 }}>
            <button style={{ fontSize:12, color:p.liked?'var(--red)':'var(--muted)', display:'flex', alignItems:'center', gap:4 }} onClick={()=>like(p.id)}>
              {p.liked?'❤️':'🤍'} {p.likes}
            </button>
            <button style={{ fontSize:12, color:'var(--muted)' }} onClick={()=>toast.info('Comments coming soon!')}>💬 {p.comments}</button>
            <button style={{ fontSize:12, color:'var(--muted)' }} onClick={()=>{ navigator.clipboard?.writeText(window.location.href); toast.info('Link copied!'); }}>🔗 Share</button>
          </div>
        </div>
      ))}
    </div>
  );
}
