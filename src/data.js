export const DEFAULT_USD = 1200

export const DEFAULT_SUPPLIES = {
  anestesia:    { name:"Anestesia",             pkgPrice:60400,  pkgQty:50,  usd:false },
  agujas:       { name:"Agujas",                pkgPrice:20000,  pkgQty:100, usd:false },
  kitCirugia:   { name:"Kit de Cirugía",        pkgPrice:10000,  pkgQty:1,   usd:false },
  solucion:     { name:"Solución Fisiológica",  pkgPrice:7000,   pkgQty:1,   usd:false },
  tornillo:     { name:"Tornillo Implante",     pkgPrice:90000,  pkgQty:1,   usd:false },
  bisturi:      { name:"Bisturí + Sutura",      pkgPrice:7000,   pkgQty:1,   usd:false },
  ayudante:     { name:"Ayudante",              pkgPrice:80000,  pkgQty:1,   usd:false },
  brackets_met: { name:"Brackets Metálicos",    pkgPrice:46426,  pkgQty:1,   usd:false },
  brackets_zaf: { name:"Brackets Zafiro",       pkgPrice:320000, pkgQty:1,   usd:false },
  arcos:        { name:"Arcos NiTi (×100)",     pkgPrice:40000,  pkgQty:100, usd:false },
  disco_circ:   { name:"Disco Circonio (×5)",   pkgPrice:112000, pkgQty:5,   usd:false },
  pasta_prof:   { name:"Pasta Profiláctica",    pkgPrice:14780,  pkgQty:18,  usd:false },
  copa_goma:    { name:"Copa de Goma (×100)",   pkgPrice:8000,   pkgQty:100, usd:false },
  babero:       { name:"Baberos (×100)",        pkgPrice:3000,   pkgQty:100, usd:false },
  guantes:      { name:"Guantes (×100)",        pkgPrice:8000,   pkgQty:100, usd:false },
  eyector:      { name:"Eyector Saliva (×100)", pkgPrice:3000,   pkgQty:100, usd:false },
  resina:       { name:"Resina Compuesta",       pkgPrice:8000,   pkgQty:10,  usd:false },
  gel_blanq:    { name:"Gel Blanqueador (kit)",  pkgPrice:15000,  pkgQty:1,   usd:false },
  limas:        { name:"Limas Endodoncia (kit)", pkgPrice:12000,  pkgQty:1,   usd:false },
  sellador:     { name:"Resina Selladora",       pkgPrice:5000,   pkgQty:20,  usd:false },
  gasa:         { name:"Gasas (x100)",           pkgPrice:3000,   pkgQty:100, usd:false },
}

export const DEFAULT_TREATMENTS = [
  {
    id:"ortod_met", name:"Ortodoncia Metálica", color:"#00C896",
    pricePerSession:90000, sessions:24, timePerSession:30, paymentType:"Cuotas mensuales",
    supplies:[
      { key:"brackets_met", qty:1, when:"once" },
      { key:"arcos",        qty:1, when:"each" },
      { key:"agujas",       qty:2, when:"each" },
    ],
  },
  {
    id:"ortod_zaf", name:"Ortodoncia Zafiro", color:"#4FACFE",
    pricePerSession:120000, sessions:24, timePerSession:30, paymentType:"Cuotas mensuales",
    supplies:[
      { key:"brackets_zaf", qty:1, when:"once" },
      { key:"arcos",        qty:1, when:"each" },
      { key:"agujas",       qty:2, when:"each" },
    ],
  },
  {
    id:"implante", name:"Implante", color:"#F7971E",
    pricePerSession:652500, sessions:2, timePerSession:90, paymentType:"2 Cuotas",
    supplies:[
      { key:"anestesia",  qty:4, when:"each" },
      { key:"agujas",     qty:2, when:"each" },
      { key:"kitCirugia", qty:1, when:"once" },
      { key:"solucion",   qty:1, when:"once" },
      { key:"tornillo",   qty:1, when:"once" },
      { key:"bisturi",    qty:1, when:"once" },
      { key:"ayudante",   qty:1, when:"once" },
    ],
  },
  {
    id:"corona", name:"Corona (fresadora propia)", color:"#A78BFA",
    pricePerSession:435000, sessions:3, timePerSession:100, paymentType:"3 Cuotas",
    supplies:[
      { key:"anestesia",  qty:4, when:"once" },
      { key:"agujas",     qty:2, when:"once" },
      { key:"disco_circ", qty:1, when:"once" },
    ],
  },
  {
    id:"corona_diente", name:"Corona sobre Diente Propio", color:"#F472B6",
    pricePerSession:130500, sessions:10, timePerSession:56, paymentType:"3 Cuotas",
    supplies:[
      { key:"anestesia",  qty:4, when:"once" },
      { key:"agujas",     qty:2, when:"once" },
      { key:"disco_circ", qty:1, when:"once" },
    ],
  },
  {
    id:"ortopedia", name:"Ortopedia", color:"#FB923C",
    pricePerSession:840000, sessions:2, timePerSession:90, paymentType:"Entrega+Cuotas",
    supplies:[
      { key:"anestesia", qty:4, when:"once" },
      { key:"agujas",    qty:2, when:"once" },
    ],
    extraCost:250000, extraCostLabel:"Aparato ortopédico",
  },
  {
    id:"limpieza", name:"Limpieza", color:"#34D399",
    pricePerSession:90000, sessions:2, timePerSession:35, paymentType:"Pago Único (2 ses.)",
    supplies:[
      { key:"pasta_prof", qty:1, when:"each" },
      { key:"copa_goma",  qty:1, when:"each" },
      { key:"babero",     qty:1, when:"each" },
      { key:"guantes",    qty:2, when:"each" },
      { key:"eyector",    qty:1, when:"each" },
    ],
  },
]

