import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const R = '#C8000A'
const G = '#C9A84C'
const C0 = '#0F0F0F'
const C1 = '#141414'
const C2 = '#1E1E1E'
const C3 = '#252525'
const IV = '#F5F0E8'
const MU = '#666'
const BO = '#2a2a2a'

const MODES = [
  { id: 'consulta',  label: 'Consulta Rápida',     icon: '⚡', desc: 'Pregunta lo que necesitas. Respuesta inmediata.' },
  { id: 'tactica',   label: 'Análisis Táctico',    icon: '🎯', desc: 'Análisis profundo de sistemas y modelos de juego.' },
  { id: 'scouting',  label: 'Reporte de Scouting', icon: '📋', desc: 'Genera un reporte PDF listo para el camerino.' },
]

const today = new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

const MUNDIAL_CONTEXT = `

CONTEXTO MUNDIAL 2026 — Fecha actual: ${today}
El Mundial FIFA 2026 se disputa en Estados Unidos, México y Canadá. Ya comenzó la fase de grupos.
Resultados conocidos del 17 de junio de 2026:
- GRUPO J: Argentina 3-0 Argelia (Messi igualó récord de Klose con 16 goles en mundiales)
- GRUPO K: Portugal 1-1 RD Congo / Austria 3-1 Jordania
- GRUPO L: Inglaterra 4-2 Croacia (Kane x2 12' 42', Bellingham 47', Rashford 85' / Baturina 36', Musa 45'+5')
- Colombia juega su primer partido el 18 de junio vs Uzbekistán
Responde siempre con base en este contexto actualizado. Si no tienes el dato exacto, indícalo con honestidad y analiza con lo disponible.`

const SYSTEMS = {
  consulta: `Eres NÉFES INTEL PRO, el agente de inteligencia futbolística más avanzado en español, creado por Nelson Alfonso Flórez Jiménez — Director Técnico con Licencia CONMEBOL PRO N°1816, exjugador profesional con 17 años de trayectoria y 15 como entrenador de alto rendimiento.

Tu diferencial único: analizas el SER del jugador y del equipo — la dimensión humana que ninguna plataforma de datos puede medir.

Modo activo: CONSULTA RÁPIDA.
Responde con precisión y velocidad. Directo al punto. Lenguaje técnico-deportivo de alto nivel.
Filosofía NÉFES: SER · HACER · TENER.
Responde siempre en español.${MUNDIAL_CONTEXT}`,

  tactica: `Eres NÉFES INTEL PRO, el agente de inteligencia futbolística más avanzado en español, creado por Nelson Alfonso Flórez Jiménez — Director Técnico con Licencia CONMEBOL PRO N°1816.

Tu diferencial único: analizas el SER del jugador y del equipo — la dimensión humana que ninguna plataforma de datos puede medir.

Modo activo: ANÁLISIS TÁCTICO PROFUNDO.
Estructura tus respuestas así:
1. DIAGNÓSTICO — qué está pasando tácticamente
2. ANÁLISIS — por qué ocurre, causas estructurales
3. PROPUESTA — solución o ajuste concreto
4. CONCLUSIÓN NÉFES — visión desde SER · HACER · TENER

Responde siempre en español.${MUNDIAL_CONTEXT}`,

  scouting: `Eres NÉFES INTEL PRO, el agente de inteligencia futbolística más avanzado en español, creado por Nelson Alfonso Flórez Jiménez — Director Técnico con Licencia CONMEBOL PRO N°1816.

Tu diferencial único: analizas el SER del jugador y del equipo — la dimensión humana que ninguna plataforma de datos puede medir.

Modo activo: REPORTE DE SCOUTING.
Genera documentos estructurados con este formato EXACTO:

═══════════════════════════════════════
NÉFES INTEL PRO — REPORTE DE SCOUTING
═══════════════════════════════════════
OBJETO DE ANÁLISIS: [nombre]
FECHA: [fecha actual]
ELABORADO POR: NÉFES INTEL PRO
DT SUPERVISOR: Nelson A. Flórez J. — Lic. CONMEBOL PRO N°1816
───────────────────────────────────────

1. FASE OFENSIVA
   1.1 Estructura de salida
   1.2 Acumulación (interior/exterior)
   1.3 Generador principal de ventajas
   1.4 Patrones de finalización

2. FASE DEFENSIVA
   2.1 Bloque defensivo
   2.2 Presión y triggers
   2.3 Coberturas y permutas
   2.4 Vulnerabilidades estructurales

3. TRANSICIONES
   3.1 Transición ofensiva
   3.2 Transición defensiva

4. BALÓN PARADO
   4.1 Córners a favor / en contra
   4.2 Tiros libres

5. EL SER DEL EQUIPO
   [Cultura, mentalidad, liderazgos, identidad bajo presión]

6. JUGADORES CLAVE
   [Perfil de 2-3 jugadores determinantes]

7. RECOMENDACIONES TÁCTICAS

8. CONCLUSIÓN NÉFES
   SER · HACER · TENER

═══════════════════════════════════════
NÉFES INTEL PRO · SER · HACER · TENER
═══════════════════════════════════════

Responde siempre en español.${MUNDIAL_CONTEXT}`
}

