import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE ──────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ufxlpdwdhakureadxfjw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeGxwZHdkaGFrdXJlYWR4Zmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDM3MDksImV4cCI6MjA5NTg3OTcwOX0.CmlyjbLnJRk72mtNClWe_CBcj4C56CLDhC2pd2fLgH8";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── PANTONE PALETTE ───────────────────────────────────────────────────────
const C = {
  pink:        "#e8c4c4",
  beige:       "#c4aa85",
  pinkDeep:    "#b87c8a",
  beigeDeep:   "#8a6e4a",
  pinkPale:    "#faf0f0",
  pinkSoft:    "#f5e2e2",
  beigePale:   "#faf5ed",
  beigeSoft:   "#f0e8d8",
  bg:          "#fdfaf8",
  bgCard:      "#ffffff",
  text:        "#2e2620",
  textMid:     "#7a6a5a",
  textLight:   "#b0a090",
  border:      "#ecddd4",
  heroBg1:     "#c4aa85",
  heroBg2:     "#b89e78",
};

const FONT_SANS  = "'Trebuchet MS', 'Gill Sans', 'Optima', sans-serif";
const FONT_SERIF = "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif";

const RANKS = [
  { min:5,  max:9,  label:"Beginner",             color:"#b8c8d4" },
  { min:10, max:14, label:"Explorer",              color:"#90b8cc" },
  { min:15, max:19, label:"Communicator",          color:"#88c4a8" },
  { min:20, max:24, label:"Advanced Communicator", color:"#c4aa85" },
  { min:25, max:25, label:"Native Friend",         color:"#e8c4c4" },
];

const SCORE_LABELS = [
  { en:"Did I understand them?",              ja:"相手の話を理解できた？" },
  { en:"Could I express myself?",             ja:"言いたいことを伝えられた？" },
  { en:"How many times did I ask to repeat?", ja:"聞き返した回数は？" },
  { en:"Translation app reliance",            ja:"翻訳アプリへの依存度" },
  { en:"Response speed in English",           ja:"英語で返答するスピード" },
];

const ADMIN_PASSWORD = "hapi2026";

const EMPTY_FORM = {
  name:"", nationality:"", flag:"🌍", date:"",
  scores:[3,3,3,3,3], photo:false, sns:false,
  new_word:"", new_phrase:"", new_slang:"", meaning:"", example:"",
  youtube_short:"",
};

const FLAG_OPTIONS = ["🇦🇺","🇺🇸","🇬🇧","🇨🇦","🇳🇿","🇮🇪","🇿🇦","🇯🇲","🇸🇬","🇵🇭","🇮🇳","🇳🇬","🇬🇭","🇰🇪","🇮🇩","🇹🇭","🇻🇳","🇫🇷","🇩🇪","🇪🇸","🇮🇹","🌍"];

const getRank = s => RANKS.find(r => s >= r.min && s <= r.max) || null;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const rank = getRank(d.total);
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)", fontFamily:FONT_SANS }}>
      <div style={{ fontSize:10, color:C.textLight, marginBottom:4 }}>#{d.id} · {d.date}</div>
      <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4, fontFamily:FONT_SERIF }}>{d.name} · {d.flag} {d.nationality}</div>
      <div style={{ fontSize:24, fontWeight:700, color:C.pinkDeep, fontFamily:"monospace" }}>{d.total}<span style={{ fontSize:12, color:C.textLight }}>/25</span></div>
      {rank && <div style={{ fontSize:10, color:rank.color, marginTop:4, letterSpacing:1 }}>{rank.label}</div>}
    </div>
  );
};

