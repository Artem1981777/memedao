import { useState, useEffect } from "react"
import { TrendingUp, Trophy, Brain, Flame, RefreshCw, Share2 } from "lucide-react"

const CLAUDE_API = "/api/claude"

interface Meme {
  id: string
  title: string
  description: string
  imagePrompt: string
  imageUrl: string
  viralScore: number
  prediction: string
  category: string
  bets: { bull: number; bear: number }
  userBet: "bull" | "bear" | null
  result: "viral" | "dead" | null
  timeLeft: number
  createdAt: number
  autopsy: string
  tags: string[]
}

interface LeaderEntry {
  address: string
  wins: number
  totalBet: number
  profit: number
  accuracy: number
}

const CATEGORIES = ["Politics", "Crypto", "Gaming", "Pop Culture", "Sports", "Tech", "Animals"]

const MOCK_MEMES: Meme[] = [
  {
    id: "1",
    title: "AI Takes My Job (But Pays Rent)",
    description: "The meme format where AI replaces workers but somehow also becomes their landlord",
    imagePrompt: "robot landlord collecting rent from human tenant cartoon",
    imageUrl: "https://image.pollinations.ai/prompt/robot+landlord+collecting+rent+from+human+tenant+meme+style+funny?width=400&height=400&nologo=true&seed=111",
    viralScore: 87,
    prediction: "Will reach 500k shares in 48 hours based on AI job anxiety trends",
    category: "Tech",
    bets: { bull: 2340, bear: 890 },
    userBet: null,
    result: null,
    timeLeft: 47,
    createdAt: Date.now() - 3600000,
    autopsy: "",
    tags: ["AI", "Jobs", "Economy", "Relatable"]
  },
  {
    id: "2",
    title: "Bitcoin Pizza Guy's Regret",
    description: "The eternal format of early crypto decisions haunting people forever",
    imagePrompt: "man crying eating pizza with bitcoin price chart background",
    imageUrl: "https://image.pollinations.ai/prompt/man+crying+eating+pizza+bitcoin+price+chart+background+meme?width=400&height=400&nologo=true&seed=222",
    viralScore: 92,
    prediction: "Peak virality expected when BTC reaches new ATH — format will explode",
    category: "Crypto",
    bets: { bull: 5670, bear: 1230 },
    userBet: null,
    result: "viral",
    timeLeft: 0,
    createdAt: Date.now() - 86400000,
    autopsy: "Called it! BTC hit $95k and this format spread across 50+ countries. Viral score: 94/100",
    tags: ["Bitcoin", "Regret", "Pizza", "Crypto"]
  },
  {
    id: "3",
    title: "Wojak Discovers AI Art",
    description: "Artists vs AI debate expressed through the universal Wojak format",
    imagePrompt: "wojak artist vs robot drawing competition funny meme",
    imageUrl: "https://image.pollinations.ai/prompt/wojak+artist+versus+robot+ai+art+competition+meme+cartoon?width=400&height=400&nologo=true&seed=333",
    viralScore: 65,
    prediction: "Moderate viral potential — debate fatigue may limit spread",
    category: "Tech",
    bets: { bull: 1200, bear: 1800 },
    userBet: null,
    result: null,
    timeLeft: 23,
    createdAt: Date.now() - 7200000,
    autopsy: "",
    tags: ["AI Art", "Wojak", "Artists", "Debate"]
  },
  {
    id: "4",
    title: "Pepe Sees Trump Trade Policy",
    description: "Classic Pepe reaction to geopolitical market chaos",
    imagePrompt: "pepe frog shocked watching stock market crash tariffs news",
    imageUrl: "https://image.pollinations.ai/prompt/pepe+frog+shocked+watching+stock+market+crash+tariffs+funny?width=400&height=400&nologo=true&seed=444",
    viralScore: 94,
    prediction: "HIGH ALERT: Trade war memes historically spike 300% during policy announcements",
    category: "Politics",
    bets: { bull: 8900, bear: 2100 },
    userBet: null,
    result: null,
    timeLeft: 12,
    createdAt: Date.now() - 1800000,
    autopsy: "",
    tags: ["Pepe", "Politics", "Trade War", "Market"]
  },
]

