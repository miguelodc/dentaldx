import { useState, useEffect, useMemo } from "react"
import { supabase } from "./supabase.js"
import { calcTreatment, fmt, fmtK, today } from "./data.js"

const ADMIN_PASS = "Miguelo29"

export default function Admin() {
  const [authed, setAuthed]       = useState(false)
  const [pass, setPass]           = useState("")
  const [passErr, setPassErr]     = useState(false)
  const [clinics, setClinics]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState("")

  const login = () => {
    if (pass === ADMIN_PASS) { setAuthed(true); loadClinics() }
    else { setPassErr(true); setTimeout(()=>setPassErr(false),2000) }
  }

  const loadClinics = async () => {
    setLoading(true)
    const { data } = await supabase.from("consultorios").select("*").order("updated_at", { ascending: false })
    setClinics(data || [])
    setLoading(false)
  }

  const saveClinic = async () => {
    if (!selected) return
    setSaving(true)
    await supabase.from("consultorios").update({
      clinic_name: selected.clinic_name,
      doctor_name: selected.doctor_name,
      data: selected.data,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id)
    setSaveMsg("✓ Guardado")
    setTimeout(()=>setSaveMsg(""),2000)
    setSaving(false)
    loadClinics()
  }

  const deleteClinic = async (id) => {
    if (!confirm("¿Eliminar este consultorio? Esta acción no se puede deshacer.")) return
    await supabase.from("consultorios").delete().eq("id", id)
    setSelected(null)
    loadClinics()
  }

  const updateField = (path, value) => {
    setSelected(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const parts = path.split(".")
      let obj = next
      for (let i=0; i<parts.length-1; i++) obj = obj[parts[i]]
      obj[parts[parts.length-1]] = value
      return next
    })
  }

  if (!authed) return (
    <div style={{minHeight:"100vh",background:"#080E1A",display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#E2E8F4"}}>
      <div style={{background:"#0E1828",border:"1px solid rgba(0,200,150,0.22)",borderRadius:20,padding:"32px 28px",width:"100%",maxWidth:340}}>
        <div style={{fontSize:26,textAlign:"center",marginBottom:8}}>🔒</div>
        <h2 style={{fontSize:17,fontWeight:700,textAlign:"center",marginBottom:4}}>Panel Admin</h2>
        <p style={{fontSize:12,color:"#4B5A77",textAlign:"center",marginBottom:22}}>DentalDX</p>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="Contraseña"
          style={{width:"100%",background:"rgba(255,255,255,0.06)",
            border:`1px solid ${passErr?"#F472B6":"rgba(255,255,255,0.1)"}`,borderRadius:10,
            padding:"11px 13px",color:"#E2E8F4",fontFamily:"inherit",fontSize:14,
            boxSizing:"border-box",marginBottom:10,transition:"border 0.2s"}}/>
        {passErr && <div style={{fontSize:11,color:"#F472B6",marginBottom:8,textAlign:"center"}}>Contraseña incorrecta</div>}
        <button onClick={login} style={{width:"100%",background:"linear-gradient(135deg,#00C896,#4FACFE)",
          border:"none",borderRadius:11,padding:"12px",color:"#080E1A",
          fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          Entrar →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:"100vh",background:"#080E1A",color:"#E2E8F4",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0C1628,#080E1A)",
        borderBottom:"1px solid rgba(0,200,150,0.12)",padding:"14px 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#00C896,#4FACFE)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🦷</div>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>DentalDX Admin</div>
            <div style={{fontSize:10,color:"#4B5A77"}}>{clinics.length} consultorio{clinics.length!==1?"s":""} registrados</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={loadClinics} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8,padding:"6px 12px",color:"#E2E8F4",fontFamily:"inherit",fontSize:12,cursor:"pointer"}}>
            🔄 Actualizar
          </button>
          <a href="/" style={{background:"rgba(0,200,150,0.12)",border:"1px solid rgba(0,200,150,0.25)",
            borderRadius:8,padding:"6px 12px",color:"#00C896",fontFamily:"inherit",fontSize:12,textDecoration:"none"}}>
            ← App
          </a>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* Lista */}
        <div style={{width:280,borderRight:"1px solid rgba(255,255,255,0.06)",overflowY:"auto",padding:"12px"}}>
          {loading ? (
            <div style={{textAlign:"center",color:"#4B5A77",padding:20,fontSize:12}}>Cargando…</div>
          ) : clinics.length === 0 ? (
            <div style={{textAlign:"center",color:"#4B5A77",padding:20,fontSize:12}}>Sin consultorios aún</div>
          ) : clinics.map(c=>(
            <div key={c.id} onClick={()=>setSelected(JSON.parse(JSON.stringify(c)))}
              style={{background:selected?.id===c.id?"rgba(0,200,150,0.08)":"rgba(255,255,255,0.025)",
                border:`1px solid ${selected?.id===c.id?"rgba(0,200,150,0.25)":"rgba(255,255,255,0.06)"}`,
                borderRadius:10,padding:"11px 12px",marginBottom:7,cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{c.clinic_name}</div>
              {c.doctor_name && <div style={{fontSize:11,color:"#4FACFE",marginBottom:3}}>{c.doctor_name}</div>}
              <div style={{fontSize:10,color:"#4B5A77"}}>
                {new Date(c.updated_at).toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})}
                {" · "}
                {new Date(c.updated_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
          {!selected ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#4B5A77",fontSize:13}}>
              Seleccioná un consultorio para ver y editar sus datos
            </div>
          ) : (
            <ClinicDetail
              clinic={selected}
              updateField={updateField}
              onSave={saveClinic}
              onDelete={()=>deleteClinic(selected.id)}
              saving={saving}
              saveMsg={saveMsg}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ClinicDetail({ clinic, updateField, onSave, onDelete, saving, saveMsg }) {
  const state = clinic.data || {}
  const enriched = useMemo(() =>
    (state.treatments||[]).map(t => ({ ...t, ...calcTreatment(t, state.supplies||{}, state.usdRate||1200) })),
    [state]
  )
  const sorted     = useMemo(()=>[...enriched].sort((a,b)=>b.revPerMin-a.revPerMin),[enriched])
  const totalFixed = useMemo(()=>(state.fixed||[]).reduce((s,c)=>s+c.amount,0),[state])

  return (
    <div style={{maxWidth:700}}>

      {/* Header actions */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:2}}>{clinic.clinic_name}</h2>
          <div style={{fontSize:11,color:"#4B5A77"}}>
            ID: {clinic.id.slice(0,8)}… · Última actualización: {new Date(clinic.updated_at).toLocaleString("es-AR")}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saveMsg && <span style={{fontSize:12,color:"#00C896"}}>{saveMsg}</span>}
          <button onClick={onSave} disabled={saving}
            style={{background:"linear-gradient(135deg,#00C896,#4FACFE)",border:"none",borderRadius:9,
              padding:"8px 16px",color:"#080E1A",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            {saving?"Guardando…":"💾 Guardar"}
          </button>
          <button onClick={onDelete}
            style={{background:"rgba(244,114,182,0.12)",border:"1px solid rgba(244,114,182,0.3)",
              borderRadius:9,padding:"8px 12px",color:"#F472B6",fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>
            🗑️
          </button>
        </div>
      </div>

      {/* Datos básicos */}
      <Section title="Datos del Consultorio">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {label:"Nombre del Consultorio",path:"clinic_name",val:clinic.clinic_name},
            {label:"Odontólogo/a",           path:"doctor_name",val:clinic.doctor_name||""},
          ].map(f=>(
            <div key={f.path}>
              <Label>{f.label}</Label>
              <AdminInput value={f.val} onChange={v=>updateField(f.path,v)}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
          <div>
            <Label>USD Rate</Label>
            <AdminInput type="number" value={state.usdRate||1200} onChange={v=>updateField("data.usdRate",+v)}/>
          </div>
          <div>
            <Label>Meta de Ingreso ($)</Label>
            <AdminInput type="number" value={state.incomeGoal||0} onChange={v=>updateField("data.incomeGoal",+v)}/>
          </div>
        </div>
      </Section>

      {/* Costos fijos */}
      <Section title="Costos Fijos">
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {(state.fixed||[]).map((c,i)=>(
            <div key={c.id} style={{display:"flex",gap:8,alignItems:"center"}}>
              <AdminInput value={c.name} onChange={v=>updateField(`data.fixed.${i}.name`,v)} style={{flex:1}}/>
              <AdminInput type="number" value={c.amount} onChange={v=>updateField(`data.fixed.${i}.amount`,+v)} style={{width:130}}/>
              <span style={{fontSize:11,color:"#4B5A77",minWidth:40,textAlign:"right"}}>{fmtK(c.amount)}</span>
            </div>
          ))}
          <div style={{fontSize:12,fontWeight:700,color:"#F472B6",marginTop:4,textAlign:"right"}}>
            Total: {fmt(totalFixed)}/mes
          </div>
        </div>
      </Section>

      {/* Tratamientos */}
      <Section title="Tratamientos">
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {enriched.map((t,i)=>(
            <div key={t.id} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${t.color}33`,borderRadius:10,padding:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:t.color}}/>
                  <span style={{fontWeight:600,fontSize:13}}>{t.name}</span>
                </div>
                <div style={{fontSize:11,color:t.color,fontWeight:700}}>
                  {fmtK(t.revPerMin)}/min · {t.marginPct.toFixed(0)}%
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {label:"$/sesión",   field:"pricePerSession", val:t.pricePerSession},
                  {label:"Min/sesión", field:"timePerSession",  val:t.timePerSession},
                  {label:"Sesiones",   field:"sessions",        val:t.sessions},
                ].map(f=>(
                  <div key={f.field}>
                    <Label>{f.label}</Label>
                    <AdminInput type="number" value={f.val}
                      onChange={v=>updateField(`data.treatments.${i}.${f.field}`,+v)}/>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:"#4B5A77",marginTop:6}}>
                Total: {fmt(t.totalPrice)} · Insumos: {fmt(t.totalCost)} · Margen: {fmt(t.margin)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Ranking resumen */}
      <Section title="Ranking Actual">
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
            {["#","Tratamiento","Total","$/min","Margen"].map(h=>(
              <th key={h} style={{padding:"6px 8px",textAlign:"left",color:"#4B5A77",fontWeight:600,fontSize:10}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{sorted.map((t,i)=>(
            <tr key={t.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <td style={{padding:"6px 8px",color:"#4B5A77",fontSize:10}}>#{i+1}</td>
              <td style={{padding:"6px 8px",fontWeight:500}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:t.color,display:"inline-block",marginRight:6}}/>
                {t.name}
              </td>
              <td style={{padding:"6px 8px"}}>{fmt(t.totalPrice)}</td>
              <td style={{padding:"6px 8px",color:t.color,fontWeight:700}}>{fmtK(t.revPerMin)}</td>
              <td style={{padding:"6px 8px"}}>{t.marginPct.toFixed(0)}%</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",
      borderRadius:12,padding:"16px",marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:600,color:"#8896B0",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.5px"}}>{title}</div>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <div style={{fontSize:9,color:"#4B5A77",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.4px"}}>{children}</div>
}

function AdminInput({ value, onChange, type="text", style={} }) {
  return (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",background:"rgba(255,255,255,0.06)",
        border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,
        padding:"7px 10px",color:"#E2E8F4",fontFamily:"inherit",fontSize:12,
        boxSizing:"border-box",...style}}/>
  )
}