export const DEFAULT_FIXED = [
  { id:1, name:"Empleados",         amount:1900000 },
  { id:2, name:"Limpieza",          amount:280000  },
  { id:3, name:"Contador",          amount:450000  },
  { id:4, name:"Alarma y Teléfono", amount:50000   },
  { id:5, name:"Servicios",         amount:150000  },
]

export const defaultState = () => ({
  clinicName:"", doctorName:"",
  usdRate: DEFAULT_USD,
  supplies: DEFAULT_SUPPLIES,
  treatments: DEFAULT_TREATMENTS,
  fixed: DEFAULT_FIXED,
  incomeGoal: 500000,
  workMin: 2400,
  agenda: Object.fromEntries(DEFAULT_TREATMENTS.map(t=>[t.id,0])),
  lastSaved: null,
})

export const fmt  = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n)
export const fmtK = n => n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${Math.round(n)}`
export const today = () => new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"})

export function calcTreatment(t, supplies, usdRate) {
  const totalPrice   = t.pricePerSession * t.sessions
  const totalTimeMin = t.timePerSession  * t.sessions
  let   totalCost    = 0
  const breakdown    = []

  for (const s of t.supplies) {
    const sup = supplies[s.key]; if (!sup) continue
    const unitPrice    = (sup.usd ? sup.pkgPrice * usdRate : sup.pkgPrice) / sup.pkgQty
    const effectiveQty = s.when === "each" ? s.qty * t.sessions : s.qty
    const lineCost     = unitPrice * effectiveQty
    totalCost += lineCost
    breakdown.push({ name:sup.name, qty:effectiveQty, rawQty:s.qty, when:s.when, lineCost })
  }

  if (t.extraCost) {
    totalCost += t.extraCost
    breakdown.push({ name:t.extraCostLabel, qty:1, when:"once", lineCost:t.extraCost })
  }

  const margin    = totalPrice - totalCost
  const marginPct = totalPrice > 0 ? (margin / totalPrice) * 100 : 0
  const revPerMin = totalTimeMin > 0 ? margin / totalTimeMin : 0

  return { totalPrice, totalTimeMin, totalCost, breakdown, margin, marginPct, revPerMin }
}

export function generateRecommendations(sorted, totalFixed, incomeGoal, workMin) {
  const best   = sorted[0]
  const worst  = sorted[sorted.length - 1]
  const target = totalFixed + incomeGoal
  const recs   = []

  if (best) {
    const needed    = Math.ceil(target / best.margin)
    const minsNeed  = Math.ceil((target / best.margin) * best.totalTimeMin)
    recs.push(`🏆 Priorizar ${best.name}: rinde ${fmtK(best.revPerMin)}/min con ${best.marginPct.toFixed(0)}% de margen. Para alcanzar la meta necesitás ${needed} tratamiento${needed>1?"s":""} completos (${minsNeed.toLocaleString()} min — ${((minsNeed/workMin)*100).toFixed(0)}% del tiempo disponible).`)
  }

  if (worst && best && worst.revPerMin < best.revPerMin * 0.4)
    recs.push(`⚠️ ${worst.name} rinde ${fmtK(worst.revPerMin)}/min — menos del 40% del mejor. Revisá el precio por sesión o la cantidad de sesiones estimadas.`)

  const ortod = sorted.find(t => t.id?.startsWith("ortod"))
  if (ortod)
    recs.push(`📅 Ortodoncia genera ingresos recurrentes por ${ortod.sessions} meses. Cada paciente activo aporta ${fmt(ortod.pricePerSession)}/mes de ingreso predecible — ideal para estabilizar el flujo de caja.`)

  const limpieza = sorted.find(t => t.id === "limpieza")
  if (limpieza)
    recs.push(`💡 Limpieza tiene el menor costo de insumos (${fmt(limpieza.totalCost)}) y alta frecuencia. Es el mejor tratamiento de captación y fidelización.`)

  recs.push(`📈 Especialización recomendada: concentrar el 70% de la agenda en los 2 tratamientos más rentables permite cubrir costos fijos con menor volumen y mayor previsibilidad.`)

  return recs
}

// ─── SUMINISTROS ADICIONALES PARA NUEVOS TRATAMIENTOS ────────────────────────
export const EXTRA_SUPPLIES = {
  resina:      { name:"Resina Compuesta",       pkgPrice:8000,  pkgQty:10, usd:false },
  gel_blanq:   { name:"Gel Blanqueador (kit)",  pkgPrice:15000, pkgQty:1,  usd:false },
  limas:       { name:"Limas Endodoncia (kit)", pkgPrice:12000, pkgQty:1,  usd:false },
  sellador:    { name:"Resina Selladora",       pkgPrice:5000,  pkgQty:20, usd:false },
  gasa:        { name:"Gasas (x100)",           pkgPrice:3000,  pkgQty:100,usd:false },
}

// ─── CATÁLOGO DE TRATAMIENTOS PREDEFINIDOS ────────────────────────────────────
const COLORS = ["#06B6D4","#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#14B8A6","#F97316","#6366F1","#84CC16","#E11D48","#0EA5E9"]

export const TREATMENT_CATALOG = [
  {
    id:"caries_simple", name:"Arreglo de Caries Simple", color:"#06B6D4",
    pricePerSession:60000, sessions:1, timePerSession:45, paymentType:"Pago Único",
    supplies:[
      { key:"anestesia", qty:2, when:"once" },
      { key:"agujas",    qty:1, when:"once" },
      { key:"resina",    qty:1, when:"once" },
    ],
  },
  {
    id:"caries_complejo", name:"Arreglo de Caries Complejo", color:"#8B5CF6",
    pricePerSession:90000, sessions:1, timePerSession:60, paymentType:"Pago Único",
    supplies:[
      { key:"anestesia", qty:3, when:"once" },
      { key:"agujas",    qty:2, when:"once" },
      { key:"resina",    qty:2, when:"once" },
    ],
  },
  {
    id:"endodoncia_uni", name:"Endodoncia Unirradicular", color:"#EC4899",
    pricePerSession:150000, sessions:2, timePerSession:60, paymentType:"2 Cuotas",
    supplies:[
      { key:"anestesia", qty:4, when:"each" },
      { key:"agujas",    qty:2, when:"each" },
      { key:"limas",     qty:1, when:"once" },
    ],
  },
  {
    id:"endodoncia_multi", name:"Endodoncia Multirradicular", color:"#F59E0B",
    pricePerSession:200000, sessions:3, timePerSession:60, paymentType:"3 Cuotas",
    supplies:[
      { key:"anestesia", qty:4, when:"each" },
      { key:"agujas",    qty:2, when:"each" },
      { key:"limas",     qty:1, when:"once" },
    ],
  },
  {
    id:"extraccion_simple", name:"Extracción Simple", color:"#10B981",
    pricePerSession:50000, sessions:1, timePerSession:30, paymentType:"Pago Único",
    supplies:[
      { key:"anestesia", qty:3, when:"once" },
      { key:"agujas",    qty:2, when:"once" },
      { key:"gasa",      qty:4, when:"once" },
    ],
  },
  {
    id:"extraccion_muela", name:"Extracción Muela del Juicio", color:"#3B82F6",
    pricePerSession:120000, sessions:1, timePerSession:60, paymentType:"Pago Único",
    supplies:[
      { key:"anestesia", qty:4, when:"once" },
      { key:"agujas",    qty:2, when:"once" },
      { key:"bisturi",   qty:1, when:"once" },
      { key:"ayudante",  qty:1, when:"once" },
      { key:"gasa",      qty:4, when:"once" },
    ],
  },
  {
    id:"blanqueamiento", name:"Blanqueamiento Consultorio", color:"#EF4444",
    pricePerSession:80000, sessions:2, timePerSession:60, paymentType:"Pago Único",
    supplies:[
      { key:"gel_blanq", qty:1, when:"once" },
      { key:"babero",    qty:1, when:"each" },
      { key:"guantes",   qty:2, when:"each" },
    ],
  },
  {
    id:"carillas", name:"Carillas de Porcelana", color:"#14B8A6",
    pricePerSession:200000, sessions:3, timePerSession:90, paymentType:"3 Cuotas",
    supplies:[
      { key:"anestesia", qty:3, when:"once" },
      { key:"agujas",    qty:2, when:"once" },
    ],
  },
  {
    id:"protesis_parcial", name:"Prótesis Removible Parcial", color:"#F97316",
    pricePerSession:250000, sessions:3, timePerSession:60, paymentType:"3 Cuotas",
    supplies:[],
  },
  {
    id:"protesis_total", name:"Prótesis Removible Total", color:"#6366F1",
    pricePerSession:350000, sessions:4, timePerSession:60, paymentType:"4 Cuotas",
    supplies:[],
  },
  {
    id:"selladores", name:"Selladores", color:"#84CC16",
    pricePerSession:30000, sessions:1, timePerSession:30, paymentType:"Pago Único",
    supplies:[
      { key:"sellador", qty:1, when:"once" },
      { key:"agujas",   qty:1, when:"once" },
    ],
  },
  {
    id:"radiografia", name:"Radiografía", color:"#E11D48",
    pricePerSession:20000, sessions:1, timePerSession:15, paymentType:"Pago Único",
    supplies:[],
  },
  {
    id:"consulta", name:"Consulta / Diagnóstico", color:"#0EA5E9",
    pricePerSession:25000, sessions:1, timePerSession:20, paymentType:"Pago Único",
    supplies:[],
  },
]