const LEADERBOARD: LeaderEntry[] = [
  { address: "0xCulture...Prophet", wins: 47, totalBet: 12500, profit: 8900, accuracy: 89 },
  { address: "0xMeme...Wizard", wins: 39, totalBet: 9800, profit: 6700, accuracy: 82 },
  { address: "0xViral...Hunter", wins: 31, totalBet: 7600, profit: 4200, accuracy: 76 },
  { address: "0xTrend...Sniper", wins: 28, totalBet: 6200, profit: 3100, accuracy: 71 },
]

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#00ff88" : score >= 60 ? "#ffaa00" : "#ff3366"
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8899bb", marginBottom: 2 }}>
        <span>Viral Potential</span>
        <span style={{ color, fontWeight: 700 }}>{score}/100</span>
      </div>
      <div style={{ background: "#1a1a2e", borderRadius: 3, height: 5 }}>
        <div style={{ background: score >= 80 ? "linear-gradient(90deg,#00ff88,#00ccaa)" : score >= 60 ? "linear-gradient(90deg,#ffaa00,#ff8800)" : "linear-gradient(90deg,#ff3366,#cc0033)", width: score + "%", height: 5, borderRadius: 3, transition: "width 1s" }} />
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<"radar"|"forecast"|"leaderboard"|"autopsy">("radar")
  const [memes, setMemes] = useState<Meme[]>(MOCK_MEMES)
  const [wallet, setWallet] = useState({ connected: false, address: "", balance: 0 })
  const [selected, setSelected] = useState<Meme | null>(null)
  const [betAmt, setBetAmt] = useState("0.01")
  const [notif, setNotif] = useState("")
  const [generating, setGenerating] = useState(false)
  const [_newForecast, setNewForecast] = useState<Meme | null>(null)
  const [totalProfit] = useState(0)

  const toast = (m: string) => { setNotif(m); setTimeout(() => setNotif(""), 3000) }

  useEffect(() => {
    const interval = setInterval(() => {
      setMemes(prev => prev.map(m => ({
        ...m,
        viralScore: Math.min(100, Math.max(10, m.viralScore + (Math.random() - 0.45) * 3)),
        bets: {
          bull: m.bets.bull + Math.floor(Math.random() * 50),
          bear: m.bets.bear + Math.floor(Math.random() * 20)
        },
        timeLeft: Math.max(0, m.timeLeft - 0.01)
      })))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  async function connectWallet() {
    const eth = (window as any).ethereum
    if (eth) {
      try {
        const accounts = await eth.request({ method: "eth_requestAccounts" })
        try {
          await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] })
        } catch {
          await eth.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x38", chainName: "BNB Chain", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpcUrls: ["https://bsc-dataseed.binance.org/"], blockExplorerUrls: ["https://bscscan.com"] }] })
        }
        const addr = accounts[0]
        setWallet({ connected: true, address: addr.slice(0,6)+"..."+addr.slice(-4), balance: +(Math.random()*2+0.5).toFixed(3) })
        toast("Connected to BNB Chain!")
      } catch {
        setWallet({ connected: true, address: "Demo...1234", balance: 1.5 })
        toast("Demo wallet connected!")
      }
    } else {
      setWallet({ connected: true, address: "Demo...1234", balance: 1.5 })
      toast("Install MetaMask for BNB Chain!")
    }
  }

  function placeBet(meme: Meme, side: "bull" | "bear") {
    if (!wallet.connected) { connectWallet(); return }
    const amt = parseFloat(betAmt)
    setMemes(prev => prev.map(m => m.id === meme.id ? { ...m, userBet: side, bets: { ...m.bets, [side]: m.bets[side] + amt * 1000 } } : m))
    if (selected?.id === meme.id) setSelected(prev => prev ? { ...prev, userBet: side } : null)
    toast(`${side === "bull" ? "🚀 Bullish" : "💀 Bearish"} bet placed! ${amt} BNB`)
    setWallet(w => ({ ...w, balance: +(w.balance - amt).toFixed(3) }))
  }

  async function generateForecast() {
    setGenerating(true)
    try {
      const res = await fetch(CLAUDE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: "You are MemeDAO AI, expert in predicting viral meme trends. Analyze internet culture and generate meme forecasts. Return JSON with: title, description, viralScore (0-100), prediction, category (from: Politics/Crypto/Gaming/Pop Culture/Sports/Tech/Animals), tags (array of 4 strings), imagePrompt (simple description for image generation).",
          messages: [{ role: "user", content: "Generate a viral meme forecast for today based on current internet trends. Be creative and specific." }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ""
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        const forecast: Meme = {
          id: Date.now().toString(),
          title: parsed.title || "AI Generated Meme",
          description: parsed.description || "AI predicted viral content",
          imagePrompt: parsed.imagePrompt || "funny meme",
          imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(parsed.imagePrompt || "funny viral meme")}?width=400&height=400&nologo=true&seed=${Math.floor(Math.random()*999)}`,
          viralScore: parsed.viralScore || 75,
          prediction: parsed.prediction || "Predicted to go viral",
          category: parsed.category || "Tech",
          bets: { bull: 0, bear: 0 },
          userBet: null,
          result: null,
          timeLeft: 48,
          createdAt: Date.now(),
          autopsy: "",
          tags: parsed.tags || ["AI", "Viral", "Meme", "Trend"]
        }
        setNewForecast(forecast)
        setMemes(prev => [forecast, ...prev])
        toast("🔮 New AI forecast generated!")
      }
    } catch {
      toast("Using trend analysis — AI unavailable")
      const fallback: Meme = {
        id: Date.now().toString(),
        title: "Trend Alert: " + CATEGORIES[Math.floor(Math.random()*CATEGORIES.length)],
        description: "AI detected emerging meme pattern based on social signals",
        imagePrompt: "trending meme viral content funny",
        imageUrl: `https://image.pollinations.ai/prompt/trending+viral+meme+funny+internet+culture?width=400&height=400&nologo=true&seed=${Math.floor(Math.random()*999)}`,
        viralScore: Math.floor(Math.random()*30)+60,
        prediction: "Moderate-high viral potential detected in next 48h",
        category: CATEGORIES[Math.floor(Math.random()*CATEGORIES.length)],
        bets: { bull: 0, bear: 0 },
        userBet: null,
        result: null,
        timeLeft: 48,
        createdAt: Date.now(),
        autopsy: "",
        tags: ["Trending", "AI", "Viral", "Culture"]
      }
      setMemes(prev => [fallback, ...prev])
    }
    setGenerating(false)
  }

  const S: Record<string, any> = {
    app: { minHeight: "100vh", background: "#050510", color: "#e8edf5", fontFamily: "sans-serif", paddingBottom: 64 },
    header: { background: "rgba(5,5,16,0.97)", borderBottom: "1px solid #1a1a3e", padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, zIndex: 50 },
    card: { background: "#0a0a1a", border: "1px solid #1a1a3e", borderRadius: 10, padding: 14, marginBottom: 8 },
    nav: { position: "fixed" as const, bottom: 0, left: 0, right: 0, background: "rgba(5,5,16,0.97)", borderTop: "1px solid #1a1a3e", display: "flex", height: 56, zIndex: 100 },
    navBtn: (a: boolean) => ({ flex: 1, background: "none", border: "none", color: a ? "#ff6b35" : "#4a5a7a", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 2, fontSize: 9, fontWeight: a ? 700 : 500 }),
    pill: (c: string) => ({ background: c+"20", border: `1px solid ${c}40`, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: c }),
    btnBull: { background: "linear-gradient(135deg,#00ff88,#00cc6a)", border: "none", borderRadius: 7, color: "#000", padding: "10px 16px", cursor: "pointer", fontWeight: 800, fontSize: 13 },
    btnBear: { background: "linear-gradient(135deg,#ff3366,#cc0033)", border: "none", borderRadius: 7, color: "#fff", padding: "10px 16px", cursor: "pointer", fontWeight: 800, fontSize: 13 },
    btnGhost: { background: "transparent", border: "1px solid #1a1a3e", borderRadius: 7, color: "#e8edf5", padding: "8px 14px", cursor: "pointer", fontSize: 12 },
    mono: { fontFamily: "monospace" } as React.CSSProperties,
  }

  const sorted = [...memes].sort((a, b) => b.viralScore - a.viralScore)
  const hotMemes = memes.filter(m => m.viralScore >= 80)
  const completedMemes = memes.filter(m => m.result)

  return (
    <div style={S.app}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {notif && <div style={{ position: "fixed" as const, top: 60, left: "50%", transform: "translateX(-50%)", background: "#0a0a1a", border: "1px solid #ff6b3540", borderRadius: 6, padding: "8px 18px", zIndex: 200, color: "#ff6b35", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" as const }}>{notif}</div>}

      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔮</span>
          <span style={{ fontWeight: 800, fontSize: 17 }}>MEME<span style={{ color: "#ff6b35" }}>DAO</span></span>
          <span style={S.pill("#ff6b35")}>BNB Chain</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {wallet.connected && <span style={{ ...S.pill("#00ff88"), ...S.mono }}>{wallet.balance} BNB</span>}
          <button style={{ ...S.btnGhost, fontSize: 11, padding: "4px 10px" }} onClick={connectWallet}>
            {wallet.connected ? wallet.address : "Connect"}
          </button>
        </div>
      </div>

      {/* RADAR PAGE */}
      {page === "radar" && (
        <div style={{ padding: 12 }}>
          {/* Stats */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {[
              { l: "Live Forecasts", v: memes.filter(m => !m.result).length, c: "#ff6b35" },
              { l: "Hot Memes", v: hotMemes.length, c: "#00ff88" },
              { l: "Total Bets", v: memes.reduce((s, m) => s + m.bets.bull + m.bets.bear, 0).toFixed(0), c: "#ffaa00" },
            ].map(s => (
              <div key={s.l} style={{ flex: 1, background: "#0a0a1a", border: `1px solid ${s.c}30`, borderRadius: 8, padding: "10px 8px", textAlign: "center" as const }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c, ...S.mono }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#4a5a7a" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Generate button */}
          <button onClick={generateForecast} disabled={generating} style={{ width: "100%", background: generating ? "#1a1a3e" : "linear-gradient(135deg,#ff6b35,#ff3366)", border: "none", borderRadius: 10, color: "#fff", padding: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {generating ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Analyzing trends...</> : <><Brain size={16} /> 🔮 Generate AI Forecast</>}
          </button>

          {/* Meme cards */}
          {sorted.map(m => (
            <div key={m.id} onClick={() => { setSelected(m); setPage("forecast") }} style={{ ...S.card, cursor: "pointer", border: m.viralScore >= 80 ? "1px solid #ff6b3540" : "1px solid #1a1a3e", position: "relative" as const, overflow: "hidden" }}>
              {m.viralScore >= 90 && <div style={{ position: "absolute", top: 0, right: 0, background: "linear-gradient(135deg,#ff6b35,#ff3366)", fontSize: 9, fontWeight: 700, color: "#fff", padding: "2px 8px", borderRadius: "0 0 0 6px" }}>🔥 ULTRA HOT</div>}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <img src={m.imageUrl} alt={m.title} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" as const, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/56x56/1a1a3e/ff6b35?text=MEME" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: "#8899bb", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{m.description}</div>
                  <ScoreBar score={Math.floor(m.viralScore)} />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={S.pill("#ff6b35")}>{m.category}</span>
                    {m.userBet && <span style={S.pill(m.userBet === "bull" ? "#00ff88" : "#ff3366")}>{m.userBet === "bull" ? "🚀 BULL" : "💀 BEAR"}</span>}
                    {m.result && <span style={S.pill(m.result === "viral" ? "#00ff88" : "#ff3366")}>{m.result === "viral" ? "✅ VIRAL" : "💀 DEAD"}</span>}
                    <span style={{ ...S.mono, fontSize: 10, color: "#4a5a7a", marginLeft: "auto" }}>{m.timeLeft > 0 ? `⏱ ${m.timeLeft.toFixed(0)}h left` : "RESOLVED"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORECAST DETAIL PAGE */}
      {page === "forecast" && selected && (
        <div style={{ padding: 12 }}>
          <div style={S.header}>
            <button onClick={() => setPage("radar")} style={{ background: "none", border: "none", color: "#8899bb", cursor: "pointer", fontSize: 20 }}>←</button>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Meme Forecast</span>
            <button onClick={() => { navigator.clipboard.writeText("Check out this meme forecast on MemeDAO!"); toast("Link copied!") }} style={{ background: "none", border: "none", color: "#8899bb", cursor: "pointer" }}><Share2 size={16} /></button>
          </div>

          <img src={selected.imageUrl} alt={selected.title} style={{ width: "100%", borderRadius: 12, marginBottom: 10, maxHeight: 220, objectFit: "cover" as const }} onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x220/1a1a3e/ff6b35?text=MEME+FORECAST" }} />

          <div style={S.card}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{selected.title}</div>
            <div style={{ fontSize: 12, color: "#8899bb", marginBottom: 10 }}>{selected.description}</div>
            <ScoreBar score={Math.floor(selected.viralScore)} />
            <div style={{ background: "#050510", borderRadius: 8, padding: 10, marginTop: 10, border: "1px solid #ff6b3520" }}>
              <div style={{ fontSize: 10, color: "#ff6b35", fontWeight: 700, marginBottom: 4 }}>🔮 AI PREDICTION</div>
              <div style={{ fontSize: 12, color: "#8899bb", lineHeight: 1.6 }}>{selected.prediction}</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" as const }}>
              {selected.tags.map((t, i) => <span key={i} style={S.pill("#8855ff")}>#{t}</span>)}
            </div>
          </div>

          {/* Betting */}
          {!selected.result && (
            <div style={S.card}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#4a5a7a", marginBottom: 10 }}>PLACE YOUR BET</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                <div style={{ flex: 1, textAlign: "center" as const }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#00ff88" }}>{(selected.bets.bull / (selected.bets.bull + selected.bets.bear + 1) * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: 10, color: "#4a5a7a" }}>🚀 BULL</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" as const }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ff3366" }}>{(selected.bets.bear / (selected.bets.bull + selected.bets.bear + 1) * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: 10, color: "#4a5a7a" }}>💀 BEAR</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {["0.01","0.05","0.1","0.5"].map(v => (
                  <button key={v} onClick={() => setBetAmt(v)} style={{ flex: 1, background: betAmt === v ? "#1a1a3e" : "transparent", border: `1px solid ${betAmt === v ? "#ff6b35" : "#1a1a3e"}`, borderRadius: 5, color: betAmt === v ? "#ff6b35" : "#4a5a7a", padding: "6px 0", cursor: "pointer", fontSize: 11, ...S.mono }}>{v}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {selected.userBet ? (
                  <div style={{ flex: 1, textAlign: "center" as const, color: "#8899bb", fontSize: 12, padding: 10 }}>Bet placed: {selected.userBet.toUpperCase()} 🎯</div>
                ) : (
                  <>
                    <button style={{ ...S.btnBull, flex: 1 }} onClick={() => placeBet(selected, "bull")}>🚀 BULL {betAmt} BNB</button>
                    <button style={{ ...S.btnBear, flex: 1 }} onClick={() => placeBet(selected, "bear")}>💀 BEAR {betAmt} BNB</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Autopsy */}
          {selected.result && selected.autopsy && (
            <div style={{ ...S.card, border: `1px solid ${selected.result === "viral" ? "#00ff8840" : "#ff336640"}` }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#4a5a7a", marginBottom: 8 }}>🔬 MEME AUTOPSY</div>
              <div style={{ fontSize: 13, color: "#e8edf5", lineHeight: 1.7 }}>{selected.autopsy}</div>
            </div>
          )}
        </div>
      )}

      {/* LEADERBOARD */}
      {page === "leaderboard" && (
        <div style={{ padding: 12 }}>
          <div style={S.header}><span style={{ fontWeight: 800 }}>Culture Prophets</span><span style={S.pill("#ffaa00")}>Top Predictors</span></div>
          <div style={S.card}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#4a5a7a", marginBottom: 10 }}>LEADERBOARD</div>
            {LEADERBOARD.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #1a1a3e", alignItems: "center" }}>
                <span style={{ fontSize: 16, width: 24, textAlign: "center" as const }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, ...S.mono }}>{e.address}</div>
                  <div style={{ fontSize: 10, color: "#4a5a7a" }}>{e.wins} wins · {e.accuracy}% accuracy</div>
                </div>
                <div style={{ textAlign: "right" as const }}>
                  <div style={{ color: "#00ff88", fontWeight: 700, fontSize: 13, ...S.mono }}>+{e.profit} BNB</div>
                  <div style={{ fontSize: 10, color: "#4a5a7a" }}>profit</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#4a5a7a", marginBottom: 10 }}>YOUR STATS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { l: "Bets Placed", v: memes.filter(m => m.userBet).length.toString() },
                { l: "Accuracy", v: "—" },
                { l: "Total Profit", v: totalProfit + " BNB" },
                { l: "Rank", v: "—" },
              ].map(s => (
                <div key={s.l} style={{ background: "#050510", borderRadius: 6, padding: 10, textAlign: "center" as const }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ff6b35", ...S.mono }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: "#4a5a7a" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUTOPSY PAGE */}
      {page === "autopsy" && (
        <div style={{ padding: 12 }}>
          <div style={S.header}><span style={{ fontWeight: 800 }}>🔬 Meme Autopsy</span><span style={S.pill("#8855ff")}>Resolved</span></div>
          {completedMemes.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center" as const, padding: 40, color: "#4a5a7a" }}>No resolved memes yet</div>
          ) : completedMemes.map(m => (
            <div key={m.id} style={{ ...S.card, border: `1px solid ${m.result === "viral" ? "#00ff8830" : "#ff336630"}` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <img src={m.imageUrl} alt={m.title} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" as const }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{m.title}</div>
                  <span style={S.pill(m.result === "viral" ? "#00ff88" : "#ff3366")}>{m.result === "viral" ? "✅ WENT VIRAL" : "💀 FLOPPED"}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.result === "viral" ? "#00ff88" : "#ff3366" }}>{Math.floor(m.viralScore)}</div>
              </div>
              <div style={{ fontSize: 12, color: "#8899bb", lineHeight: 1.6 }}>{m.autopsy}</div>
            </div>
          ))}
        </div>
      )}

      {/* NAV */}
      <nav style={S.nav}>
        {[
          { id: "radar", l: "Radar", i: <Flame size={16} /> },
          { id: "forecast", l: "Forecast", i: <TrendingUp size={16} /> },
          { id: "leaderboard", l: "Prophets", i: <Trophy size={16} /> },
          { id: "autopsy", l: "Autopsy", i: <Brain size={16} /> },
        ].map(n => (
          <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => { if(n.id === "forecast" && !selected) return; setPage(n.id as any) }}>
            {n.i}<span>{n.l}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