const SUGGESTIONS = {
  consulta: [
    '¿Cuál es la estructura ofensiva de Argentina en el Mundial 2026?',
    '¿Qué métricas físicas son clave para monitorear fatiga en competencia?',
    '¿Cómo presionar en bloque alto contra un equipo que juega desde el portero?',
  ],
  tactica: [
    'Analiza las debilidades estructurales del 4-2-3-1 en transición defensiva',
    '¿Cómo explotar los espacios entre líneas contra una defensa de 5?',
    'Explica la diferencia entre pressing situacional y pressing permanente',
  ],
  scouting: [
    'Genera un reporte de scouting de la Selección Argentina en el Mundial 2026',
    'Genera un reporte de scouting de Francia en el Mundial 2026',
    'Genera un reporte de scouting de Brasil en el Mundial 2026',
  ],
}

function TypingIndicator() {
  return (
    <div style={{ display:'flex', marginBottom:12 }}>
      <div style={{ width:28,height:28,borderRadius:'50%',background:R,border:`1px solid ${G}33`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginRight:8,marginTop:2 }}>
        <span style={{ color:IV,fontSize:9,fontWeight:700 }}>NI</span>
      </div>
      <div style={{ padding:'12px 16px',borderRadius:'4px 14px 14px 14px',background:C2,border:`1px solid ${BO}`,display:'flex',gap:5,alignItems:'center' }}>
        {[0,1,2].map(i => <div key={i} style={{ width:7,height:7,borderRadius:'50%',background:G,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  )
}

const mdComponents = {
  h1: ({children}) => <h1 style={{ color:G,fontSize:16,fontWeight:800,margin:'14px 0 8px',borderBottom:`1px solid ${G}33`,paddingBottom:6,letterSpacing:0.5 }}>{children}</h1>,
  h2: ({children}) => <h2 style={{ color:G,fontSize:14,fontWeight:700,margin:'12px 0 6px',letterSpacing:0.3 }}>{children}</h2>,
  h3: ({children}) => <h3 style={{ color:IV,fontSize:13,fontWeight:700,margin:'10px 0 4px' }}>{children}</h3>,
  strong: ({children}) => <strong style={{ color:IV,fontWeight:700 }}>{children}</strong>,
  em: ({children}) => <em style={{ color:`${IV}cc`,fontStyle:'italic' }}>{children}</em>,
  p: ({children}) => <p style={{ margin:'6px 0',lineHeight:1.8 }}>{children}</p>,
  ul: ({children}) => <ul style={{ margin:'6px 0',paddingLeft:20 }}>{children}</ul>,
  ol: ({children}) => <ol style={{ margin:'6px 0',paddingLeft:20 }}>{children}</ol>,
  li: ({children}) => <li style={{ margin:'3px 0',lineHeight:1.7 }}>{children}</li>,
  blockquote: ({children}) => <blockquote style={{ borderLeft:`3px solid ${G}`,margin:'8px 0',paddingLeft:12,color:`${IV}bb`,fontStyle:'italic' }}>{children}</blockquote>,
  hr: () => <hr style={{ border:'none',borderTop:`1px solid #2a2a2a`,margin:'12px 0' }} />,
  code: ({inline,children}) => inline
    ? <code style={{ background:'#1a1a1a',color:G,padding:'2px 6px',borderRadius:4,fontSize:12,fontFamily:'monospace' }}>{children}</code>
    : <pre style={{ background:'#1a1a1a',color:IV,padding:'12px 14px',borderRadius:8,overflowX:'auto',fontSize:12,fontFamily:'monospace',margin:'8px 0',border:`1px solid #2a2a2a` }}><code>{children}</code></pre>,
}

function Message({ msg, onPrint }) {
  const isUser = msg.role === 'user'
  return (
    <div className="fade-in" style={{ display:'flex',justifyContent:isUser?'flex-end':'flex-start',marginBottom:14 }}>
      {!isUser && (
        <div style={{ width:28,height:28,borderRadius:'50%',background:R,border:`1px solid ${G}33`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginRight:8,marginTop:2 }}>
          <span style={{ color:IV,fontSize:9,fontWeight:700 }}>NI</span>
        </div>
      )}
      <div style={{ maxWidth:'80%' }}>
        <div style={{ padding:'12px 16px',borderRadius:isUser?'14px 14px 4px 14px':'4px 14px 14px 14px',background:isUser?R:C2,color:IV,fontSize:msg.isScouting?12:13.5,lineHeight:1.8,border:isUser?'none':`1px solid ${BO}`,fontFamily:msg.isScouting?'monospace':'inherit' }}>
          {isUser ? (
            <span style={{ whiteSpace:'pre-wrap' }}>{msg.content}</span>
          ) : msg.isScouting ? (
            <span style={{ whiteSpace:'pre-wrap' }}>{msg.content}</span>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {msg.isScouting && (
          <button onClick={() => onPrint(msg.content)} style={{ marginTop:8,padding:'7px 14px',background:'transparent',border:`1px solid ${G}`,borderRadius:6,color:G,fontSize:11,cursor:'pointer',fontWeight:600,fontFamily:'inherit',display:'flex',alignItems:'center',gap:6 }}>
            🖨️ Imprimir / Guardar PDF
          </button>
        )}
      </div>
      {isUser && (
        <div style={{ width:28,height:28,borderRadius:'50%',background:C2,border:`1px solid ${BO}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:8,marginTop:2 }}>
          <span style={{ color:MU,fontSize:9,fontWeight:700 }}>TÚ</span>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState('consulta')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef(null)
  const taRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, loading])
  useEffect(() => { setMessages([]); setStarted(false); setError(null) }, [mode])

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setStarted(true)
    setError(null)

    const newMessages = [...messages, { role:'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: mode === 'scouting' ? 1200 : 2048,
          system: SYSTEMS[mode],
          messages: newMessages.map(m => ({ role:m.role, content:m.content })),
        }),
      })

      const data = await res.json()
      
      const reply = data.content?.filter(b => b.type==='text').map(b => b.text).join('\n') || 'Sin respuesta.'
      const isScouting = mode === 'scouting' && reply.includes('REPORTE DE SCOUTING')
      setMessages([...newMessages, { role:'assistant', content:reply, isScouting }])
    } catch(e) {
      setError('Error de conexión. Intenta nuevamente.')
    }
    setLoading(false)
  }

  const handlePrint = (content) => {
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>NÉFES INTEL PRO — Reporte</title><style>body{font-family:monospace;font-size:12px;padding:40px;color:#000;background:#fff;}pre{white-space:pre-wrap;line-height:1.8;}</style></head><body><pre>${content}</pre><script>window.onload=()=>{window.print()}<\/script></body></html>`)
    win.document.close()
  }

  const handleKey = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  const autoResize = (e) => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }
  const currentMode = MODES.find(m => m.id===mode)

  return (
    <div style={{ height:'100vh',display:'flex',flexDirection:'column',background:C0 }}>

      <div style={{ padding:'12px 20px',borderBottom:`1px solid #1a1a1a`,background:C1,display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        <div style={{ width:38,height:38,borderRadius:9,background:R,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${G}33`,flexShrink:0 }}>
          <span style={{ color:IV,fontWeight:800,fontSize:13 }}>NI</span>
        </div>
        <div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ color:IV,fontWeight:800,fontSize:15 }}>NÉFES INTEL</span>
            <span style={{ fontSize:9,fontWeight:700,color:R,letterSpacing:1.5,border:`1px solid ${R}55`,padding:'2px 6px',borderRadius:3 }}>PRO</span>
          </div>
          <span style={{ color:MU,fontSize:10 }}>SER · HACER · TENER · Mundial 2026</span>
        </div>
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:5 }}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:'#22c55e' }} />
          <span style={{ color:MU,fontSize:10 }}>En vivo</span>
        </div>
      </div>

      <div style={{ display:'flex',gap:8,padding:'12px 20px',borderBottom:`1px solid #1a1a1a`,background:C1,flexShrink:0 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{ flex:1,padding:'8px 12px',borderRadius:8,border:`1px solid ${mode===m.id?G+'66':BO}`,background:mode===m.id?G+'15':'transparent',color:mode===m.id?G:MU,fontSize:12,fontWeight:mode===m.id?700:400,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',textAlign:'center' }}>
            <span style={{ marginRight:5 }}>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'20px 16px' }}>
        {!started ? (
          <div style={{ maxWidth:520,margin:'20px auto 0',textAlign:'center' }}>
            <div style={{ width:56,height:56,borderRadius:14,background:R,margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${G}33` }}>
              <span style={{ fontSize:24 }}>{currentMode.icon}</span>
            </div>
            <p style={{ color:IV,fontWeight:700,fontSize:16,marginBottom:4 }}>{currentMode.label}</p>
            <p style={{ color:MU,fontSize:13,marginBottom:24,lineHeight:1.6 }}>{currentMode.desc}</p>
            <div style={{ width:36,height:2,background:G,margin:'0 auto 24px',borderRadius:1 }} />
            <p style={{ color:'#444',fontSize:10,letterSpacing:1.5,fontWeight:600,marginBottom:10,textTransform:'uppercase' }}>Ejemplos</p>
            {SUGGESTIONS[mode].map((s,i) => (
              <button key={i} onClick={() => sendMessage(s)} style={{ display:'block',width:'100%',textAlign:'left',background:C2,border:`1px solid ${BO}`,borderRadius:10,padding:'11px 14px',marginBottom:8,color:'#D0C9BE',fontSize:13,cursor:'pointer',lineHeight:1.5,fontFamily:'inherit' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=G+'55'}
                onMouseLeave={e => e.currentTarget.style.borderColor=BO}
              >{s}</button>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth:720,margin:'0 auto' }}>
            {messages.map((msg,i) => <Message key={i} msg={msg} onPrint={handlePrint} />)}
            {loading && <TypingIndicator />}
            {error && <p style={{ color:'#ef4444',fontSize:12,textAlign:'center',marginTop:8 }}>{error}</p>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div style={{ padding:'12px 16px',borderTop:`1px solid #1a1a1a`,background:C1,flexShrink:0 }}>
        <div style={{ maxWidth:720,margin:'0 auto' }}>
          <div style={{ display:'flex',alignItems:'flex-end',gap:10,background:C2,border:`1px solid ${BO}`,borderRadius:12,padding:'10px 12px' }}>
            <span style={{ color:G,fontSize:16,paddingBottom:2,flexShrink:0 }}>{currentMode.icon}</span>
            <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} onInput={autoResize} rows={1}
              placeholder={`${currentMode.label} — escribe tu consulta...`}
              style={{ flex:1,background:'transparent',border:'none',color:IV,fontSize:14,resize:'none',lineHeight:1.6,maxHeight:120,overflowY:'auto',fontFamily:'inherit',caretColor:G }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim()||loading} style={{ width:36,height:36,borderRadius:8,border:'none',background:input.trim()&&!loading?R:C3,cursor:input.trim()&&!loading?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.15s' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={input.trim()&&!loading?IV:'#444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:7 }}>
            <p style={{ color:'#333',fontSize:10 }}>NÉFES INTEL PRO · SER · HACER · TENER</p>
            <p style={{ color:'#333',fontSize:10 }}>Nelson A. Flórez J. · Lic. CONMEBOL PRO N°1816</p>
          </div>
        </div>
      </div>
    </div>
  )
}
