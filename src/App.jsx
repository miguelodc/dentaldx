import { useState, useMemo, useEffect, useCallback } from "react"
import { supabase } from "./supabase.js"
import { defaultState, calcTreatment, generateRecommendations, fmt, fmtK, today } from "./data.js"

const ADMIN_PASS = "Miguelo29"
const TABS = ["🏠 Inicio","💊 Insumos","📊 Tratamientos","🏢 Costos Fijos","⚖️ Equilibrio","🎯 Meta","📅 Agenda","📄 Informe"]

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState]         = useState(() => defaultState())
  const [tab, setTab]             = useState(0)
  const [showSetup, setShowSetup] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [loaded, setLoaded]       = useState(false)
  const [dbId, setDbId]           = useState(null) // supabase row id

  // Load from localStorage first, then check if clinicName set
  useEffect(() => {
    const local = localStorage.getItem("dentaldx_state")
    if (local) {
      try {
        const parsed = JSON.parse(local)
        setState(parsed.state)
        setDbId(parsed.dbId || null)
        if (!parsed.state.clinicName) setShowSetup(true)
      } catch { setShowSetup(true) }
    } else {
      setShowSetup(true)
    }
    setLoaded(true)
  }, [])

  const save = useCallback(async (newState) => {
    setSaving(true)
    try {
      let rowId = dbId
      const payload = {
        clinic_name: newState.clinicName || "Sin nombre",
        doctor_name: newState.doctorName || "",
        data: newState,
        updated_at: new Date().toISOString(),
      }

      if (rowId) {
        await supabase.from("consultorios").update(payload).eq("id", rowId)
      } else if (newState.clinicName) {
        const { data, error } = await supabase.from("consultorios").insert(payload).select().single()
        if (!error && data) { rowId = data.id; setDbId(data.id) }
      }

      localStorage.setItem("dentaldx_state", JSON.stringify({ state: newState, dbId: rowId }))
      setSaveFlash(true)
      setTimeout(() => setSaveFlash(false), 1500)
    } catch(e) { console.error(e) }
    setSaving(false)
  }, [dbId])

  const update = useCallback((patch) => {
    setState(prev => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      save(next)
      return next
    })
  }, [save])

  const enriched = useMemo(() =>
    state.treatments.map(t => ({ ...t, ...calcTreatment(t, state.supplies, state.usdRate) })),
    [state.treatments, state.supplies, state.usdRate]
  )
  const sorted     = useMemo(() => [...enriched].sort((a,b) => b.revPerMin - a.revPerMin), [enriched])
  const totalFixed = useMemo(() => state.fixed.reduce((s,c) => s+c.amount, 0), [state.fixed])
  const recommendations = useMemo(() =>
    generateRecommendations(sorted, totalFixed, state.incomeGoal, state.workMin),
    [sorted, totalFixed, state.incomeGoal, state.workMin]
  )

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:"#080E1A",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#00C896",fontSize:14}}>Cargando…</div>
    </div>
  )

  return (
    <>
      <style>{printStyles}</style>
      {showSetup && (
        <SetupModal onDone={(clinic, doc) => {
          update({ clinicName: clinic, doctorName: doc })
          setShowSetup(false)
        }}/>
      )}

      <div style={{minHeight:"100vh",background:"#080E1A",color:"#E2E8F4",
        fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>

        {/* HEADER */}
        <div className="no-print" style={{background:"linear-gradient(135deg,#0C1628,#080E1A 60%,#0A1F14)",
          borderBottom:"1px solid rgba(0,200,150,0.12)",padding:"14px 14px 0",
          position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:30,height:30,borderRadius:8,
                background:"linear-gradient(135deg,#00C896,#4FACFE)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🦷</div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>DentalDX</div>
                <button onClick={()=>setShowSetup(true)}
                  style={{background:"none",border:"none",padding:0,cursor:"pointer",textAlign:"left"}}>
                  <div style={{fontSize:10,color:"#4FACFE"}}>
                    {state.clinicName||"Sin nombre"} ✎
                  </div>
                </button>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,color:saveFlash?"#00C896":saving?"#F7971E":"#2A3A55",transition:"color 0.3s"}}>
                {saveFlash?"✓ Guardado":saving?"Guardando…":"●"}
              </span>
              <div style={{display:"flex",alignItems:"center",gap:4,
                background:"rgba(247,151,30,0.1)",border:"1px solid rgba(247,151,30,0.2)",
                borderRadius:14,padding:"3px 9px"}}>
                <span style={{fontSize:10,color:"#F7971E"}}>USD</span>
                <input type="number" value={state.usdRate}
                  onChange={e=>update({usdRate:+e.target.value||1})}
                  style={{width:54,background:"transparent",border:"none",color:"#F7971E",
                    fontFamily:"inherit",fontSize:12,fontWeight:700,textAlign:"right"}}/>
              </div>
            </div>
          </div>
          <div style={{display:"flex",overflowX:"auto"}}>
            {TABS.map((t,i)=>(
              <button key={i} onClick={()=>setTab(i)} style={{
                background:"none",border:"none",
                color:tab===i?"#00C896":"#4B5A77",
                fontFamily:"inherit",fontSize:11,fontWeight:tab===i?700:400,
                padding:"7px 11px",cursor:"pointer",whiteSpace:"nowrap",
                borderBottom:tab===i?"2px solid #00C896":"2px solid transparent",
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{padding:"18px 14px",maxWidth:860,margin:"0 auto"}}>
          {tab===0 && <TabResumen sorted={sorted} enriched={enriched} totalFixed={totalFixed} state={state}/>}
          {tab===1 && <TabInsumos supplies={state.supplies} usdRate={state.usdRate} update={update}/>}
          {tab===2 && <TabTratamientos enriched={enriched} update={update}/>}
          {tab===3 && <TabCostosFijos fixed={state.fixed} update={update} totalFixed={totalFixed}/>
          }{tab===4 && <TabEquilibrio enriched={enriched} totalFixed={totalFixed} workMin={state.workMin} update={update}/>}
          {tab===5 && <TabMeta enriched={enriched} totalFixed={totalFixed} incomeGoal={state.incomeGoal} update={update}/>}
          {tab===6 && <TabAgenda enriched={enriched} agenda={state.agenda} update={update} totalFixed={totalFixed} workMin={state.workMin}/>}
          {tab===7 && <TabInforme sorted={sorted} enriched={enriched} totalFixed={totalFixed} state={state} recommendations={recommendations}/>}
        </div>
      </div>
    </>
  )
}

// ─── SETUP MODAL ─────────────────────────────────────────────────────────────
function SetupModal({ onDone }) {
  const [clinic, setClinic] = useState("")
  const [doctor, setDoctor] = useState("")
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:999,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#0E1828",border:"1px solid rgba(0,200,150,0.22)",
        borderRadius:20,padding:"30px 26px",width:"100%",maxWidth:360}}>
        <div style={{fontSize:26,textAlign:"center",marginBottom:6}}>🦷</div>
        <h2 style={{fontSize:17,fontWeight:700,textAlign:"center",marginBottom:3}}>DentalDX</h2>
        <p style={{fontSize:12,color:"#4B5A77",textAlign:"center",marginBottom:22}}>
          Datos del consultorio para el diagnóstico
        </p>
        {[
          {label:"Nombre del Consultorio *",val:clinic,set:setClinic,ph:"Ej: Odontología Pérez"},
          {label:"Odontólogo/a",            val:doctor,set:setDoctor,ph:"Ej: Dr. Martín García"},
        ].map(f=>(
          <div key={f.label} style={{marginBottom:12}}>
            <div style={{fontSize:9,color:"#4B5A77",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.5px"}}>{f.label}</div>
            <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
              style={{width:"100%",background:"rgba(255,255,255,0.06)",
                border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,
                padding:"10px 13px",color:"#E2E8F4",fontFamily:"inherit",fontSize:13,boxSizing:"border-box"}}/>
          </div>
        ))}
        <button onClick={()=>{ if(clinic.trim()) onDone(clinic.trim(), doctor.trim()) }}
          disabled={!clinic.trim()}
          style={{width:"100%",
            background:clinic.trim()?"linear-gradient(135deg,#00C896,#4FACFE)":"rgba(255,255,255,0.07)",
            border:"none",borderRadius:11,padding:"12px",
            color:clinic.trim()?"#080E1A":"#4B5A77",
            fontFamily:"inherit",fontSize:14,fontWeight:700,
            cursor:clinic.trim()?"pointer":"not-allowed",marginTop:4}}>
          Comenzar →
        </button>
      </div>
    </div>
  )
}

// ─── PRINT STYLES ────────────────────────────────────────────────────────────
const printStyles = `@media print {
  body{background:white!important;color:#111!important;}
  .no-print{display:none!important;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
}`

// ─── SHARED ──────────────────────────────────────────────────────────────────
function Alert({ type, text }) {
  const c={success:"#00C896",warning:"#F7971E",info:"#4FACFE",danger:"#F472B6"}[type]
  return (
    <div style={{background:`${c}10`,border:`1px solid ${c}25`,borderLeft:`3px solid ${c}`,
      borderRadius:9,padding:"10px 13px",fontSize:12,lineHeight:1.6,color:"#B0BAD4"}}>{text}</div>
  )
}

function SectionTitle({ num, title }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"#00C896",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:11,fontWeight:800,color:"white",flexShrink:0}}>{num}</div>
      <div style={{fontSize:14,fontWeight:700,color:"#1A202C"}}>{title}</div>
    </div>
  )
}

// ─── TAB RESUMEN ─────────────────────────────────────────────────────────────
function TabResumen({ sorted, enriched, totalFixed, state }) {
  const best = sorted[0], worst = sorted[sorted.length-1]
  return (
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:19,fontWeight:700,marginBottom:2}}>{state.clinicName||"Mi Consultorio"}</h2>
        <div style={{fontSize:11,color:"#4B5A77"}}>
          {state.doctorName && `${state.doctorName} · `}
          USD ${state.usdRate.toLocaleString()}
          {state.lastSaved && ` · Guardado ${new Date(state.lastSaved).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}`}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9,marginBottom:18}}>
        {[
          {l:"Costos Fijos/Mes",v:fmtK(totalFixed),         icon:"🏢",c:"#F472B6"},
          {l:"Mejor $/Minuto",  v:fmtK(best?.revPerMin||0), icon:"⚡",c:"#F7971E"},
          {l:"Margen Máx.",     v:`${best?.marginPct.toFixed(0)||0}%`,icon:"📈",c:"#00C896"},
          {l:"Tratamientos",    v:enriched.length,           icon:"💊",c:"#4FACFE"},
        ].map(k=>(
          <div key={k.l} style={{background:"rgba(255,255,255,0.03)",
            border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,
            padding:"13px",borderTop:`2px solid ${k.c}`}}>
            <div style={{fontSize:17,marginBottom:5}}>{k.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
            <div style={{fontSize:10,color:"#4B5A77",marginTop:1}}>{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",
        borderRadius:14,padding:"16px",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:"#8896B0",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.5px"}}>
          Ranking · $/minuto
        </div>
        {sorted.map((t,i)=>(
          <div key={t.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
              <span style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontSize:10,color:"#4B5A77",width:14}}>#{i+1}</span>
                <span style={{width:7,height:7,borderRadius:"50%",background:t.color,display:"inline-block"}}/>
                <span>{t.name}</span>
              </span>
              <span style={{color:t.color,fontWeight:600,fontSize:11}}>
                {fmtK(t.revPerMin)}/min · {t.marginPct.toFixed(0)}%
              </span>
            </div>
            <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:2,
                width:`${(t.revPerMin/(sorted[0]?.revPerMin||1))*100}%`,
                background:`linear-gradient(90deg,${t.color}55,${t.color})`}}/>
            </div>
            <div style={{fontSize:10,color:"#4B5A77",marginTop:2}}>
              {t.sessions} ses. · {fmt(t.pricePerSession)}/ses. · Total {fmt(t.totalPrice)}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        <Alert type="success" text={`🏆 ${best?.name}: ${fmtK(best?.revPerMin||0)}/min · ${best?.sessions} sesiones de ${fmt(best?.pricePerSession||0)} = ${fmt(best?.totalPrice||0)} total`}/>
        {worst && worst.revPerMin < (best?.revPerMin||1)*0.4 &&
          <Alert type="warning" text={`⚠️ ${worst.name} rinde solo ${fmtK(worst.revPerMin)}/min. Revisá precio o tiempo por sesión.`}/>}
      </div>
    </div>
  )
}

// ─── TAB INSUMOS ─────────────────────────────────────────────────────────────
function TabInsumos({ supplies, usdRate, update }) {
  const upd = (key, field, value) => update(prev=>({
    ...prev,
    supplies:{...prev.supplies,[key]:{...prev.supplies[key],[field]:field==="usd"?value:(parseFloat(value)||0)}}
  }))
  return (
    <div>
      <h2 style={{fontSize:19,fontWeight:700,marginBottom:4}}>Insumos</h2>
      <p style={{color:"#4B5A77",fontSize:12,marginBottom:16}}>El costo por uso se calcula solo. Marcá los que están en dólares.</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.entries(supplies).map(([key,sup])=>{
          const unitPrice = (sup.usd?sup.pkgPrice*usdRate:sup.pkgPrice)/sup.pkgQty
          return (
            <div key={key} style={{background:"rgba(255,255,255,0.025)",
              border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:600,fontSize:13}}>{sup.name}</span>
                <span style={{background:"rgba(0,200,150,0.1)",border:"1px solid rgba(0,200,150,0.2)",
                  borderRadius:14,padding:"2px 9px",fontSize:11,color:"#00C896",fontWeight:700}}>
                  {fmtK(unitPrice)}/u
                </span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:7}}>
                {[
                  {label:`Precio paquete${sup.usd?" (USD)":""}`,field:"pkgPrice",val:sup.pkgPrice},
                  {label:"Unidades / paquete",                  field:"pkgQty",  val:sup.pkgQty},
                ].map(f=>(
                  <div key={f.field}>
                    <div style={{fontSize:9,color:"#4B5A77",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.4px"}}>{f.label}</div>
                    <input type="number" value={f.val} onChange={e=>upd(key,f.field,e.target.value)}
                      style={{width:"100%",background:"rgba(255,255,255,0.06)",
                        border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,
                        padding:"6px 9px",color:"#E2E8F4",fontFamily:"inherit",fontSize:12,boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#8896B0",cursor:"pointer"}}>
                <input type="checkbox" checked={sup.usd} onChange={e=>upd(key,"usd",e.target.checked)}
                  style={{accentColor:"#F7971E"}}/>
                Precio en dólares (USD)
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SCENARIO SIMULATOR ──────────────────────────────────────────────────────
function ScenarioSimulator({ t }) {
  const [realSessions, setRealSessions] = useState(t.sessions)

  const scenario = useMemo(() => {
    const totalTimeMin = t.timePerSession * realSessions
    const extraEachCost = t.breakdown.filter(b=>b.when==="each")
      .reduce((s,b) => s + (b.lineCost/t.sessions)*realSessions, 0)
    const onceCost  = t.breakdown.filter(b=>b.when!=="each").reduce((s,b)=>s+b.lineCost,0)
    const totalCost = onceCost + extraEachCost
    const margin    = t.totalPrice - totalCost
    const revPerMin = totalTimeMin > 0 ? margin / totalTimeMin : 0
    const marginPct = t.totalPrice > 0 ? (margin/t.totalPrice)*100 : 0
    return { totalTimeMin, totalCost, margin, revPerMin, marginPct }
  }, [t, realSessions])

  const delta    = scenario.revPerMin - t.revPerMin
  const deltaPct = t.revPerMin > 0 ? (delta/t.revPerMin)*100 : 0
  const isWorse  = realSessions > t.sessions
  const isBetter = realSessions < t.sessions
  const maxSes   = Math.max(t.sessions*2, 20)
  const suggestedPrice = Math.ceil((t.revPerMin*scenario.totalTimeMin+scenario.totalCost)/100)*100

  return (
    <div style={{background:isWorse?"rgba(244,114,182,0.06)":isBetter?"rgba(0,200,150,0.06)":"rgba(255,255,255,0.03)",
      border:`1px solid ${isWorse?"rgba(244,114,182,0.25)":isBetter?"rgba(0,200,150,0.2)":"rgba(255,255,255,0.08)"}`,
      borderRadius:12,padding:"14px",marginTop:14}}>
      <div style={{fontSize:10,color:"#8896B0",fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>
        🔮 Simulador de Escenarios
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:"#8896B0"}}>¿Cuántas visitas reales tuvo este caso?</span>
          <span style={{fontSize:15,fontWeight:800,color:isWorse?"#F472B6":isBetter?"#00C896":t.color}}>
            {realSessions} visitas
          </span>
        </div>
        <input type="range" min={1} max={maxSes} step={1} value={realSessions}
          onChange={e=>setRealSessions(+e.target.value)}
          style={{width:"100%",accentColor:isWorse?"#F472B6":isBetter?"#00C896":t.color}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#4B5A77",marginTop:2}}>
          <span>1</span>
          <span style={{color:t.color+"99"}}>↑ estimado: {t.sessions}</span>
          <span>{maxSes}</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {[
          {label:`Estimado (${t.sessions} ses.)`,rpm:t.revPerMin,margin:t.margin,time:t.totalTimeMin,bg:"rgba(255,255,255,0.04)",c:"#8896B0"},
          {label:`Real (${realSessions} ses.)`,  rpm:scenario.revPerMin,margin:scenario.margin,time:scenario.totalTimeMin,
            bg:isWorse?"rgba(244,114,182,0.08)":isBetter?"rgba(0,200,150,0.08)":"rgba(255,255,255,0.04)",
            c:isWorse?"#F472B6":isBetter?"#00C896":t.color},
        ].map(col=>(
          <div key={col.label} style={{background:col.bg,borderRadius:10,padding:"11px"}}>
            <div style={{fontSize:9,color:"#4B5A77",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.4px"}}>{col.label}</div>
            <div style={{fontSize:16,fontWeight:800,color:col.c}}>{fmtK(col.rpm)}/min</div>
            <div style={{fontSize:10,color:"#6B7A99",marginTop:2}}>Margen: {fmt(col.margin)}</div>
            <div style={{fontSize:10,color:"#6B7A99"}}>{col.time} min totales</div>
          </div>
        ))}
      </div>
      {realSessions !== t.sessions && (
        <div style={{background:isWorse?"rgba(244,114,182,0.1)":"rgba(0,200,150,0.1)",
          border:`1px solid ${isWorse?"rgba(244,114,182,0.3)":"rgba(0,200,150,0.25)"}`,
          borderRadius:9,padding:"10px 12px",marginBottom:isWorse?10:0,fontSize:12,lineHeight:1.6}}>
          {isWorse ? (
            <><strong style={{color:"#F472B6"}}>⚠️ Perdés {fmtK(Math.abs(delta))}/min</strong>
            {` (${Math.abs(deltaPct).toFixed(0)}% menos). Para mantener la rentabilidad con ${realSessions} visitas deberías cobrar `}
            <strong style={{color:"#F7971E"}}>{fmt(suggestedPrice)}</strong>
            {` (${fmt(Math.round(suggestedPrice/realSessions))}/visita).`}</>
          ) : (
            <><strong style={{color:"#00C896"}}>✅ Ganás {fmtK(Math.abs(delta))}/min extra</strong>
            {` (${Math.abs(deltaPct).toFixed(0)}% más) al terminar en ${t.sessions-realSessions} visitas menos.`}</>
          )}
        </div>
      )}
      {isWorse && (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,color:"#8896B0",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.4px"}}>Estrategias</div>
          {[
            {t:"💰 Subir el precio base",         d:`Cobrar ${fmt(suggestedPrice)} total asumiendo el peor caso.`},
            {t:"📋 Base + adicional por visita",   d:`Incluir ${t.sessions} visitas. De la visita ${t.sessions+1} en adelante cobrar ${fmt(t.pricePerSession)} c/u.`},
            {t:"📊 Presupuesto por complejidad",   d:`Simple (${t.sessions} vis.): ${fmt(t.totalPrice)} · Complejo (${Math.round(t.sessions*1.6)} vis.): ${fmt(suggestedPrice)}`},
          ].map(e=>(
            <div key={e.t} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"9px 11px"}}>
              <div style={{fontSize:11,fontWeight:600,marginBottom:2}}>{e.t}</div>
              <div style={{fontSize:11,color:"#6B7A99",lineHeight:1.5}}>{e.d}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TAB TRATAMIENTOS ────────────────────────────────────────────────────────
function TabTratamientos({ enriched, update }) {
  const [open, setOpen] = useState(null)
  const upd = (id, field, value) => update(prev=>({
    ...prev,
    treatments: prev.treatments.map(t=>t.id===id?{...t,[field]:parseFloat(value)||0}:t)
  }))
  return (
    <div>
      <h2 style={{fontSize:19,fontWeight:700,marginBottom:4}}>Tratamientos</h2>
      <p style={{color:"#4B5A77",fontSize:12,marginBottom:16}}>
        Precio y tiempo <strong style={{color:"#E2E8F4"}}>por sesión</strong> · Tocá para editar y simular escenarios.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {enriched.map(t=>(
          <div key={t.id} style={{background:open===t.id?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.025)",
            border:`1px solid ${open===t.id?t.color+"44":"rgba(255,255,255,0.06)"}`,
            borderRadius:14,overflow:"hidden",cursor:"pointer"}}
            onClick={()=>setOpen(open===t.id?null:t.id)}>
            <div style={{padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:t.color,flexShrink:0}}/>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{t.name}</div>
                    <div style={{fontSize:10,color:"#4B5A77",marginTop:1}}>{t.paymentType}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:t.color,fontWeight:700,fontSize:14}}>{fmt(t.totalPrice)}</div>
                  <div style={{fontSize:10,color:"#4B5A77"}}>{t.marginPct.toFixed(1)}% margen</div>
                </div>
              </div>
              <div style={{display:"flex",gap:7,marginTop:9,flexWrap:"wrap"}}>
                {[
                  {label:"Sesiones",   val:t.sessions},
                  {label:"$/sesión",   val:fmt(t.pricePerSession)},
                  {label:"Min/sesión", val:`${t.timePerSession}min`},
                  {label:"$/min",      val:fmtK(t.revPerMin)},
                ].map(p=>(
                  <div key={p.label} style={{background:"rgba(255,255,255,0.05)",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#8896B0"}}>
                    <span style={{color:"#E2E8F4",fontWeight:600}}>{p.val}</span> {p.label}
                  </div>
                ))}
              </div>
            </div>
            {open===t.id && (
              <div style={{borderTop:`1px solid ${t.color}22`,padding:"13px 14px"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:10,color:"#8896B0",fontWeight:600,marginBottom:9,textTransform:"uppercase",letterSpacing:"0.5px"}}>Configurar</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:12}}>
                  {[
                    {label:"Precio / sesión ($)", field:"pricePerSession",value:t.pricePerSession},
                    {label:"Tiempo / sesión (min)",field:"timePerSession", value:t.timePerSession},
                    {label:"Sesiones estimadas",   field:"sessions",       value:t.sessions},
                  ].map(f=>(
                    <div key={f.field}>
                      <div style={{fontSize:9,color:"#4B5A77",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.4px"}}>{f.label}</div>
                      <input type="number" defaultValue={f.value} onChange={e=>upd(t.id,f.field,e.target.value)}
                        style={{width:"100%",background:"rgba(255,255,255,0.07)",border:`1px solid ${t.color}35`,borderRadius:8,
                          padding:"7px 9px",color:t.color,fontFamily:"inherit",fontSize:13,fontWeight:700,boxSizing:"border-box"}}/>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
                  {[
                    {l:"Total",  v:fmt(t.totalPrice)},
                    {l:"Tiempo", v:`${t.totalTimeMin}min`},
                    {l:"Insumos",v:fmt(t.totalCost)},
                    {l:"Margen", v:fmt(t.margin)},
                  ].map(k=>(
                    <div key={k.l} style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"6px 10px",flex:1,minWidth:70}}>
                      <div style={{fontSize:11,fontWeight:700,color:t.color}}>{k.v}</div>
                      <div style={{fontSize:9,color:"#4B5A77",marginTop:1}}>{k.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:"#8896B0",fontWeight:600,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.5px"}}>Insumos</div>
                <div style={{background:"rgba(0,0,0,0.2)",borderRadius:9,overflow:"hidden"}}>
                  {t.breakdown.map((b,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",
                      padding:"7px 11px",fontSize:11,alignItems:"center",
                      borderBottom:i<t.breakdown.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                      <span style={{color:"#8896B0"}}>{b.name} ×{b.rawQty||b.qty}</span>
                      <span style={{padding:"1px 7px",marginRight:8,borderRadius:4,fontSize:9,fontWeight:600,
                        background:b.when==="each"?"rgba(79,172,254,0.15)":"rgba(0,200,150,0.12)",
                        color:b.when==="each"?"#4FACFE":"#00C896"}}>
                        {b.when==="each"?`×${t.sessions} ses.`:"1 vez"}
                      </span>
                      <span style={{color:"#E2E8F4",textAlign:"right",fontWeight:500}}>{fmt(b.lineCost)}</span>
                    </div>
                  ))}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",padding:"7px 11px",fontSize:11,fontWeight:700,
                    borderTop:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.03)"}}>
                    <span style={{color:t.color}}>TOTAL INSUMOS</span>
                    <span style={{color:t.color}}>{fmt(t.totalCost)}</span>
                  </div>
                </div>
                <ScenarioSimulator t={t}/>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB EQUILIBRIO ──────────────────────────────────────────────────────────
function TabEquilibrio({ enriched, totalFixed, workMin, update }) {
  const data = useMemo(()=>[...enriched].map(t=>({
    ...t,needed:Math.ceil(totalFixed/t.margin),minsNeeded:Math.ceil((totalFixed/t.margin)*t.totalTimeMin),
  })).sort((a,b)=>a.needed-b.needed),[enriched,totalFixed])
  return (
    <div>
      <h2 style={{fontSize:19,fontWeight:700,marginBottom:4}}>Punto de Equilibrio</h2>
      <p style={{color:"#4B5A77",fontSize:12,marginBottom:16}}>Tratamientos completos para cubrir {fmtK(totalFixed)}/mes</p>
      <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"13px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:"#8896B0"}}>Min disponibles/mes</span>
          <span style={{fontSize:13,fontWeight:700,color:"#4FACFE"}}>{workMin.toLocaleString()}</span>
        </div>
        <input type="range" min={600} max={6000} step={100} value={workMin}
          onChange={e=>update({workMin:+e.target.value})} style={{width:"100%",accentColor:"#4FACFE"}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#4B5A77",marginTop:3}}>
          <span>600</span><span>2400 full-time</span><span>6000</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {data.map(t=>{
          const ok=t.minsNeeded<=workMin, p=Math.min((t.minsNeeded/workMin)*100,100)
          return (
            <div key={t.id} style={{background:"rgba(255,255,255,0.025)",
              border:`1px solid ${ok?"rgba(0,200,150,0.17)":"rgba(244,114,182,0.17)"}`,borderRadius:12,padding:"12px 13px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:1}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:t.color}}/>
                    <span style={{fontWeight:600,fontSize:13}}>{t.name}</span>
                  </div>
                  <div style={{fontSize:10,color:"#6B7A99"}}>{t.sessions} ses. × {fmt(t.pricePerSession)} = {fmt(t.totalPrice)} c/u</div>
                  <div style={{fontSize:10,color:ok?"#00C896":"#F472B6",marginTop:1}}>{t.minsNeeded.toLocaleString()} min · {ok?"✅ Factible":"❌ Excede disponibilidad"}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:22,fontWeight:800,color:ok?"#00C896":"#F472B6"}}>{t.needed}</div>
                  <div style={{fontSize:9,color:"#4B5A77"}}>tratamientos</div>
                </div>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${p}%`,borderRadius:2,
                  background:ok?"linear-gradient(90deg,#00C89655,#00C896)":"linear-gradient(90deg,#F472B655,#F472B6)"}}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TAB META ────────────────────────────────────────────────────────────────
function TabMeta({ enriched, totalFixed, incomeGoal, update }) {
  const target = totalFixed + incomeGoal
  const items  = useMemo(()=>[...enriched].map(t=>({
    ...t,needed:Math.ceil(target/t.margin),minsNeeded:Math.ceil((target/t.margin)*t.totalTimeMin),
  })).sort((a,b)=>a.needed-b.needed),[enriched,target])
  return (
    <div>
      <h2 style={{fontSize:19,fontWeight:700,marginBottom:4}}>Meta de Ingreso</h2>
      <p style={{color:"#4B5A77",fontSize:12,marginBottom:16}}>¿Cuánto querés llevarte de bolsillo por mes?</p>
      <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.17)",borderRadius:14,padding:"18px",marginBottom:18,textAlign:"center"}}>
        <div style={{fontSize:9,color:"#4B5A77",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.5px"}}>Ingreso neto deseado / mes</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          <span style={{fontSize:18,color:"#00C896",fontWeight:700}}>$</span>
          <input type="number" value={incomeGoal} onChange={e=>update({incomeGoal:parseFloat(e.target.value)||0})}
            style={{width:148,background:"transparent",border:"none",borderBottom:"2px solid #00C896",color:"#00C896",
              fontFamily:"inherit",fontSize:24,fontWeight:800,textAlign:"center",padding:"2px 0"}}/>
        </div>
        <div style={{fontSize:11,color:"#4B5A77",marginTop:8}}>
          + {fmtK(totalFixed)} costos fijos = <strong style={{color:"#E2E8F4"}}>{fmtK(target)}</strong> a facturar
        </div>
      </div>
      <div style={{fontSize:11,fontWeight:600,color:"#8896B0",marginBottom:10}}>Facturando un solo tipo de tratamiento:</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {items.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,
            background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"11px 13px"}}>
            <div style={{fontSize:11,color:"#4B5A77",minWidth:18,textAlign:"center"}}>#{i+1}</div>
            <div style={{width:7,height:7,borderRadius:"50%",background:t.color,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>{t.name}</div>
              <div style={{fontSize:10,color:"#6B7A99",marginTop:1}}>{t.minsNeeded.toLocaleString()} min · {fmt(t.margin)} margen/trat.</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:20,fontWeight:800,color:t.color}}>{t.needed}</div>
              <div style={{fontSize:9,color:"#4B5A77"}}>tratamientos</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB AGENDA ──────────────────────────────────────────────────────────────
function TabAgenda({ enriched, agenda, update, totalFixed, workMin }) {
  const setQty = (id,val) => update(prev=>({...prev,agenda:{...prev.agenda,[id]:Math.max(0,val)}}))
  const results = useMemo(()=>{
    let rev=0,costs=0,mins=0
    const details = enriched.map(t=>{
      const q=agenda[t.id]||0
      rev+=t.totalPrice*q; costs+=t.totalCost*q; mins+=t.totalTimeMin*q
      return {...t,qty:q,revenue:t.totalPrice*q,varCost:t.totalCost*q,minutes:t.totalTimeMin*q,contrib:(t.totalPrice-t.totalCost)*q}
    })
    return {details,rev,costs,mins,net:rev-costs-totalFixed}
  },[enriched,agenda,totalFixed])
  const mp=Math.min((results.mins/workMin)*100,100)
  return (
    <div>
      <h2 style={{fontSize:19,fontWeight:700,marginBottom:4}}>Simulador de Agenda</h2>
      <p style={{color:"#4B5A77",fontSize:12,marginBottom:14}}>Cantidad de <strong style={{color:"#E2E8F4"}}>tratamientos completos</strong> por mes</p>
      <div style={{background:results.net>=0?"rgba(0,200,150,0.07)":"rgba(244,114,182,0.07)",
        border:`1px solid ${results.net>=0?"rgba(0,200,150,0.2)":"rgba(244,114,182,0.2)"}`,borderRadius:14,padding:"13px",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9,marginBottom:9}}>
          {[
            {l:"Ingresos Brutos", v:fmtK(results.rev),  c:"#4FACFE"},
            {l:"Costos Variables",v:fmtK(results.costs), c:"#F7971E"},
            {l:"Costos Fijos",    v:fmtK(totalFixed),    c:"#F472B6"},
            {l:"Resultado Neto",  v:fmtK(results.net),   c:results.net>=0?"#00C896":"#F472B6"},
          ].map(k=>(
            <div key={k.l} style={{textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:800,color:k.c}}>{k.v}</div>
              <div style={{fontSize:9,color:"#4B5A77",marginTop:1}}>{k.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#6B7A99",marginBottom:3}}>
          <span>{results.mins.toLocaleString()} / {workMin.toLocaleString()} min</span>
          <span style={{color:mp>100?"#F472B6":"#00C896"}}>{mp.toFixed(0)}%</span>
        </div>
        <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${mp}%`,borderRadius:2,transition:"width 0.3s",
            background:mp>100?"linear-gradient(90deg,#F472B6,#F43F5E)":"linear-gradient(90deg,#00C896,#4FACFE)"}}/>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {results.details.map(t=>(
          <div key={t.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:12,padding:"11px 13px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:1}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:t.color}}/>
                <span style={{fontWeight:500,fontSize:13}}>{t.name}</span>
              </div>
              <div style={{fontSize:10,color:"#4B5A77"}}>
                {t.sessions} ses. · {fmt(t.pricePerSession)}/ses. · {fmt(t.totalPrice)}/trat.
                {t.qty>0&&` · Contrib: ${fmt(t.contrib)}`}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <button onClick={()=>setQty(t.id,(agenda[t.id]||0)-1)}
                style={{width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,0.07)",border:"none",color:"#E2E8F4",cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>−</button>
              <span style={{width:28,textAlign:"center",fontSize:15,fontWeight:800,color:t.color}}>{agenda[t.id]||0}</span>
              <button onClick={()=>setQty(t.id,(agenda[t.id]||0)+1)}
                style={{width:26,height:26,borderRadius:"50%",background:t.color+"22",border:`1px solid ${t.color}44`,color:t.color,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB INFORME ─────────────────────────────────────────────────────────────
function TabInforme({ sorted, enriched, totalFixed, state, recommendations }) {
  const { incomeGoal, workMin, agenda, clinicName, doctorName, usdRate } = state
  const beData = useMemo(()=>[...enriched].map(t=>({
    ...t,needed:Math.ceil(totalFixed/t.margin),minsNeeded:Math.ceil((totalFixed/t.margin)*t.totalTimeMin),
  })).sort((a,b)=>a.needed-b.needed),[enriched,totalFixed])
  const agendaRes = useMemo(()=>{
    let rev=0,costs=0,mins=0
    enriched.forEach(t=>{const q=agenda[t.id]||0;rev+=t.totalPrice*q;costs+=t.totalCost*q;mins+=t.totalTimeMin*q})
    return {rev,costs,mins,net:rev-costs-totalFixed}
  },[enriched,agenda,totalFixed])
  const hasAgenda = Object.values(agenda).some(v=>v>0)
  return (
    <div>
      <div className="no-print" style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button onClick={()=>window.print()}
          style={{background:"linear-gradient(135deg,#00C896,#4FACFE)",border:"none",borderRadius:10,padding:"10px 18px",
            color:"#080E1A",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>
      <div style={{background:"white",color:"#111",borderRadius:16,padding:"28px 24px",boxShadow:"0 4px 40px rgba(0,0,0,0.4)"}}>
        <div style={{borderBottom:"3px solid #00C896",paddingBottom:14,marginBottom:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:"#0A1628"}}>{clinicName||"Consultorio"}</div>
              {doctorName&&<div style={{fontSize:12,color:"#6B7A99",marginTop:1}}>{doctorName}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#00C896"}}>DentalDX</div>
              <div style={{fontSize:10,color:"#9AA3B5"}}>Diagnóstico Financiero</div>
              <div style={{fontSize:10,color:"#9AA3B5"}}>{today()}</div>
            </div>
          </div>
          <div style={{fontSize:10,color:"#9AA3B5",marginTop:7}}>
            USD $1 = ${usdRate.toLocaleString()} · Costos fijos: {fmt(totalFixed)}/mes · Disponibilidad: {workMin.toLocaleString()} min/mes
          </div>
        </div>
        <div style={{marginBottom:22}}>
          <SectionTitle num="1" title="Ranking de Tratamientos por Rentabilidad"/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{background:"#F4F7FA"}}>
              {["#","Tratamiento","Sesiones","$/Sesión","Total","Insumos","Margen","$/min"].map(h=>(
                <th key={h} style={{padding:"6px 8px",textAlign:"left",color:"#6B7A99",fontWeight:600,fontSize:10}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{sorted.map((t,i)=>(
              <tr key={t.id} style={{borderBottom:"1px solid #F0F0F0"}}>
                <td style={{padding:"7px 8px",color:"#9AA3B5",fontSize:10}}>#{i+1}</td>
                <td style={{padding:"7px 8px",fontWeight:600}}>{t.name}</td>
                <td style={{padding:"7px 8px",textAlign:"center"}}>{t.sessions}</td>
                <td style={{padding:"7px 8px"}}>{fmt(t.pricePerSession)}</td>
                <td style={{padding:"7px 8px",fontWeight:600}}>{fmt(t.totalPrice)}</td>
                <td style={{padding:"7px 8px",color:"#DC2626"}}>{fmt(t.totalCost)}</td>
                <td style={{padding:"7px 8px"}}>
                  <span style={{background:"#E8FAF4",color:"#00A070",borderRadius:4,padding:"1px 6px",fontWeight:700}}>
                    {t.marginPct.toFixed(1)}%
                  </span>
                </td>
                <td style={{padding:"7px 8px",fontWeight:700,color:i===0?"#00A070":"#333"}}>{fmtK(t.revPerMin)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{marginBottom:22}}>
          <SectionTitle num="2" title="Punto de Equilibrio Mensual"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {beData.map(t=>{
              const ok=t.minsNeeded<=workMin
              return (
                <div key={t.id} style={{border:`1px solid ${ok?"#C6F0E0":"#FFCDD2"}`,borderRadius:9,padding:"11px",background:ok?"#F0FBF6":"#FFF5F5"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#333",marginBottom:3}}>{t.name}</div>
                  <div style={{fontSize:9,color:"#9AA3B5",marginBottom:5}}>{t.sessions} ses. × {fmt(t.pricePerSession)}</div>
                  <div style={{fontSize:20,fontWeight:800,color:ok?"#00A070":"#E05050"}}>{t.needed}</div>
                  <div style={{fontSize:9,color:"#9AA3B5"}}>tratamientos · {t.minsNeeded.toLocaleString()} min</div>
                  <div style={{fontSize:9,fontWeight:600,color:ok?"#00A070":"#E05050",marginTop:2}}>{ok?"✅ Factible":"⚠️ Excede disponibilidad"}</div>
                </div>
              )
            })}
          </div>
        </div>
        {hasAgenda&&(
          <div style={{marginBottom:22}}>
            <SectionTitle num="3" title="Resultado de Agenda Simulada"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
              {[
                {l:"Ingresos Brutos",v:fmt(agendaRes.rev),  c:"#2563EB"},
                {l:"Costos Variables",v:fmt(agendaRes.costs),c:"#D97706"},
                {l:"Costos Fijos",   v:fmt(totalFixed),      c:"#DC2626"},
                {l:"Resultado Neto", v:fmt(agendaRes.net),   c:agendaRes.net>=0?"#059669":"#DC2626"},
              ].map(k=>(
                <div key={k.l} style={{background:"#F4F7FA",borderRadius:9,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:800,color:k.c}}>{k.v}</div>
                  <div style={{fontSize:9,color:"#9AA3B5",marginTop:1}}>{k.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{marginBottom:8}}>
          <SectionTitle num={hasAgenda?"4":"3"} title="Recomendaciones y Conclusiones"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {recommendations.map((r,i)=>(
              <div key={i} style={{background:"#F8FAFB",borderRadius:8,padding:"10px 12px",borderLeft:"3px solid #00C896",fontSize:12,lineHeight:1.6,color:"#2D3748"}}>{r}</div>
            ))}
          </div>
        </div>
        <div style={{marginTop:24,paddingTop:12,borderTop:"1px solid #E8ECF0",display:"flex",justifyContent:"space-between",fontSize:9,color:"#C0C8D4"}}>
          <span>Generado con DentalDX · diagnóstico financiero para consultorios odontológicos</span>
          <span>{today()}</span>
        </div>
      </div>
    </div>
  )
}

// ─── TAB COSTOS FIJOS ────────────────────────────────────────────────────────
function TabCostosFijos({ fixed, update, totalFixed }) {
  const [newName, setNewName] = useState("")
  const [newAmount, setNewAmount] = useState("")

  const updateItem = (id, field, value) => update(prev => ({
    ...prev,
    fixed: prev.fixed.map(c => c.id === id ? { ...c, [field]: field === "amount" ? (parseFloat(value) || 0) : value } : c)
  }))

  const removeItem = (id) => update(prev => ({
    ...prev,
    fixed: prev.fixed.filter(c => c.id !== id)
  }))

  const addItem = () => {
    if (!newName || !newAmount) return
    update(prev => ({
      ...prev,
      fixed: [...prev.fixed, { id: Date.now(), name: newName, amount: parseFloat(newAmount) || 0 }]
    }))
    setNewName(""); setNewAmount("")
  }

  return (
    <div>
      <h2 style={{fontSize:19,fontWeight:700,marginBottom:4}}>Costos Fijos</h2>
      <p style={{color:"#4B5A77",fontSize:12,marginBottom:16}}>
        Gastos mensuales fijos del consultorio. Editá los valores según tu realidad.
      </p>

      {/* Total */}
      <div style={{background:"rgba(244,114,182,0.07)",border:"1px solid rgba(244,114,182,0.22)",
        borderRadius:14,padding:"16px",textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:28,fontWeight:800,color:"#F472B6"}}>{fmt(totalFixed)}</div>
        <div style={{fontSize:11,color:"#4B5A77",marginTop:3}}>Total mensual de costos fijos</div>
      </div>

      {/* Items */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {fixed.map(c => {
          const pct = totalFixed > 0 ? (c.amount / totalFixed) * 100 : 0
          return (
            <div key={c.id} style={{background:"rgba(255,255,255,0.025)",
              border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:7}}>
                <input value={c.name} onChange={e => updateItem(c.id, "name", e.target.value)}
                  style={{flex:1,background:"transparent",border:"none",color:"#E2E8F4",
                    fontFamily:"inherit",fontSize:13,fontWeight:500}}/>
                <input type="number" value={c.amount} onChange={e => updateItem(c.id, "amount", e.target.value)}
                  style={{width:120,background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,
                    padding:"6px 9px",color:"#E2E8F4",fontFamily:"inherit",
                    fontSize:12,textAlign:"right",boxSizing:"border-box"}}/>
                <button onClick={() => removeItem(c.id)}
                  style={{background:"rgba(244,114,182,0.12)",border:"1px solid rgba(244,114,182,0.25)",
                    borderRadius:7,padding:"5px 9px",color:"#F472B6",
                    cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>✕</button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,borderRadius:2,
                    background:"linear-gradient(90deg,#F472B655,#F472B6)"}}/>
                </div>
                <span style={{fontSize:10,color:"#4B5A77",minWidth:32}}>{pct.toFixed(0)}%</span>
                <span style={{fontSize:10,color:"#4B5A77",minWidth:60,textAlign:"right"}}>{fmtK(c.amount)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Agregar nuevo */}
      <div style={{background:"rgba(255,255,255,0.025)",border:"1px dashed rgba(255,255,255,0.12)",
        borderRadius:12,padding:"13px",display:"flex",gap:8,alignItems:"center"}}>
        <input placeholder="Nombre del gasto (ej: Otros)" value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8,padding:"8px 11px",color:"#E2E8F4",fontFamily:"inherit",fontSize:12}}/>
        <input type="number" placeholder="Monto" value={newAmount}
          onChange={e => setNewAmount(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          style={{width:110,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8,padding:"8px 9px",color:"#E2E8F4",fontFamily:"inherit",fontSize:12}}/>
        <button onClick={addItem}
          style={{background:"linear-gradient(135deg,#00C896,#4FACFE)",border:"none",
            borderRadius:8,padding:"8px 14px",color:"#080E1A",
            fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer"}}>+</button>
      </div>
    </div>
  )
}