export default function App() {
  const [data, setData]           = useState([]);
  const [expanded, setExpanded]   = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [pwInput, setPwInput]     = useState("");
  const [pwError, setPwError]     = useState(false);
  const [authed, setAuthed]       = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── Load from Supabase
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("conversations")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      const parsed = (rows || []).map(r => ({
        ...r,
        scores: typeof r.scores === "string" ? JSON.parse(r.scores) : r.scores,
      }));
      setData(parsed);
    } catch (e) {
      setError("データの読み込みに失敗しました: " + e.message);
    }
    setLoading(false);
  };

  const avg    = data.length ? +(data.reduce((s,d)=>s+d.total,0)/data.length).toFixed(1) : 0;
  const best   = data.length ? Math.max(...data.map(d=>d.total)) : 0;
  const photos = data.filter(d=>d.photo).length;
  const sns    = data.filter(d=>d.sns).length;

  const tryLogin = () => {
    if (pwInput === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); }
  };

  const setScore = (i, v) => setForm(f => { const s=[...f.scores]; s[i]=v; return {...f, scores:s}; });
  const totalScore = form.scores.reduce((a,b)=>a+b,0);

  const saveEntry = async () => {
    setSaving(true);
    const today = form.date || new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit"});
    const payload = {
      chapter: 1,
      date: today,
      name: form.name,
      nationality: form.nationality,
      flag: form.flag,
      scores: JSON.stringify(form.scores),
      total: totalScore,
      photo: form.photo,
      sns: form.sns,
      new_word: form.new_word,
      new_phrase: form.new_phrase,
      new_slang: form.new_slang,
      meaning: form.meaning,
      example: form.example,
      youtube_short: form.youtube_short,
    };

    try {
      if (editId !== null) {
        const { error } = await supabase.from("conversations").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("conversations").insert([payload]);
        if (error) throw error;
      }
      await loadData();
      setForm({ ...EMPTY_FORM });
      setEditId(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert("保存失敗: " + e.message);
    }
    setSaving(false);
  };

  const startEdit = (row) => {
    setForm({
      ...row,
      scores: typeof row.scores === "string" ? JSON.parse(row.scores) : row.scores,
    });
    setEditId(row.id);
    setAdminOpen(true);
    setAuthed(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("削除する？")) return;
    await supabase.from("conversations").delete().eq("id", id);
    await loadData();
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT_SANS, color:C.textLight, fontSize:16 }}>
      Loading...
    </div>
  );

  return (
    <div style={S.root}>

      {/* ── ADMIN BUTTON ── */}
      <div style={S.adminToggle}>
        <button style={S.adminToggleBtn} onClick={() => { setAdminOpen(!adminOpen); if(!adminOpen && !authed){ setPwInput(""); setPwError(false); } }}>
          {adminOpen ? "✕ Close" : "🔒 Admin"}
        </button>
      </div>

      {/* ── ADMIN PANEL ── */}
      {adminOpen && (
        <div style={S.adminPanel}>
          {!authed ? (
            <div style={S.adminLogin}>
              <p style={S.adminTitle}>管理者ログイン</p>
              <div style={S.adminRow}>
                <input type="password" placeholder="Password" value={pwInput}
                  onChange={e=>setPwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryLogin()}
                  style={{ ...S.input, width:200 }}/>
                <button style={S.btnPrimary} onClick={tryLogin}>Enter</button>
              </div>
              {pwError && <p style={{ color:C.pinkDeep, fontSize:12, marginTop:8 }}>パスワードが違います</p>}
            </div>
          ) : (
            <div style={S.adminForm}>
              <p style={S.adminTitle}>{editId ? `✏️ Edit #${editId}` : "➕ New Entry"}</p>
              {saved && <div style={S.savedBanner}>✓ 保存しました！</div>}

              <div style={S.formGrid}>
                <div style={S.formField}>
                  <label style={S.label}>Name</label>
                  <input style={S.input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Jake"/>
                </div>
                <div style={S.formField}>
                  <label style={S.label}>Nationality</label>
                  <input style={S.input} value={form.nationality} onChange={e=>setForm({...form,nationality:e.target.value})} placeholder="Australia"/>
                </div>
                <div style={S.formField}>
                  <label style={S.label}>Flag</label>
                  <select style={S.input} value={form.flag} onChange={e=>setForm({...form,flag:e.target.value})}>
                    {FLAG_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div style={S.formField}>
                  <label style={S.label}>Date (MM/DD)</label>
                  <input style={S.input} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} placeholder="06/12"/>
                </div>
              </div>

              <div style={S.formSection}>
                <p style={S.formSectionTitle}>English Score &nbsp;<span style={{ color:C.pinkDeep, fontFamily:"monospace", fontSize:16 }}>{totalScore}/25</span></p>
                <div style={S.scoreInputGrid}>
                  {SCORE_LABELS.map((item,i)=>(
                    <div key={i} style={S.scoreInputItem}>
                      <label style={S.label}><span style={{ color:C.textLight }}>0{i+1}</span> {item.ja}</label>
                      <div style={S.starRow}>
                        {[1,2,3,4,5].map(v=>(
                          <button key={v} style={{ ...S.starBtn, background: v<=form.scores[i] ? C.pinkDeep : C.pinkSoft, color: v<=form.scores[i] ? "#fff" : C.textLight }}
                            onClick={()=>setScore(i,v)}>{v}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.formSection}>
                <div style={S.checkRow}>
                  <label style={S.checkLabel}><input type="checkbox" checked={form.photo} onChange={e=>setForm({...form,photo:e.target.checked})} style={{ marginRight:6 }}/>📸 Photo together</label>
                  <label style={S.checkLabel}><input type="checkbox" checked={form.sns} onChange={e=>setForm({...form,sns:e.target.checked})} style={{ marginRight:6 }}/>📱 SNS exchange</label>
                </div>
              </div>

              <div style={S.formSection}>
                <p style={S.formSectionTitle}>Today's New English</p>
                <div style={S.formGrid}>
                  <div style={S.formField}><label style={S.label}>Word</label><input style={S.input} value={form.new_word} onChange={e=>setForm({...form,new_word:e.target.value})} placeholder="arvo"/></div>
                  <div style={S.formField}><label style={S.label}>Phrase</label><input style={S.input} value={form.new_phrase} onChange={e=>setForm({...form,new_phrase:e.target.value})} placeholder="no worries"/></div>
                  <div style={S.formField}><label style={S.label}>Slang</label><input style={S.input} value={form.new_slang} onChange={e=>setForm({...form,new_slang:e.target.value})} placeholder="reckon"/></div>
                  <div style={S.formField}><label style={S.label}>Meaning</label><input style={S.input} value={form.meaning} onChange={e=>setForm({...form,meaning:e.target.value})} placeholder="think / believe"/></div>
                </div>
                <div style={{ marginTop:10 }}>
                  <label style={S.label}>Example sentence</label>
                  <input style={{ ...S.input, width:"100%", boxSizing:"border-box" }} value={form.example} onChange={e=>setForm({...form,example:e.target.value})} placeholder="I reckon we should go to the beach."/>
                </div>
                <div style={{ marginTop:10 }}>
                  <label style={S.label}>YouTube Short URL (optional)</label>
                  <input style={{ ...S.input, width:"100%", boxSizing:"border-box" }} value={form.youtube_short} onChange={e=>setForm({...form,youtube_short:e.target.value})} placeholder="https://youtube.com/shorts/..."/>
                </div>
              </div>

              <div style={S.formActions}>
                <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={saveEntry} disabled={saving}>
                  {saving ? "保存中..." : saved ? "✓ Saved!" : editId ? "Update" : "Save Entry"}
                </button>
                {editId && <button style={S.btnSecondary} onClick={()=>{setForm({...EMPTY_FORM});setEditId(null);}}>Cancel</button>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HERO ── */}
      <header style={S.hero}>
        <div style={S.heroInner}>
          <p style={S.eyebrow}>海外を暮らすように旅をする &nbsp;·&nbsp; Living abroad, traveling the world</p>
          <h1 style={S.heroTitle}><em style={S.accent}>BAD</em> ENGLISH,<br/><em style={S.accent}>BIGGER</em> WORLD!</h1>
          <p style={S.heroCopy}>Even imperfect English can open the world — if you dare to speak.<span style={S.heroCopyJa}>不完全な英語でも一歩踏み出して、世界を広げていく。</span></p>
          <div style={S.chips}>
            {["✈︎  Journey starts 2026.6.11","Bali → World","100 Native Speakers Challenge"].map(t=>(
              <span key={t} style={S.chip}>{t}</span>
            ))}
          </div>
        </div>
        <div style={S.heroDeco}>100</div>
      </header>

      {/* ── STATS ── */}
      <div style={S.statsRow}>
        {[
          { val:`${data.length}`, unit:"/100+", en:"People Met",    ja:"出会った人" },
          { val:`${avg}`,         unit:"/25",   en:"Avg Score",      ja:"平均スコア" },
          { val:`${best}`,        unit:"/25",   en:"Best Score",     ja:"最高スコア" },
          { val:`${photos}`,      unit:"",      en:"📸 Photos",      ja:"写真撮影" },
          { val:`${sns}`,         unit:"",      en:"📱 SNS Exchange", ja:"SNS交換" },
        ].map((s,i,arr)=>(
          <div key={i} style={{ ...S.statBox, borderRight: i<arr.length-1 ? `1px solid ${C.border}` : "none" }}>
            <div style={S.statVal}>{s.val}<span style={S.statUnit}>{s.unit}</span></div>
            <div style={S.statEn}>{s.en}</div>
            <div style={S.statJa}>{s.ja}</div>
          </div>
        ))}
      </div>

      {/* ── CONCEPT ── */}
      <section style={S.conceptSection}>
        <div style={S.conceptGrid}>
          <div style={S.conceptLeft}>
            <blockquote style={S.quote}>"Even imperfect English<br/>can open the world."<span style={S.quoteJa}>英語はツール、目的は世界を広げること。</span></blockquote>
          </div>
          <div style={S.conceptRight}>
            <p style={S.conceptBody}>Meet new people. Touch new values. See new landscapes.<br/>Talk to 100+ native speakers and watch the world expand.</p>
            <p style={S.conceptBodyJa}>新しい人と出会い、新しい価値観に触れ、新しい景色を見る。<br/>100人以上のネイティブと話して、世界を広げていく。</p>
            <div style={S.goals}>
              {[["Meet new people","新しい人と出会う"],["Discover new perspectives","新しい価値観に触れる"],["See new landscapes","新しい景色を見る"],["Prove growth with data","英語力を数値で証明する"]].map(([en,ja])=>(
                <div key={en} style={S.goalRow}><span style={S.goalDot}/><span style={S.goalEn}>{en}</span><span style={S.goalJa}>{ja}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SCORE SYSTEM ── */}
      <section style={S.section}>
        <Heading en="English Score System" ja="採点システム" />
        <div style={S.scoreCards}>
          {SCORE_LABELS.map((item,i)=>(
            <div key={i} style={{ ...S.scoreCard, background: i%2===0 ? C.pinkSoft : C.beigeSoft }}>
              <div style={S.scNum}>0{i+1}</div>
              <div style={S.scEn}>{item.en}</div>
              <div style={S.scJa}>{item.ja}</div>
              <div style={S.scStars}>★ 1–5</div>
            </div>
          ))}
          <div style={{ ...S.scoreCard, background:`linear-gradient(135deg,${C.pink},${C.beige})` }}>
            <div style={{ ...S.scNum, color:"#fff" }}>Σ</div>
            <div style={{ ...S.scEn, color:"#fff" }}>Total Score</div>
            <div style={{ ...S.scJa, color:"rgba(255,255,255,0.7)" }}>合計スコア</div>
            <div style={{ ...S.scStars, color:"#fff", fontWeight:700 }}>25 pts max</div>
          </div>
        </div>
        <div style={S.rankRow}>
          {RANKS.map(r=>(
            <div key={r.label} style={{ ...S.rankTag, borderColor:r.color, color:r.color }}>
              <span style={S.rankRange}>{r.min}–{r.max}</span>
              <span style={S.rankLbl}>{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── GROWTH GRAPH ── */}
      {data.length > 0 && (
        <section style={S.graphSection}>
          <div style={{ maxWidth:1060, margin:"0 auto" }}>
            <Heading en="Score Growth" ja="スコアの推移 — 成長を数値で見る" />
            <div style={S.graphCard}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.map(d=>({...d,label:`#${d.id}`}))} margin={{ top:10, right:40, left:0, bottom:10 }}>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 4" vertical={false}/>
                  <XAxis dataKey="label" tick={{ fontFamily:FONT_SANS, fontSize:11, fill:C.textLight }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,25]} ticks={[0,5,10,15,20,25]} tick={{ fontFamily:"monospace", fontSize:11, fill:C.textLight }} axisLine={false} tickLine={false} width={28}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <ReferenceLine y={avg} stroke={C.beige} strokeDasharray="6 3"
                    label={{ value:`avg ${avg}`, position:"right", fontSize:10, fill:C.beigeDeep, fontFamily:"monospace" }}/>
                  <Line type="monotone" dataKey="total" stroke={C.pinkDeep} strokeWidth={2.5}
                    dot={{ fill:C.pink, stroke:C.pinkDeep, strokeWidth:2, r:5 }}
                    activeDot={{ r:7, fill:C.pinkDeep, stroke:"#fff", strokeWidth:2 }}/>
                </LineChart>
              </ResponsiveContainer>
              <p style={S.graphNote}>Each dot = one conversation. &nbsp; Dashed line = current average ({avg}/25).<span style={S.graphNoteJa}>　点ひとつが1回の会話 · 破線が現在の平均スコア</span></p>
            </div>
          </div>
        </section>
      )}

      {/* ── CHAPTER 1 ── */}
      <section style={S.section}>
        <Heading en="Chapter 1 — Bali, Indonesia 🇮🇩" ja="第1章・バリ島" />
        <div style={S.chMeta}>
          <span style={S.chPeriod}>2026.6.11 –&nbsp;&nbsp; Goal: 30 people</span>
          <div style={S.progWrap}>
            <div style={S.progTrack}><div style={{ ...S.progFill, width:`${Math.min(100,(data.length/30)*100)}%` }}/></div>
            <span style={S.progTxt}>{data.length} / 30</span>
          </div>
        </div>

        {data.length === 0 ? (
          <div style={S.emptyState}>
            <p style={S.emptyIcon}>🌍</p>
            <p style={S.emptyText}>The journey hasn't started yet. &nbsp; 旅はまだ始まっていない。</p>
            <p style={S.emptySubtext}>First conversation coming 2026.6.11 ✈︎</p>
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr style={{ background:C.pinkSoft }}>
                  {[["#",""],["Date","日付"],["Name","名前"],["From","出身"],["Score","スコア"],["Rank","ランク"],["📸",""],["📱",""],["Short","動画"],["",""]].map(([en,ja],i)=>(
                    <th key={i} style={S.th}>{en}{ja && <span style={S.thJa}>{ja}</span>}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row=>{
                  const rank = getRank(row.total);
                  const open = expanded === row.id;
                  const scores = typeof row.scores === "string" ? JSON.parse(row.scores) : row.scores;
                  return (
                    <>
                      <tr key={row.id} style={{ ...S.tr, background: open ? C.pinkPale : "transparent", cursor:"pointer" }}
                        onClick={()=>setExpanded(open ? null : row.id)}>
                        <td style={S.td}><span style={S.tdN}>{row.id}</span></td>
                        <td style={S.td}><span style={S.tdDate}>{row.date}</span></td>
                        <td style={S.td}><strong style={S.tdName}>{row.name}</strong></td>
                        <td style={S.td}>{row.flag} {row.nationality}</td>
                        <td style={S.td}><span style={S.tdScore}>{row.total}</span><span style={S.tdScoreMax}>/25</span></td>
                        <td style={S.td}>{rank && <span style={{ ...S.pill, color:rank.color, borderColor:rank.color+"77", background:rank.color+"18" }}>{rank.label}</span>}</td>
                        <td style={{ ...S.td, textAlign:"center" }}>{row.photo ? <span style={S.chk}>✓</span> : <span style={S.dsh}>–</span>}</td>
                        <td style={{ ...S.td, textAlign:"center" }}>{row.sns   ? <span style={S.chk}>✓</span> : <span style={S.dsh}>–</span>}</td>
                        <td style={S.td}>{row.youtube_short ? <a href={row.youtube_short} style={S.playBtn} onClick={e=>e.stopPropagation()}>▶</a> : <span style={S.dsh}>–</span>}</td>
                        <td style={S.td} onClick={e=>e.stopPropagation()}>
                          {authed && <>
                            <button style={S.editBtn} onClick={()=>startEdit(row)}>✏️</button>
                            <button style={S.delBtn}  onClick={()=>deleteEntry(row.id)}>✕</button>
                          </>}
                        </td>
                      </tr>
                      {open && (
                        <tr key={`${row.id}-exp`}>
                          <td colSpan={10} style={S.expCell}>
                            <div style={S.expInner}>
                              <div>
                                <p style={S.expHead}>Score Breakdown <span style={S.expHeadJa}>スコア内訳</span></p>
                                <div style={S.bdWrap}>
                                  {SCORE_LABELS.map((item,i)=>(
                                    <div key={i} style={S.bdRow}>
                                      <span style={S.bdIdx}>0{i+1}</span>
                                      <div><div style={S.bdEn}>{item.en}</div><div style={S.bdJa}>{item.ja}</div></div>
                                      <Dots value={scores[i]}/>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p style={S.expHead}>Today's New English <span style={S.expHeadJa}>今日覚えた言葉</span></p>
                                <div style={S.newRow}>
                                  {[["Word",row.new_word,C.pinkSoft],["Phrase",row.new_phrase,C.beigeSoft],["Slang",row.new_slang,C.pinkPale]].map(([t,v,bg])=>(
                                    <div key={t} style={{ ...S.newCard, background:bg }}>
                                      <span style={S.newType}>{t}</span>
                                      <span style={S.newVal}>{v}</span>
                                    </div>
                                  ))}
                                </div>
                                <div style={S.exBox}>
                                  <span style={S.exMeaning}>"{row.meaning}"</span>
                                  <span style={S.exLine}>{row.example}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── SLANG DICTIONARY ── */}
      {data.length > 0 && (
        <section style={S.slangSection}>
          <div style={{ maxWidth:1060, margin:"0 auto" }}>
            <Heading en="Slang Dictionary" ja="スラング辞典 — 旅で出会った言葉たち" />
            <p style={S.slangIntro}>Every word collected from real conversations on the road.</p>
            <div style={S.slangGrid}>
              {data.map((row,i)=>{
                const bgs=[C.pinkSoft,C.beigeSoft,C.pinkPale,C.beigePale];
                return (
                  <div key={row.id} style={{ ...S.slangCard, background:bgs[i%bgs.length] }}>
                    <div style={S.slangWord}>{row.new_slang}</div>
                    <div style={S.slangMeaning}>{row.meaning}</div>
                    <div style={S.slangEx}>"{row.example}"</div>
                    <div style={S.slangFrom}>{row.flag} {row.name} · {row.nationality}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <span style={S.footerBrand}>BAD ENGLISH, BIGGER WORLD!</span>
        <span style={S.footerSub}>© Hapi · 2026</span>
      </footer>

    </div>
  );
}

function Heading({ en, ja }) {
  return (
    <div style={{ marginBottom:32 }}>
      <h2 style={{ fontFamily:FONT_SERIF, fontSize:22, fontWeight:600, color:C.text, margin:"0 0 4px" }}>{en}</h2>
      <p style={{ fontFamily:FONT_SANS, fontSize:11, color:C.textLight, margin:"0 0 16px", letterSpacing:1 }}>{ja}</p>
      <div style={{ height:1, background:`linear-gradient(90deg,${C.pink},${C.beige},transparent)` }}/>
    </div>
  );
}

function Dots({ value }) {
  return (
    <div style={{ display:"flex", gap:5, alignItems:"center" }}>
      {[1,2,3,4,5].map(i=>(
        <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.pinkDeep, opacity: i<=value ? 1 : 0.2 }}/>
      ))}
      <span style={{ fontFamily:"monospace", fontSize:11, color:C.textLight, marginLeft:4 }}>{value}</span>
    </div>
  );
}

const S = {
  root: { minHeight:"100vh", background:C.bg, color:C.text, fontFamily:FONT_SANS, overflowX:"hidden" },
  adminToggle: { position:"fixed", top:16, right:16, zIndex:1000 },
  adminToggleBtn: { fontFamily:FONT_SANS, fontSize:11, letterSpacing:1, background:"#fff", border:`1px solid ${C.border}`, color:C.textMid, padding:"8px 16px", borderRadius:20, cursor:"pointer", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" },
  adminPanel: { background:"#fff", borderBottom:`2px solid ${C.pink}`, padding:"32px 40px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" },
  adminLogin: { maxWidth:400 },
  adminForm: { maxWidth:860 },
  adminTitle: { fontFamily:FONT_SERIF, fontSize:18, fontWeight:600, color:C.text, marginBottom:20 },
  adminRow: { display:"flex", gap:10, alignItems:"center" },
  savedBanner: { background:C.pinkSoft, border:`1px solid ${C.pink}`, borderRadius:6, padding:"10px 16px", marginBottom:16, fontSize:13, color:C.pinkDeep, fontFamily:FONT_SANS },
  formGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 },
  formField: { display:"flex", flexDirection:"column", gap:4 },
  formSection: { marginTop:20 },
  formSectionTitle: { fontFamily:FONT_SANS, fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.pinkDeep, marginBottom:12 },
  label: { fontFamily:FONT_SANS, fontSize:10, letterSpacing:1, textTransform:"uppercase", color:C.textLight },
  input: { fontFamily:FONT_SANS, fontSize:13, color:C.text, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 10px", outline:"none", background:"#fff" },
  scoreInputGrid: { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 },
  scoreInputItem: { display:"flex", flexDirection:"column", gap:6 },
  starRow: { display:"flex", gap:4 },
  starBtn: { width:28, height:28, borderRadius:6, border:"none", cursor:"pointer", fontFamily:"monospace", fontSize:12, fontWeight:700 },
  checkRow: { display:"flex", gap:24 },
  checkLabel: { fontFamily:FONT_SANS, fontSize:13, color:C.text, cursor:"pointer", display:"flex", alignItems:"center" },
  formActions: { marginTop:20, display:"flex", gap:10 },
  btnPrimary: { fontFamily:FONT_SANS, fontSize:13, fontWeight:600, background:C.pinkDeep, color:"#fff", border:"none", borderRadius:6, padding:"10px 24px", cursor:"pointer" },
  btnSecondary: { fontFamily:FONT_SANS, fontSize:13, background:"transparent", color:C.textMid, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 20px", cursor:"pointer" },
  hero: { position:"relative", background:`linear-gradient(150deg, ${C.heroBg1} 0%, ${C.heroBg2} 60%, #c4aa85 100%)`, color:"#2e2016", padding:"88px 60px 76px", overflow:"hidden" },
  heroInner: { position:"relative", zIndex:2, maxWidth:780 },
  heroDeco: { position:"absolute", right:-20, top:"50%", transform:"translateY(-50%)", fontSize:260, fontWeight:900, fontFamily:FONT_SERIF, color:`${C.pinkDeep}10`, lineHeight:1, userSelect:"none", zIndex:1, letterSpacing:-14 },
  eyebrow: { fontFamily:FONT_SANS, fontSize:11, letterSpacing:3, textTransform:"uppercase", color:C.pinkSoft, marginBottom:18 },
  heroTitle: { fontFamily:FONT_SERIF, fontSize:"clamp(48px,7.5vw,84px)", fontWeight:600, lineHeight:1.04, margin:"0 0 22px", letterSpacing:-1, color:"#2e2016" },
  accent: { color:C.pinkSoft, fontStyle:"italic" },
  heroCopy: { fontFamily:FONT_SANS, fontSize:15, lineHeight:1.9, color:"#5a4030", margin:"0 0 28px" },
  heroCopyJa: { display:"block", marginTop:6, fontSize:12, color:"#7a6040" },
  chips: { display:"flex", gap:8, flexWrap:"wrap" },
  chip: { fontFamily:"monospace", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", border:`1px solid ${C.pinkSoft}99`, padding:"5px 14px", color:C.pinkSoft, borderRadius:2 },
  statsRow: { display:"flex", background:C.bgCard, borderBottom:`1px solid ${C.border}` },
  statBox: { flex:1, padding:"26px 16px", textAlign:"center" },
  statVal: { fontFamily:"monospace", fontSize:32, fontWeight:700, color:C.text },
  statUnit: { fontSize:13, color:C.textLight, fontWeight:400 },
  statEn: { fontFamily:FONT_SANS, fontSize:10, letterSpacing:2, textTransform:"uppercase", color:C.textLight, marginTop:4 },
  statJa: { fontFamily:FONT_SANS, fontSize:10, color:C.beige, marginTop:2 },
  conceptSection: { borderBottom:`1px solid ${C.border}` },
  conceptGrid: { display:"grid", gridTemplateColumns:"1fr 1fr" },
  conceptLeft: { padding:"56px 50px", background:`linear-gradient(150deg, ${C.heroBg1}, ${C.heroBg2})`, display:"flex", alignItems:"center" },
  quote: { fontFamily:FONT_SERIF, fontSize:20, fontStyle:"italic", color:"#2e2016", lineHeight:1.7, margin:0 },
  quoteJa: { display:"block", marginTop:12, fontFamily:FONT_SANS, fontSize:11, color:"#7a6040", fontStyle:"normal" },
  conceptRight: { padding:"56px 50px", background:C.bgCard },
  conceptBody: { fontFamily:FONT_SANS, fontSize:14, lineHeight:2, color:C.text, margin:"0 0 10px" },
  conceptBodyJa: { fontFamily:FONT_SANS, fontSize:12, lineHeight:2, color:C.textMid, margin:"0 0 28px" },
  goals: { display:"flex", flexDirection:"column", gap:10 },
  goalRow: { display:"flex", alignItems:"center", gap:12 },
  goalDot: { width:7, height:7, borderRadius:"50%", background:C.pink, flexShrink:0 },
  goalEn: { fontFamily:FONT_SANS, fontSize:13, color:C.text, minWidth:180 },
  goalJa: { fontFamily:FONT_SANS, fontSize:11, color:C.textLight },
  section: { maxWidth:1060, margin:"0 auto", padding:"56px 40px" },
  scoreCards: { display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:20 },
  scoreCard: { border:`1px solid ${C.border}`, padding:"20px 14px", borderRadius:8 },
  scNum: { fontFamily:"monospace", fontSize:26, fontWeight:700, color:`${C.beige}80`, marginBottom:10 },
  scEn: { fontFamily:FONT_SANS, fontSize:11, color:C.text, lineHeight:1.5, marginBottom:4 },
  scJa: { fontFamily:FONT_SANS, fontSize:10, color:C.textLight, lineHeight:1.5, marginBottom:12 },
  scStars: { fontFamily:"monospace", fontSize:11, color:C.pinkDeep },
  rankRow: { display:"flex", gap:8, flexWrap:"wrap" },
  rankTag: { border:"1px solid", padding:"7px 14px", borderRadius:20, display:"flex", flexDirection:"column", alignItems:"center" },
  rankRange: { fontFamily:"monospace", fontSize:12, fontWeight:700 },
  rankLbl: { fontFamily:FONT_SANS, fontSize:9, letterSpacing:1, marginTop:2 },
  graphSection: { background:C.beigePale, padding:"50px 40px", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` },
  graphCard: { background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:"28px 20px 16px" },
  graphNote: { fontFamily:FONT_SANS, fontSize:11, color:C.textLight, textAlign:"center", marginTop:12 },
  graphNoteJa: { fontSize:10, color:C.beige },
  emptyState: { textAlign:"center", padding:"60px 0", border:`2px dashed ${C.border}`, borderRadius:12 },
  emptyIcon: { fontSize:40, marginBottom:12 },
  emptyText: { fontFamily:FONT_SERIF, fontSize:16, color:C.textMid, margin:"0 0 8px" },
  emptySubtext: { fontFamily:FONT_SANS, fontSize:12, color:C.textLight },
  chMeta: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
  chPeriod: { fontFamily:"monospace", fontSize:12, color:C.textLight, letterSpacing:1 },
  progWrap: { display:"flex", alignItems:"center", gap:12 },
  progTrack: { width:180, height:4, background:C.pinkSoft, borderRadius:2 },
  progFill: { height:"100%", borderRadius:2, background:`linear-gradient(90deg,${C.pink},${C.beige})`, transition:"width 0.6s ease" },
  progTxt: { fontFamily:"monospace", fontSize:12, color:C.textLight },
  tableWrap: { overflowX:"auto", borderRadius:8, border:`1px solid ${C.border}` },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { padding:"11px 14px", fontFamily:FONT_SANS, fontSize:10, letterSpacing:2, textTransform:"uppercase", color:C.textMid, textAlign:"left", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" },
  thJa: { display:"block", fontSize:9, color:C.textLight, letterSpacing:0.5, marginTop:2 },
  tr: { borderBottom:`1px solid ${C.pinkPale}`, transition:"background 0.15s" },
  td: { padding:"13px 14px", fontFamily:FONT_SANS, fontSize:13, color:C.text, verticalAlign:"middle" },
  tdN: { fontFamily:"monospace", fontSize:11, color:C.textLight },
  tdDate: { fontFamily:"monospace", fontSize:11, color:C.textLight },
  tdName: { fontWeight:600, color:C.text },
  tdScore: { fontFamily:"monospace", fontSize:20, fontWeight:700, color:C.pinkDeep },
  tdScoreMax: { fontFamily:"monospace", fontSize:11, color:C.textLight },
  pill: { fontFamily:FONT_SANS, fontSize:10, border:"1px solid", padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap" },
  chk: { color:"#88c4a8", fontWeight:700 },
  dsh: { color:C.border },
  playBtn: { fontFamily:FONT_SANS, fontSize:12, color:C.pinkDeep, textDecoration:"none", border:`1px solid ${C.pink}`, padding:"3px 10px", borderRadius:3 },
  editBtn: { background:"transparent", border:"none", cursor:"pointer", fontSize:14, marginRight:4 },
  delBtn: { background:"transparent", border:"none", cursor:"pointer", fontSize:12, color:C.textLight },
  expCell: { padding:0, background:C.pinkPale, borderBottom:`2px solid ${C.pink}` },
  expInner: { padding:"24px 28px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 },
  expHead: { fontFamily:FONT_SANS, fontSize:10, letterSpacing:3, textTransform:"uppercase", color:C.pinkDeep, marginBottom:16 },
  expHeadJa: { fontSize:10, color:C.textLight, letterSpacing:0.5 },
  bdWrap: { display:"flex", flexDirection:"column", gap:10 },
  bdRow: { display:"grid", gridTemplateColumns:"24px 1fr auto", gap:10, alignItems:"center" },
  bdIdx: { fontFamily:"monospace", fontSize:10, color:C.textLight },
  bdEn: { fontFamily:FONT_SANS, fontSize:11, color:C.text },
  bdJa: { fontFamily:FONT_SANS, fontSize:10, color:C.textLight },
  newRow: { display:"flex", gap:8, marginBottom:10 },
  newCard: { flex:1, border:`1px solid ${C.border}`, padding:"10px 12px", borderRadius:6 },
  newType: { display:"block", fontFamily:FONT_SANS, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:C.textLight, marginBottom:4 },
  newVal: { fontFamily:FONT_SERIF, fontSize:16, fontWeight:600, color:C.pinkDeep },
  exBox: { background:C.bgCard, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.pink}`, padding:"10px 14px", borderRadius:"0 6px 6px 0", display:"flex", flexDirection:"column", gap:4 },
  exMeaning: { fontFamily:FONT_SANS, fontSize:11, color:C.textLight, fontStyle:"italic" },
  exLine: { fontFamily:FONT_SANS, fontSize:13, color:C.text },
  slangSection: { background:C.beigeSoft, padding:"50px 40px", borderTop:`1px solid ${C.border}` },
  slangIntro: { fontFamily:FONT_SANS, fontSize:12, color:C.textLight, fontStyle:"italic", marginBottom:24 },
  slangGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 },
  slangCard: { border:`1px solid ${C.border}`, padding:"20px 18px", borderRadius:8 },
  slangWord: { fontFamily:FONT_SERIF, fontSize:22, fontWeight:600, color:C.pinkDeep, marginBottom:6 },
  slangMeaning: { fontFamily:FONT_SANS, fontSize:13, color:C.text, marginBottom:8, fontWeight:500 },
  slangEx: { fontFamily:FONT_SANS, fontSize:11, color:C.textLight, fontStyle:"italic", marginBottom:12, lineHeight:1.6 },
  slangFrom: { fontFamily:FONT_SANS, fontSize:10, color:C.beige, letterSpacing:1 },
  footer: { padding:"32px 60px", background:`linear-gradient(150deg, ${C.heroBg1}, ${C.heroBg2})`, display:"flex", justifyContent:"space-between", alignItems:"center" },
  footerBrand: { fontFamily:FONT_SERIF, fontSize:15, fontWeight:600, color:C.pinkSoft, fontStyle:"italic" },
  footerSub: { fontFamily:FONT_SANS, fontSize:11, color:"#7a6040", letterSpacing:2 },
};
