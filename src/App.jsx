import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Activity, ArrowDownRight, ArrowUpRight, BadgeCheck, Banknote, Bell, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleDollarSign, Clock3, CreditCard, Crown,
  FileBarChart2, FileText, Gauge, Gem, LayoutDashboard, LogOut, Menu, MessageCircle,
  Plus, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Users, Wallet, X,
  Smartphone, MonitorPlay, TrendingUp, CalendarClock, ClipboardList, Send, CircleHelp,
  AlertCircle, Trash2, Edit3, ExternalLink
} from 'lucide-react';

const ADMIN_EMAIL = 'tatianasoto326@gmail.com';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const NAV = [
  { id: 'dashboard', label: 'Mi sede hoy', icon: LayoutDashboard, group: 'Principal' },
  { id: 'models', label: 'Equipo y modelos', icon: Users, group: 'Gestión' },
  { id: 'apps', label: 'Plataformas y metas', icon: MonitorPlay, group: 'Gestión' },
  { id: 'shifts', label: 'Turnos y producción', icon: CalendarDays, group: 'Operación' },
  { id: 'replacements', label: 'Reposiciones', icon: CalendarClock, group: 'Operación' },
  { id: 'debts', label: 'Finanzas', icon: Wallet, group: 'Finanzas' },
  { id: 'reports', label: 'Reportes', icon: FileBarChart2, group: 'Finanzas' },
];
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n || 0));
const number = (n) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(n || 0));
const dateLabel = (d) => d ? new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const safe = (v) => String(v ?? '').trim();

function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email] = useState(ADMIN_EMAIL);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const verifyAdmin = useCallback(async (nextSession) => {
    if (!nextSession?.user?.id) { setIsAdmin(false); setSession(null); return; }
    setCheckingAdmin(true);
    let { data, error } = await supabase.from('admins').select('user_id').eq('user_id', nextSession.user.id).maybeSingle();
    // Bootstrap the first administrator only for the designated email.
    if (!error && !data && nextSession.user.email?.toLowerCase() === ADMIN_EMAIL) {
      const { error: insertError } = await supabase.from('admins').insert({ user_id: nextSession.user.id });
      if (!insertError || insertError.code === '23505') {
        const result = await supabase.from('admins').select('user_id').eq('user_id', nextSession.user.id).maybeSingle();
        data = result.data;
        error = result.error;
      }
    }
    if (error || !data) {
      await supabase.auth.signOut();
      setSession(null);
      setIsAdmin(false);
      setNotice('Este correo no tiene permisos de administración en ELITE CONTROL.');
    } else {
      setSession(nextSession);
      setIsAdmin(true);
      setNotice('');
    }
    setCheckingAdmin(false);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!supabase) { setChecking(false); return () => { alive = false; }; }
    supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setChecking(false);
        if (data.session) verifyAdmin(data.session);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      if (nextSession) setTimeout(() => verifyAdmin(nextSession), 0);
      else { setSession(null); setIsAdmin(false); }
      setChecking(false);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [verifyAdmin]);

  const sendLink = async (e) => {
    e.preventDefault();
    const cleanEmail = safe(email).toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL) { setNotice('El acceso está reservado al correo administrador configurado.'); return; }
    setSending(true); setNotice('');
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    setSending(false);
    setNotice(error ? `No se pudo enviar el acceso: ${error.message}` : 'Enlace enviado. Revisa tu correo y también la carpeta de spam. El enlace abrirá esta misma aplicación.');
  };

  if (!supabase) return <SetupScreen />;
  if (checking || checkingAdmin) return <div className="auth-screen"><div className="auth-card loading-card"><div className="brand-mark"><Crown size={25}/></div><span className="eyebrow">ELITE CONTROL</span><h2>Preparando tu espacio</h2><div className="spinner"/><p>Verificando el acceso privado…</p></div></div>;
  if (session && isAdmin) return children({ session });
  return <div className="auth-screen"><div className="auth-card">
    <div className="brand-mark"><Crown size={26}/></div><span className="eyebrow">PANEL PRIVADO · SEDE VENECIA</span>
    <h1>ELITE <em>CONTROL</em></h1><p className="auth-copy">Tu operación, organizada en un solo lugar.</p>
    <form onSubmit={sendLink} className="auth-form"><label>Correo de administradora</label><div className="input-with-icon"><Smartphone size={17}/><input type="email" value={email} readOnly required aria-label="Correo autorizado de administradora"/></div><button className="primary-btn full" disabled={sending}>{sending ? 'Enviando enlace…' : 'Enviar enlace de acceso'} <ArrowUpRight size={17}/></button></form>
    {notice && <div className={`notice ${notice.startsWith('No se') || notice.startsWith('Este') ? 'notice-error' : 'notice-success'}`}>{notice}</div>}
    <div className="auth-foot"><ShieldCheck size={15}/> Acceso exclusivo para la administradora. Las modelos no ingresan.</div>
  </div><div className="auth-glow"/></div>;
}

function SetupScreen() {
  return <div className="auth-screen"><div className="auth-card"><div className="brand-mark"><Crown size={26}/></div><span className="eyebrow">ELITE CONTROL</span><h1>Falta conectar <em>Supabase</em></h1><p>Configura las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> para activar el acceso.</p></div></div>;
}

function App() {
  return <AuthGate>{({ session }) => <Workspace session={session}/>}</AuthGate>;
}

function Workspace({ session }) {
  const [active, setActive] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [models, setModels] = useState([]);
  const [apps, setApps] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [monitorShifts, setMonitorShifts] = useState([]);
  const [production, setProduction] = useState([]);
  const [replacements, setReplacements] = useState([]);
  const [debts, setDebts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reports, setReports] = useState([]);
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    const specs = [
      ['modelos', 'id,nombre,nickname,codigo,jornada_preferida,estado,notas,telefono,created_at', 'created_at'],
      ['aplicaciones', 'id,nombre,activa', 'created_at'],
      ['modelo_aplicaciones', 'id,modelo_id,aplicacion_id,activa,usuario', 'created_at'],
      ['metas', 'id,modelo_aplicacion_id,tokens_meta,fecha_inicio,fecha_fin,tipo_periodo', 'created_at'],
      ['turnos', 'id,modelo_id,monitor_turno_id,sala,es_apoyo,fecha,jornada,jornadas_cubiertas,tipo_turno,pendientes,hora_inicio,hora_fin,estado,observaciones', 'created_at'],
      ['monitor_turnos', 'id,monitor_id,fecha,jornada,jornadas_cubiertas,tipo_turno,hora_inicio,hora_fin,pendientes,observaciones,estado,created_at,closed_at', 'created_at'],
      ['produccion', 'id,turno_id,modelo_aplicacion_id,tokens,observaciones,registrado_at', 'registrado_at'],
      ['reposiciones', 'id,modelo_id,turno_origen_id,turno_reposicion_id,fecha_limite,horas,motivo,estado,created_at', 'created_at'],
      ['deudas', 'id,modelo_id,concepto,categoria,valor_total,numero_cuotas,valor_cuota_sugerido,fecha_deuda,estado,notas', 'created_at'],
      ['cuotas', 'id,deuda_id,numero_cuota,valor_programado,fecha_vencimiento,estado', 'created_at'],
      ['abonos', 'id,deuda_id,cuota_id,valor,fecha_abono,tipo,referencia,notas', 'created_at'],
      ['reportes', 'id,modelo_id,turno_id,fecha_reporte,contenido,estado,enviado_at,created_at', 'created_at'],
    ];
    try {
      const results = await Promise.all(specs.map(([table, cols, orderBy]) => supabase.from(table).select(cols).order(orderBy, { ascending: false }).then(r => ({ table, ...r }))));
      const failed = results.find(r => r.error);
      if (failed) throw new Error(`${failed.table}: ${failed.error.message}`);
      const data = Object.fromEntries(results.map(r => [r.table, r.data || []]));
      setModels(data.modelos); setApps(data.aplicaciones); setAssignments(data.modelo_aplicaciones); setGoals(data.metas); setShifts(data.turnos); setMonitorShifts(data.monitor_turnos); setProduction(data.produccion); setReplacements(data.reposiciones); setDebts(data.deudas); setInstallments(data.cuotas); setPayments(data.abonos); setReports(data.reportes);
    } catch (e) { setError(e.message || 'No se pudieron cargar los datos.'); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer); }, [toast]);
  const notify = (msg) => setToast(msg);
  const selectedNav = NAV.find(n => n.id === active);
  const todayShifts = shifts.filter(s => s.fecha === today());
  const todayIds = new Set(todayShifts.map(s => s.id));
  const todayTokens = production.filter(p => todayIds.has(p.turno_id)).reduce((sum, p) => sum + Number(p.tokens || 0), 0);
  const activeModels = models.filter(m => m.estado === 'activa').length;
  const pendingRepos = replacements.filter(r => r.estado === 'pendiente').length;
  const openDebt = debts.filter(d => d.estado === 'activa').reduce((sum, d) => sum + Math.max(0, Number(d.valor_total) - payments.filter(p => p.deuda_id === d.id).reduce((x, p) => x + Number(p.valor || 0), 0)), 0);

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="side-brand"><div className="brand-mark small"><Crown size={20}/></div><div><strong>ELITE <em>CONTROL</em></strong><span>ADMINISTRACIÓN</span></div><button className="mobile-close icon-btn" onClick={() => setMobileNav(false)}><X/></button></div>
      <div className="workspace-chip"><div className="workspace-dot"/><div><b>Elite · Venecia</b><span>Espacio de trabajo privado</span></div><ChevronDown size={15}/></div>
      {['Principal','Gestión','Operación','Finanzas'].map(group => <div className="nav-group" key={group}><p>{group}</p>{NAV.filter(n => n.group === group).map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => { setActive(item.id); setMobileNav(false); }}><Icon size={17}/><span>{item.label}</span>{item.id === 'replacements' && pendingRepos > 0 && <i className="nav-count">{pendingRepos}</i>}</button>; })}</div>)}
      <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={17}/><div><b>Datos protegidos</b><span>Solo administradora</span></div></div><div className="profile-row"><div className="avatar">EC</div><div className="profile-text"><b>Administradora</b><span>{session.user.email}</span></div><button className="icon-btn" title="Cerrar sesión" onClick={async () => { await supabase.auth.signOut(); }}><LogOut size={17}/></button></div></div>
    </aside>
    {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Cerrar menú"/>}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><button className="mobile-menu icon-btn" onClick={() => setMobileNav(true)}><Menu/></button><div><div className="breadcrumb">ELITE CONTROL <span>/</span> {selectedNav?.label}</div><div className="today-line"><span className="live-dot"/> Operación privada <span className="muted-dot">·</span> {new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Bogota'})}</div></div></div><div className="top-actions"><button className="icon-btn" title="Actualizar datos" onClick={refresh}><RefreshCw size={17}/></button><div className="top-avatar">EC</div></div></header>
      <div className="page-wrap">
        {error && <div className="notice notice-error page-notice"><AlertCircle size={17}/>{error}<button className="icon-btn" onClick={refresh}><RefreshCw size={15}/></button></div>}
        {loading ? <div className="loading-panel"><div className="spinner"/><span>Cargando información…</span></div> : <>
          {active === 'dashboard' && <Dashboard models={models} apps={apps} shifts={todayShifts} monitorShifts={monitorShifts} session={session} todayTokens={todayTokens} pendingRepos={pendingRepos} openDebt={openDebt} production={production} assignments={assignments} goals={goals} replacements={replacements} refresh={refresh} notify={notify} setActive={setActive}/>}
          {active === 'models' && <ModelsPage models={models} apps={apps} assignments={assignments} refresh={refresh} notify={notify}/>}
          {active === 'apps' && <AppsPage models={models} apps={apps} assignments={assignments} goals={goals} refresh={refresh} notify={notify}/>}
          {active === 'shifts' && <ShiftsPage models={models} apps={apps} assignments={assignments} goals={goals} shifts={shifts} monitorShifts={monitorShifts} production={production} reports={reports} refresh={refresh} notify={notify}/>}
          {active === 'replacements' && <ReplacementsPage models={models} replacements={replacements} refresh={refresh} notify={notify}/>}
          {active === 'debts' && <DebtsPage models={models} debts={debts} installments={installments} payments={payments} refresh={refresh} notify={notify}/>}
          {active === 'reports' && <ReportsPage models={models} shifts={shifts} production={production} assignments={assignments} apps={apps} goals={goals} debts={debts} payments={payments} reports={reports} refresh={refresh} notify={notify}/>}
        </>}
        <footer className="page-footer"><span>ELITE CONTROL <b>·</b> Herramienta administrativa interna</span><span><ShieldCheck size={13}/> Sesión protegida</span></footer>
      </div>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

function PageHeading({ kicker, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{kicker}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function StatCard({ label, value, foot, icon: Icon, accent }) {
  return <div className={`stat-card ${accent || ''}`}><div className="stat-head"><span>{label}</span><span className="stat-icon"><Icon size={18}/></span></div><strong>{value}</strong><small>{foot}</small></div>;
}

function MyShiftPanel({models,apps,assignments,shifts,monitorShifts,session,refresh,notify,setActive}) {
  const [modal,setModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({fecha:today(),jornadas_cubiertas:['tarde'],tipo_turno:'normal',hora_inicio:'14:00',hora_fin:'22:00',modelo_ids:[],apoyo_ids:[],salas:{},horas_fin:{},pendientes:'',observaciones:''});
  const mineToday=monitorShifts.filter(s=>s.fecha===today()&&s.monitor_id===session?.user?.id).sort((a,b)=>String(b.hora_inicio||'').localeCompare(String(a.hora_inicio||'')));
  const selectedModels=[...form.modelo_ids,...form.apoyo_ids].map(id=>models.find(m=>m.id===id)).filter(Boolean);
  const createMyShift=async e=>{
    e.preventDefault();
    if(!form.jornadas_cubiertas.length){notify('Selecciona al menos un horario.');return;}
    setSaving(true);
    const payload={monitor_id:session.user.id,fecha:form.fecha,jornada:form.tipo_turno==='reposicion'?'reposición':form.jornadas_cubiertas.length>1?'doblando':form.jornadas_cubiertas[0],jornadas_cubiertas:form.jornadas_cubiertas,tipo_turno:form.tipo_turno,hora_inicio:form.hora_inicio||null,hora_fin:form.hora_fin||null,pendientes:safe(form.pendientes)||null,observaciones:safe(form.observaciones)||null,estado:'abierto'};
    const {data:created,error:createError}=await supabase.from('monitor_turnos').insert(payload).select('id').single();
    if(createError){setSaving(false);notify('No se pudo registrar tu turno: '+createError.message);return;}
    const makeRows=(ids,es_apoyo)=>ids.map(modelo_id=>({modelo_id,monitor_turno_id:created.id,es_apoyo,sala:safe(form.salas[modelo_id])||null,fecha:form.fecha,jornada:payload.jornada,tipo_turno:form.tipo_turno,jornadas_cubiertas:form.jornadas_cubiertas,hora_inicio:form.hora_inicio||null,hora_fin:safe(form.horas_fin[modelo_id])||form.hora_fin||null,pendientes:safe(form.pendientes)||null,observaciones:safe(form.observaciones)||null,estado:'en_curso'}));
    const rows=[...makeRows(form.modelo_ids,false),...makeRows(form.apoyo_ids,true)];
    if(rows.length){
      const {error:rowsError}=await supabase.from('turnos').insert(rows);
      if(rowsError){await supabase.from('monitor_turnos').delete().eq('id',created.id);setSaving(false);notify('No se pudieron vincular las modelos: '+rowsError.message);return;}
    }
    setSaving(false);setModal(false);
    setForm({fecha:today(),jornadas_cubiertas:['tarde'],tipo_turno:'normal',hora_inicio:'14:00',hora_fin:'22:00',modelo_ids:[],apoyo_ids:[],salas:{},horas_fin:{},pendientes:'',observaciones:''});
    notify('Tu turno quedó registrado. Las jornadas de las modelos se controlan por separado.');
    await refresh();setActive('shifts');
  };
  const closeMyShift=async item=>{
    const {error}=await supabase.from('monitor_turnos').update({estado:'cerrado',closed_at:new Date().toISOString()}).eq('id',item.id);
    if(error){notify('No se pudo cerrar tu turno: '+error.message);return;}
    notify('Tu turno de monitor quedó cerrado. Las modelos que sigan trabajando conservan su jornada abierta.');
    refresh();
  };
  const platformNames=modelId=>assignments.filter(a=>a.modelo_id===modelId&&a.activa).map(a=>apps.find(p=>p.id===a.aplicacion_id)?.nombre).filter(Boolean);
  return <>
    <PageHeading kicker="MI JORNADA" title="Mi turno de hoy" subtitle="Registra tu horario y consulta cuántas modelos tienes, cuáles son, en qué sala trabajan y qué aplicaciones usan." action={<button className="primary-btn" onClick={()=>setModal(true)}><Plus size={16}/> Registrar turno mío</button>}/>
    <section className="panel my-shift-panel">
      <div className="panel-heading"><div><h3>🌸 Mi turno · equipo de hoy</h3><p>Tu jornada y la de cada modelo pueden terminar en horarios diferentes.</p></div><span className="soft-pill">{mineToday.length} turno(s) tuyos hoy</span></div>
      {mineToday.length? <div className="my-shift-sessions">{mineToday.map(item=>{
        const team=shifts.filter(s=>s.monitor_turno_id===item.id);
        const own=team.filter(s=>!s.es_apoyo),support=team.filter(s=>s.es_apoyo);
        return <article className="my-shift-session" key={item.id}>
          <div className="my-shift-session-head"><div><span className="eyebrow">{item.tipo_turno==='doblando'?'DOBLANDO TURNO':item.tipo_turno==='reposicion'?'REPOSICIÓN':'TURNO NORMAL'}</span><h4>{(item.jornadas_cubiertas||[item.jornada]).join(' + ').toUpperCase()}</h4><p><Clock3 size={13}/> {item.hora_inicio||'—'} a {item.hora_fin||'—'} · {dateLabel(item.fecha)}</p></div><span className={'status-pill '+(item.estado==='cerrado'?'cumplido':'en_curso')}>{item.estado==='cerrado'?'Mi turno cerrado':'Mi turno abierto'}</span></div>
          <div className="my-shift-counts"><span><b>{own.length}</b> modelos a tu cargo</span><span><b>{support.length}</b> de apoyo / doblaje</span><span><b>{team.length}</b> en total</span></div>
          {team.length?<div className="my-shift-roster">
            {[{label:'Mis modelos',rows:own},{label:'Modelos de apoyo / doblaje',rows:support}].filter(group=>group.rows.length).map(group=><div className="roster-group" key={group.label}><h5>{group.label}</h5>
              {group.rows.map(row=>{const model=models.find(m=>m.id===row.modelo_id);const names=platformNames(row.modelo_id);return <div className="roster-model" key={row.id}>
                <div className="roster-model-name"><b>{model?.nombre||'Modelo'}</b><small>{row.sala?'Room '+row.sala:'Sala pendiente'} · {row.hora_inicio||'—'} a {row.hora_fin||'—'}</small></div>
                <div className="roster-model-apps"><span>Aplicaciones</span><b>{names.length?names.join(' · '):'Sin aplicaciones asignadas'}</b></div>
                <span className={'status-pill '+(row.estado==='cumplido'?'cumplido':'en_curso')}>{row.estado||'en curso'}</span>
                <button className="text-btn" onClick={()=>setActive('shifts')}>Ver producción <ArrowUpRight size={13}/></button>
              </div>;})}
            </div>)}
          </div>:<p className="empty-roster">Aún no has asociado modelos a este turno. Puedes registrar tu horario igualmente.</p>}
          <div className="my-shift-actions"><button className="secondary-btn small-btn" onClick={()=>setActive('shifts')}>Abrir producción del equipo <ArrowUpRight size={14}/></button>{item.estado!=='cerrado'&&<button className="primary-btn small-btn" onClick={()=>closeMyShift(item)}>Finalizar mi turno de monitor</button>}</div>
          {item.estado!=='cerrado'&&<small className="progress-caption">Al cerrar tu jornada, las modelos que sigan trabajando quedan con su turno abierto.</small>}
        </article>;
      })}</div>:<EmptyInline icon={CalendarClock} title="Todavía no has registrado tu turno" text="Indica tu horario, si doblas jornada y qué modelos tendrás a cargo o de apoyo." action={<button className="primary-btn small-btn" onClick={()=>setModal(true)}><Plus size={14}/> Registrar turno mío</button>}/>}
    </section>
    {modal&&<Modal title="Registrar mi turno" subtitle="Registra tu horario y organiza a las modelos por responsabilidad, sala y hora de salida." onClose={()=>setModal(false)}>
      <form onSubmit={createMyShift} className="form-grid">
        <Field label="Fecha de mi turno *"><input type="date" required value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></Field>
        <Field label="Tipo de turno *"><select value={form.tipo_turno} onChange={e=>setForm({...form,tipo_turno:e.target.value,jornadas_cubiertas:e.target.value==='doblando'?['mañana','tarde']:form.jornadas_cubiertas})}><option value="normal">Normal</option><option value="doblando">Me toca doblar</option><option value="reposicion">Reposición</option></select></Field>
        <Field label="Horarios que voy a cumplir *" full><div className="shift-checks">{['mañana','tarde','noche','domingo'].map(j=><label key={j}><input type="checkbox" checked={(form.jornadas_cubiertas||[]).includes(j)} onChange={e=>setForm({...form,jornadas_cubiertas:e.target.checked?[...form.jornadas_cubiertas,j]:(form.jornadas_cubiertas||[]).filter(x=>x!==j)})}/>{j==='domingo'?'🌸 Domingo':j}</label>)}</div></Field>
        <Field label="Hora de inicio"><input type="time" value={form.hora_inicio} onChange={e=>setForm({...form,hora_inicio:e.target.value})}/></Field>
        <Field label="Hora en que termina mi turno"><input type="time" value={form.hora_fin} onChange={e=>setForm({...form,hora_fin:e.target.value})}/></Field>
        <Field label="Mis modelos (a mi cargo)" full><div className="shift-checks model-shift-checks">{models.filter(m=>m.estado==='activa').map(m=><label key={m.id}><input type="checkbox" checked={(form.modelo_ids||[]).includes(m.id)} onChange={e=>setForm({...form,modelo_ids:e.target.checked?[...form.modelo_ids,m.id]:(form.modelo_ids||[]).filter(id=>id!==m.id),apoyo_ids:(form.apoyo_ids||[]).filter(id=>id!==m.id)})}/>{m.nombre}{m.nickname?' (@'+m.nickname+')':''}</label>)}</div></Field>
        <Field label="Modelos de apoyo / doblaje (no son mis modelos)" full><div className="shift-checks model-shift-checks">{models.filter(m=>m.estado==='activa'&&!(form.modelo_ids||[]).includes(m.id)).map(m=><label key={m.id}><input type="checkbox" checked={(form.apoyo_ids||[]).includes(m.id)} onChange={e=>setForm({...form,apoyo_ids:e.target.checked?[...form.apoyo_ids,m.id]:(form.apoyo_ids||[]).filter(id=>id!==m.id)})}/>{m.nombre}</label>)}</div><small className="progress-caption">Se muestran en el equipo, pero no como modelos a tu cargo.</small></Field>
        {!!selectedModels.length&&<div className="field-full roster-room-fields"><b>Sala y salida de cada modelo</b><small>Si alguna se queda doblando después de tu hora, escribe aquí su hora final independiente.</small>{selectedModels.map(m=><div className="roster-room-edit" key={m.id}><b>{m.nombre}{(form.apoyo_ids||[]).includes(m.id)?' · Apoyo':''}</b><input aria-label={'Room de '+m.nombre} value={form.salas[m.id]||''} onChange={e=>setForm({...form,salas:{...form.salas,[m.id]:e.target.value}})} placeholder="Room / sala"/><input aria-label={'Hora de salida de '+m.nombre} type="time" value={form.horas_fin[m.id]||''} onChange={e=>setForm({...form,horas_fin:{...form.horas_fin,[m.id]:e.target.value}})}/></div>)}</div>}
        <Field label="Pendientes para el equipo" full><textarea rows="2" value={form.pendientes} onChange={e=>setForm({...form,pendientes:e.target.value})} placeholder="Pendientes que deben quedar anotados"/></Field>
        <Field label="Observaciones" full><textarea rows="2" value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})}/></Field>
        <div className="field-full"><FormActions onCancel={()=>setModal(false)} saving={saving} label="Guardar mi turno y equipo"/></div>
      </form>
    </Modal>}
  </>;
}

function Dashboard({ models, apps, shifts, monitorShifts, session, todayTokens, pendingRepos, openDebt, production, assignments, goals, replacements, refresh, notify, setActive }) {
  const activeModels = models.filter(m => m.estado === 'activa').length;
  const teamRows = shifts.map(s => {
    const model = models.find(m => m.id === s.modelo_id);
    const tokens = production.filter(p => p.turno_id === s.id).reduce((sum, p) => sum + Number(p.tokens || 0), 0);
    const platforms = assignments.filter(a => a.modelo_id === s.modelo_id && a.activa).map(a => apps.find(x => x.id === a.aplicacion_id)?.nombre).filter(Boolean);
    return { ...s, model, tokens, platforms };
  }).sort((a,b) => String(a.sala || '99').localeCompare(String(b.sala || '99'), 'es', {numeric:true}));
  const occupied = new Set(teamRows.map(s => String(s.sala || '').trim()).filter(Boolean));
  const roomConflicts = [...occupied].filter(room => teamRows.filter(s => String(s.sala || '').trim() === room).length > 1);
  const rooms = Array.from({length:11}, (_,i) => {
    const number = String(i+1);
    const assigned = teamRows.filter(s => String(s.sala || '').trim().toLowerCase().replace('room ','') === number);
    return { number, shift: assigned[0] || null, conflict: assigned.length > 1 };
  });
  const statusLabel = state => state === 'cumplido' ? 'Turno finalizado' : state === 'ausencia' ? 'Ausente' : state === 'cancelado' ? 'Cancelado' : state === 'en_curso' ? 'En transmisión' : 'Programado';
  return <>
    <PageHeading kicker="CONTROL DE SEDE · VENECIA" title="Mi sede hoy" subtitle="Vista general de las 11 salas, el equipo, los turnos y la producción del día." action={<button className="primary-btn" onClick={() => setActive('shifts')}><Plus size={15}/> Organizar turnos</button>}/>
    <div className="stats-grid ec2-stats">
      <StatCard label="Modelos activas" value={`${activeModels} / 11`} foot="Integrantes registradas" icon={Users}/>
      <StatCard label="En jornada hoy" value={shifts.filter(s => !['cumplido','ausencia','cancelado'].includes(s.estado)).length} foot="Modelos con turno" icon={Activity} accent="stat-lilac"/>
      <StatCard label="Producción de hoy" value={number(todayTokens)} foot="Tokens registrados" icon={TrendingUp} accent="stat-pink"/>
      <StatCard label="Reposiciones" value={pendingRepos} foot="Pendientes por coordinar" icon={Clock3}/>
      <StatCard label="Saldo por cobrar" value={money(openDebt)} foot="Cartera registrada" icon={Wallet} accent="stat-warm"/>
    </div>
    <section className="panel ec2-room-panel">
      <div className="panel-heading"><div><h3>Estado de las 11 salas</h3><p>Ocupación y situación de cada espacio durante la jornada de hoy.</p></div><span className="soft-pill">{occupied.size} salas ocupadas</span></div>
      <div className="ec2-room-grid">{rooms.map(({number,shift,conflict}) => <article className={`ec2-room-card ${shift?'occupied':''} ${conflict?'conflict':''}`} key={number}>
        <div className="ec2-room-top"><span className="ec2-room-number">SALA {number}</span><span className={`ec2-room-dot ${shift?'on':''}`}/></div>
        {shift ? <><b className="ec2-room-model">{shift.model?.nombre || 'Modelo'}</b><span className="ec2-room-shift">{shift.jornada || 'Turno'} · {shift.hora_inicio || '—'}–{shift.hora_fin || '—'}</span><span className={`ec2-room-status ${conflict?'warning':shift.estado==='ausencia'?'warning':shift.estado==='cumplido'?'done':'live'}`}>{conflict?'Revisar sala duplicada':statusLabel(shift.estado)}</span></> : <><b className="ec2-room-model vacant">Disponible</b><span className="ec2-room-shift">Sin asignación registrada</span><span className="ec2-room-status vacant-status">Sala libre</span></>}
      </article>)}</div>
      {roomConflicts.length>0&&<div className="notice notice-error ec2-conflict-note"><AlertCircle size={16}/> Hay más de una modelo asignada a la misma sala: {roomConflicts.join(', ')}. Revisa los turnos.</div>}
    </section>
    <section className="panel ec2-team-panel">
      <div className="panel-heading"><div><h3>Equipo de hoy</h3><p>Modelos asignadas, salas, aplicaciones y monitoreo.</p></div><button className="text-btn" onClick={()=>setActive('models')}>Ver equipo <ArrowUpRight size={14}/></button></div>
      {teamRows.length ? <div className="ec2-team-list">{teamRows.map(s=><div className="ec2-team-row" key={s.id}>
        <div className="person-avatar">{(s.model?.nombre||'M').slice(0,1).toUpperCase()}</div>
        <div className="ec2-team-person"><b>{s.model?.nombre||'Modelo'}</b><small>{s.es_apoyo?'Apoyo / doblaje':'Equipo asignado'} · {s.platforms.join(' · ')||'Sin plataformas'}</small></div>
        <span className="ec2-team-room">{s.sala?('Sala '+s.sala):'Sin sala'}</span>
        <span className={`status-pill ${s.estado}`}>{statusLabel(s.estado)}</span>
        <b className="ec2-team-tokens">{number(s.tokens)} <small>tokens</small></b>
      </div>)}</div> : <EmptyInline icon={Users} title="Todavía no hay modelos asignadas a turnos" text="Cuando registres las jornadas del equipo, aquí aparecerán sus salas, aplicaciones y producción." action={<button className="primary-btn small-btn" onClick={()=>setActive('shifts')}><Plus size={14}/> Registrar turnos</button>}/>}
    </section>
    <section className="panel ec2-production-panel">
      <div className="panel-heading"><div><h3>Producción por modelo</h3><p>Tokens acumulados en los turnos registrados hoy.</p></div><button className="text-btn" onClick={()=>setActive('shifts')}>Abrir producción <ArrowUpRight size={14}/></button></div>
      {teamRows.length ? <div className="ec2-production-list">{teamRows.map(s=><div className="ec2-production-row" key={s.id}><span>{s.model?.nombre||'Modelo'}</span><div className="rank-track"><i style={{width:`${teamRows.reduce((m,x)=>Math.max(m,x.tokens),0)?Math.max(0,s.tokens/teamRows.reduce((m,x)=>Math.max(m,x.tokens),0)*100):0}%`}}/></div><b>{number(s.tokens)}</b></div>)}</div> : <EmptyInline icon={TrendingUp} title="Sin producción registrada" text="La producción aparecerá aquí al guardar tokens por aplicación."/>}
    </section>
    <MyShiftPanel models={models} apps={apps} assignments={assignments} shifts={shifts} monitorShifts={monitorShifts} session={session} refresh={refresh} notify={notify} setActive={setActive}/>
  </>;
}

function QuickAction({icon:Icon,title,text,onClick}) { return <button className="quick-action" onClick={onClick}><span className="quick-icon"><Icon size={19}/></span><span><b>{title}</b><small>{text}</small></span><ArrowUpRight size={16} className="quick-arrow"/></button>; }
function EmptyInline({icon:Icon,title,text,action}) { return <div className="empty-inline"><span><Icon size={21}/></span><b>{title}</b><p>{text}</p>{action}</div>; }
function Modal({ title, subtitle, onClose, children }) { return <div className="modal-backdrop" onMouseDown={e => { if(e.target===e.currentTarget) onClose(); }}><div className="modal"><div className="modal-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{children}</div></div>; }
function Field({ label, children, full }) { return <label className={`field ${full ? 'field-full' : ''}`}><span>{label}</span>{children}</label>; }
function FormActions({ onCancel, saving, label='Guardar registro' }) { return <div className="form-actions"><button type="button" className="secondary-btn" onClick={onCancel}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving ? 'Guardando…' : label}<Check size={16}/></button></div>; }
function ModelsPage({ models, apps, assignments, refresh, notify }) {
  const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({nombre:'',nickname:'',telefono:'',codigo:'',jornada_preferida:'tarde',notas:'',estado:'activa'});
  const open=(m=null)=>{setEditing(m);setForm(m?{nombre:m.nombre,nickname:m.nickname||'',telefono:m.telefono||'',codigo:m.codigo||'',jornada_preferida:m.jornada_preferida||'tarde',notas:m.notas||'',estado:m.estado||'activa'}:{nombre:'',nickname:'',telefono:'',codigo:'',jornada_preferida:'tarde',notas:'',estado:'activa'});setModal(true);};
  const save=async e=>{e.preventDefault();setSaving(true);const payload={...form,nombre:safe(form.nombre),telefono:safe(form.telefono)||null,codigo:safe(form.codigo)||null,notas:safe(form.notas)||null};const q=editing?supabase.from('modelos').update(payload).eq('id',editing.id):supabase.from('modelos').insert(payload);const {error}=await q;setSaving(false);if(error){notify(`No se pudo guardar: ${error.message}`);return;}setModal(false);notify(editing?'Ficha actualizada':'Modelo agregada');refresh();};
  const filtered=models.filter(m=>`${m.nombre} ${m.codigo||''} ${m.telefono||''}`.toLowerCase().includes((search||'').toLowerCase()));
  return <><PageHeading kicker="GESTIÓN DEL EQUIPO" title="Modelos" subtitle="Administra las fichas, datos de contacto y estado de las 11 integrantes de tu equipo." action={<button className="primary-btn" onClick={()=>open()}><Plus size={16}/> Agregar modelo</button>}/><div className="inline-metrics"><span><b>{models.length}</b> registradas</span><span><b>{models.filter(m=>m.estado==='activa').length}</b> activas</span><span><b>{Math.max(0,11-models.length)}</b> cupos por completar</span></div><section className="panel table-panel"><div className="table-toolbar"><div><h3>Directorio del equipo</h3><p>Información visible únicamente para la administración</p></div><div className="searchbox"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar modelo…"/></div></div>{filtered.length ? <div className="table-scroll"><table><thead><tr><th>Modelo</th><th>Contacto</th><th>Jornada preferida</th><th>Páginas / aplicaciones</th><th>Estado</th><th></th></tr></thead><tbody>{filtered.map(m=><tr key={m.id}><td><div className="person-cell"><span className="person-avatar">{m.nombre.slice(0,1).toUpperCase()}</span><div><b>{m.nombre}</b><small>{m.nickname?`@${m.nickname}`:(m.codigo||'Sin código')}</small></div></div></td><td>{m.telefono||'—'}</td><td className="capitalize">{m.jornada_preferida||'—'}</td><td>{assignments.filter(a=>a.modelo_id===m.id&&a.activa).map(a=>apps.find(p=>p.id===a.aplicacion_id)?.nombre).filter(Boolean).join(', ')||'Sin páginas asignadas'}</td><td><span className={`status-pill ${m.estado}`}>{m.estado}</span></td><td><button className="icon-btn" onClick={()=>open(m)} title="Editar ficha"><Edit3 size={16}/></button></td></tr>)}</tbody></table></div>:<EmptyInline icon={Users} title="Aún no tienes modelos registradas" text="Agrega la primera ficha. No se han creado nombres de ejemplo para evitar mezclar información ficticia con tus datos reales." action={<button className="primary-btn" onClick={()=>open()}><Plus size={15}/> Crear primera ficha</button>}/>}</section>{modal&&<Modal title={editing?'Editar ficha':'Nueva modelo'} subtitle="Los datos se guardan en tu base privada." onClose={()=>setModal(false)}><form onSubmit={save} className="form-grid"><Field label="Nombre completo *" full><input required value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Nombre de la modelo"/></Field><Field label="Nickname / nombre artístico *" full><input required value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})} placeholder="Ej. QueenVenus"/></Field><Field label="Teléfono para reportes"><input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="Ej. 3001234567"/></Field><Field label="Código interno"><input value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} placeholder="Opcional"/></Field><Field label="Jornada preferida"><select value={form.jornada_preferida} onChange={e=>setForm({...form,jornada_preferida:e.target.value})}><option value="mañana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option><option value="personalizado">Personalizada</option></select></Field><Field label="Estado"><select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option value="activa">Activa</option><option value="inactiva">Inactiva</option></select></Field><Field label="Notas" full><textarea value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} rows="3" placeholder="Notas administrativas opcionales"/></Field><div className="field-full"><FormActions onCancel={()=>setModal(false)} saving={saving} label={editing?'Guardar cambios':'Guardar modelo'}/></div></form></Modal>}</>;
}

function AppsPage({models,apps,assignments,goals,refresh,notify}) {
  const [appModal,setAppModal]=useState(false); const [assignModal,setAssignModal]=useState(false); const [name,setName]=useState(''); const [form,setForm]=useState({modelo_id:'',aplicacion_id:'',usuario:'',tokens_meta:'',tipo_periodo:'quincenal',fecha_inicio:today()}); const [saving,setSaving]=useState(false);
  const addApp=async e=>{e.preventDefault();setSaving(true);const {error}=await supabase.from('aplicaciones').insert({nombre:safe(name),activa:true});setSaving(false);if(error){notify(`No se pudo guardar: ${error.message}`);return;}setName('');setAppModal(false);notify('Aplicación agregada');refresh();};
  const assign=async e=>{e.preventDefault();if(form.password&&(!form.masterPassword||form.masterPassword.length<10)){notify('Crea una clave maestra de al menos 10 caracteres para cifrar la contraseña.');return;}setSaving(true);let credencial_cifrada=null;try{if(form.password)credencial_cifrada=await encryptPlatformPassword(form.password,form.masterPassword);}catch(err){setSaving(false);notify('No fue posible cifrar la contraseña en este dispositivo.');return;}const {data:link,error}=await supabase.from('modelo_aplicaciones').insert({modelo_id:form.modelo_id,aplicacion_id:form.aplicacion_id,usuario:safe(form.usuario)||null,credencial_cifrada,activa:true}).select('id').single();if(error){setSaving(false);notify(`No se pudo asignar: ${error.message}`);return;}const {error:goalError}=await supabase.from('metas').insert({modelo_aplicacion_id:link.id,tokens_meta:Number(form.tokens_meta),tipo_periodo:form.tipo_periodo,fecha_inicio:form.fecha_inicio,fecha_fin:null});setSaving(false);if(goalError){notify(`Aplicación asignada, pero no se guardó la meta: ${goalError.message}`);}else notify('Aplicación y meta asignadas');setAssignModal(false);refresh();};
  const setActive=async (app)=>{const {error}=await supabase.from('aplicaciones').update({activa:!app.activa}).eq('id',app.id);if(error)notify(error.message);else{notify(app.activa?'Aplicación desactivada':'Aplicación activada');refresh();}};
  const currentGoal=(assignment)=>goals.filter(g=>g.modelo_aplicacion_id===assignment.id && g.fecha_inicio<=today() && (!g.fecha_fin||g.fecha_fin>=today())).sort((a,b)=>b.fecha_inicio.localeCompare(a.fecha_inicio))[0];
  return <><PageHeading kicker="CONFIGURACIÓN DE PRODUCCIÓN" title="Aplicaciones y metas" subtitle="Cada modelo puede tener plataformas distintas y una meta diaria propia en cada una." action={<div className="heading-actions"><button className="secondary-btn" onClick={()=>setAppModal(true)}><Plus size={15}/> Nueva aplicación</button><button className="primary-btn" onClick={()=>setAssignModal(true)} disabled={!models.length||!apps.length}><Plus size={15}/> Asignar meta</button></div>}/><div className="app-config-grid"><section className="panel"><div className="panel-heading"><div><h3>Aplicaciones disponibles</h3><p>Catálogo general de plataformas</p></div><span className="soft-pill">{apps.length} aplicaciones</span></div>{apps.length?<div className="platform-list">{apps.map(a=><div className="platform-row" key={a.id}><div className="platform-symbol"><MonitorPlay size={18}/></div><div className="platform-name"><b>{a.nombre}</b><span>{assignments.filter(x=>x.aplicacion_id===a.id&&x.activa).length} asignaciones</span></div><span className={`status-pill ${a.activa?'activa':'inactiva'}`}>{a.activa?'Activa':'Inactiva'}</span><button className="text-btn" onClick={()=>setActive(a)}>{a.activa?'Desactivar':'Activar'}</button></div>)}</div>:<EmptyInline icon={MonitorPlay} title="Sin aplicaciones registradas" text="Crea las plataformas que utiliza tu equipo." action={<button className="secondary-btn" onClick={()=>setAppModal(true)}><Plus size={15}/> Agregar aplicación</button>}/>}</section><section className="panel"><div className="panel-heading"><div><h3>Metas por modelo</h3><p>Objetivo diario vigente por plataforma</p></div><BadgeCheck size={19} className="subtle-icon"/></div>{assignments.length?<div className="goal-list">{assignments.map(a=>{const m=models.find(x=>x.id===a.modelo_id);const p=apps.find(x=>x.id===a.aplicacion_id);const g=currentGoal(a);return <div className="goal-row" key={a.id}><div><b>{m?.nombre||'Modelo'}</b><span>{p?.nombre||'Aplicación'} · {a.usuario?`@${a.usuario}`:'Sin usuario'} · {a.activa?'Asignada':'Inactiva'}</span></div><strong>{g?`${number(g.tokens_meta)} <small>tokens/${g.tipo_periodo==='quincenal'?'quincena':'día'}</small>`:'Sin meta'}</strong></div>;})}</div>:<EmptyInline icon={Gauge} title="Todavía no hay metas" text="Asigna una aplicación a una modelo y define su objetivo diario."/>}</section></div>{appModal&&<Modal title="Nueva aplicación" subtitle="Registra una plataforma en el catálogo." onClose={()=>setAppModal(false)}><form onSubmit={addApp} className="form-grid"><Field label="Nombre de la aplicación *" full><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre de la plataforma"/></Field><div className="field-full"><FormActions onCancel={()=>setAppModal(false)} saving={saving} label="Guardar aplicación"/></div></form></Modal>}{assignModal&&<Modal title="Asignar aplicación y meta" subtitle="La meta será independiente para esta modelo y esta plataforma." onClose={()=>setAssignModal(false)}><form onSubmit={assign} className="form-grid"><Field label="Modelos a tu cargo *" full><div className="shift-checks model-shift-checks">{models.filter(m=>m.estado==='activa').map(m=><label key={m.id}><input type="checkbox" checked={(form.modelo_ids||[]).includes(m.id)} onChange={e=>setForm({...form,modelo_ids:e.target.checked?[...form.modelo_ids,m.id]:(form.modelo_ids||[]).filter(id=>id!==m.id)})}/>{m.nombre}{m.nickname?` (@${m.nickname})`:''}</label>)}</div><small className="progress-caption">Selecciona todas las modelos que estarán contigo durante esta jornada.</small></Field><Field label="Aplicación *" full><select required value={form.aplicacion_id} onChange={e=>setForm({...form,aplicacion_id:e.target.value})}><option value="">Selecciona una aplicación</option>{apps.filter(a=>a.activa).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></Field><Field label="Usuario / nickname en esta aplicación" full><input value={form.usuario} onChange={e=>setForm({...form,usuario:e.target.value})} placeholder="Usuario de la modelo en la plataforma"/></Field><Field label="Meta de tokens *" full><input required type="number" min="1" step="1" value={form.tokens_meta} onChange={e=>setForm({...form,tokens_meta:e.target.value})} placeholder="Ej. 1200"/></Field><Field label="Periodo de la meta"><select value={form.tipo_periodo} onChange={e=>setForm({...form,tipo_periodo:e.target.value})}><option value="quincenal">Quincenal</option><option value="diaria">Diaria</option></select></Field><Field label="Vigente desde *" full><input required type="date" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})}/></Field><div className="field-full"><FormActions onCancel={()=>setAssignModal(false)} saving={saving} label="Guardar asignación"/></div></form></Modal>}</>;
}


function ShiftsPage({models,apps,assignments,goals,shifts,monitorShifts,production,reports,refresh,notify}) {
  const [selected,setSelected]=useState('');
  const [tokens,setTokens]=useState({});
  const [notes,setNotes]=useState({});
  const [saving,setSaving]=useState(false);
  const chosen=shifts.find(s=>s.id===selected);
  const activeAssignments=assignments.filter(a=>a.modelo_id===chosen?.modelo_id&&a.activa);
  const shiftProduction=production.filter(p=>p.turno_id===selected);
  const goalFor=assignment=>goals.filter(g=>g.modelo_aplicacion_id===assignment.id&&g.fecha_inicio<=(chosen?.fecha||today())&&(!g.fecha_fin||g.fecha_fin>=(chosen?.fecha||today()))).sort((a,b)=>b.fecha_inicio.localeCompare(a.fecha_inicio))[0];
  const persistProduction=async()=>{
    if(!chosen)return false;
    const rows=activeAssignments.filter(a=>tokens[a.id]!==undefined&&tokens[a.id]!=='').map(a=>({turno_id:chosen.id,modelo_aplicacion_id:a.id,tokens:Math.max(0,Math.floor(Number(tokens[a.id])||0)),observaciones:safe(notes[a.id])||null}));
    if(!rows.length)return true;
    const {error}=await supabase.from('produccion').upsert(rows,{onConflict:'turno_id,modelo_aplicacion_id'});
    if(error){notify('No se pudo guardar la producción: '+error.message);return false;}
    return true;
  };
  const saveProduction=async e=>{e.preventDefault();setSaving(true);const ok=await persistProduction();setSaving(false);if(ok){notify('Producción guardada');refresh();}};
  const changeState=async(shift,state)=>{const {error}=await supabase.from('turnos').update({estado:state}).eq('id',shift.id);if(error)notify(error.message);else{notify('Jornada individual actualizada');refresh();}};
  const buildPayload=shift=>{
    const model=models.find(m=>m.id===shift.modelo_id);
    const lines=assignments.filter(a=>a.modelo_id===model?.id&&a.activa).map(a=>{
      const platform=apps.find(x=>x.id===a.aplicacion_id);
      const saved=production.find(x=>x.turno_id===shift.id&&x.modelo_aplicacion_id===a.id);
      const unsaved=shift.id===selected?tokens[a.id]:undefined;
      const value=unsaved!==undefined&&unsaved!==''?Number(unsaved):Number(saved?.tokens||0);
      const goal=goals.filter(x=>x.modelo_aplicacion_id===a.id&&x.fecha_inicio<=shift.fecha&&(!x.fecha_fin||x.fecha_fin>=shift.fecha)).sort((x,y)=>y.fecha_inicio.localeCompare(x.fecha_inicio))[0];
      return {aplicacion:platform?.nombre||'Aplicación',usuario:a.usuario||'',tokens:value,meta:Number(goal?.tokens_meta||0),porcentaje:goal?.tokens_meta?Math.round(value/Number(goal.tokens_meta)*100):null};
    });
    const total=lines.reduce((sum,line)=>sum+line.tokens,0);
    const monitorShift=monitorShifts.find(s=>s.id===shift.monitor_turno_id);
    return {modelo:model?.nombre||'Modelo',nickname:model?.nickname||'',fecha:shift.fecha,jornada:shift.jornada,hora_inicio:shift.hora_inicio,hora_fin:shift.hora_fin,sala:shift.sala||'',tipo_turno:shift.tipo_turno||'normal',es_apoyo:!!shift.es_apoyo,monitor_jornada:monitorShift?.jornada||'',monitor_hora_inicio:monitorShift?.hora_inicio||'',monitor_hora_fin:monitorShift?.hora_fin||'',jornadas_cubiertas:shift.jornadas_cubiertas||[],pendientes:shift.pendientes||'',aplicaciones:lines,total_tokens:total};
  };
  const closeModelShift=async()=>{
    if(!chosen)return;
    setSaving(true);
    const ok=await persistProduction();
    if(!ok){setSaving(false);return;}
    const payload=buildPayload(chosen);
    const existing=reports.find(r=>r.turno_id===chosen.id);
    let reportError=null;
    if(existing){
      if(existing.estado!=='enviado'){
        const result=await supabase.from('reportes').update({contenido:payload,estado:'generado'}).eq('id',existing.id);
        reportError=result.error;
      }
    }else{
      const result=await supabase.from('reportes').insert({modelo_id:chosen.modelo_id,turno_id:chosen.id,fecha_reporte:chosen.fecha,contenido:payload,estado:'generado'});
      reportError=result.error;
    }
    if(reportError){setSaving(false);notify('No se pudo preparar el informe: '+reportError.message);return;}
    const {error}=await supabase.from('turnos').update({estado:'cumplido'}).eq('id',chosen.id);
    setSaving(false);
    if(error){notify('El informe quedó guardado, pero no se pudo cerrar la jornada: '+error.message);refresh();return;}
    notify('Jornada de la modelo cerrada. Su informe quedó guardado para enviarlo ahora o después.');
    refresh();
  };
  const selectShift=s=>{
    setSelected(s.id);
    const saved=production.filter(p=>p.turno_id===s.id);
    setTokens(Object.fromEntries(saved.map(p=>[p.modelo_aplicacion_id,String(p.tokens)])));
    setNotes(Object.fromEntries(saved.map(p=>[p.modelo_aplicacion_id,p.observaciones||''])));
  };
  const teamShifts=chosen?(chosen.monitor_turno_id?shifts.filter(s=>s.monitor_turno_id===chosen.monitor_turno_id):shifts.filter(s=>s.fecha===chosen.fecha&&s.hora_inicio===chosen.hora_inicio&&s.hora_fin===chosen.hora_fin&&(s.jornadas_cubiertas||[s.jornada]).join(',')===(chosen.jornadas_cubiertas||[chosen.jornada]).join(','))):[];
  const reportForChosen=reports.find(r=>r.turno_id===chosen?.id);
  const teamTokens=teamShifts.reduce((sum,s)=>sum+production.filter(p=>p.turno_id===s.id).reduce((v,p)=>v+Number(p.tokens||0),0),0);
  const sorted=shifts.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)||String(b.hora_inicio||'').localeCompare(String(a.hora_inicio||'')));
  return <>
    <PageHeading kicker="OPERACIÓN DIARIA" title="Turnos y producción" subtitle="Cada modelo tiene su propia hora de entrada y salida. Tu turno de monitor se puede cerrar sin finalizar las jornadas de ellas."/>
    <div className="shift-layout">
      <section className="panel">
        <div className="panel-heading"><div><h3>Jornadas individuales</h3><p>Elige una modelo para registrar o cerrar su producción.</p></div><span className="soft-pill">{shifts.length} registros</span></div>
        {sorted.length?<div className="shift-list">{sorted.map(s=>{
          const model=models.find(m=>m.id===s.modelo_id);
          const report=reports.find(r=>r.turno_id===s.id);
          return <div className={'shift-card shift-card-row '+(selected===s.id?'selected':'')} key={s.id}>
            <button className="shift-card-select" onClick={()=>selectShift(s)}>
              <span className="shift-date"><b>{new Date(s.fecha+'T12:00:00').getDate()}</b><small>{new Date(s.fecha+'T12:00:00').toLocaleDateString('es-CO',{month:'short'})}</small></span>
              <span className="shift-info"><b>{model?.nombre||'Modelo'}{s.es_apoyo?' · Apoyo':''}</b><small>{s.jornada} · {s.hora_inicio||'—'} a {s.hora_fin||'—'} · {s.sala?'Room '+s.sala:'Sin sala'}</small></span>
            </button>
            <div className="shift-card-actions"><span className={'status-pill '+(s.estado==='cumplido'?'cumplido':s.estado==='en_curso'?'en_curso':s.estado)}>{s.estado||'programado'}</span>{report&&<span className="report-ready-dot" title="Informe guardado"><FileText size={14}/></span>}</div>
          </div>;
        })}</div>:<EmptyInline icon={CalendarDays} title="No hay jornadas registradas" text="Registra tu turno desde el panel principal para organizar las modelos por grupo, sala y horario."/>}
      </section>
      <section className="panel production-panel">
        <div className="panel-heading"><div><h3>Registro de producción</h3><p>{chosen?(models.find(m=>m.id===chosen.modelo_id)?.nombre||'Modelo')+' · '+dateLabel(chosen.fecha):'Selecciona una jornada individual'}</p></div><Activity size={19} className="subtle-icon"/></div>
        {chosen?<>
          <div className="shift-detail"><span className="soft-pill">{chosen.jornada}</span><span><Clock3 size={14}/> {chosen.hora_inicio||'—'} – {chosen.hora_fin||'—'}</span><span className="soft-pill">{chosen.sala?'Room '+chosen.sala:'Sala pendiente'}</span>
            <select value={chosen.estado} onChange={e=>changeState(chosen,e.target.value)}><option value="programado">Programado</option><option value="en_curso">En curso</option><option value="cumplido">Cumplido</option><option value="ausencia">Ausencia</option><option value="cancelado">Cancelado</option></select>
          </div>
          <div className="panel-heading" style={{marginTop:18}}><div><h3>🌸 Resumen de esta jornada</h3><p>{teamShifts.filter(s=>!s.es_apoyo).length} modelos a cargo · {teamShifts.filter(s=>s.es_apoyo).length} de apoyo / doblaje</p></div></div>
          <div className="shift-team-summary">
            {teamShifts.map(s=>{
              const model=models.find(m=>m.id===s.modelo_id);
              const total=production.filter(p=>p.turno_id===s.id).reduce((sum,p)=>sum+Number(p.tokens||0),0);
              const names=assignments.filter(a=>a.modelo_id===s.modelo_id&&a.activa).map(a=>apps.find(p=>p.id===a.aplicacion_id)?.nombre).filter(Boolean);
              return <div className="shift-team-row" key={s.id}><span><b>{model?.nombre||'Modelo'}</b><small>{s.es_apoyo?'Apoyo / doblaje · No está a tu cargo':'A tu cargo'} · {s.sala?'Room '+s.sala:'Sala pendiente'} · {names.join(', ')||'Sin aplicaciones'}</small></span><strong>{number(total)} tokens</strong></div>;
            })}
            <div className="shift-team-total"><span>Total registrado del grupo</span><b>{number(teamTokens)} tokens</b></div>
          </div>
          <form onSubmit={saveProduction}>
            <div className="production-entry-list">
              {activeAssignments.length?activeAssignments.map(a=>{
                const platform=apps.find(x=>x.id===a.aplicacion_id);
                const goal=goalFor(a);
                const existing=shiftProduction.find(x=>x.modelo_aplicacion_id===a.id);
                const current=tokens[a.id]!==undefined?tokens[a.id]:existing?String(existing.tokens):'';
                const periodTotal=goal?.tipo_periodo==='quincenal'?production.filter(row=>row.modelo_aplicacion_id===a.id&&shifts.some(sh=>sh.id===row.turno_id&&sh.fecha>=goal.fecha_inicio&&sh.fecha<=(chosen?.fecha||today()))).reduce((sum,row)=>sum+Number(row.tokens||0),0):Number(current||0);
                const pct=goal&&goal.tokens_meta?Math.min(100,periodTotal/Number(goal.tokens_meta)*100):0;
                const remaining=goal?Math.max(0,Number(goal.tokens_meta)-periodTotal):0;
                return <div className="production-entry" key={a.id}>
                  <div className="production-entry-head"><b>{platform?.nombre||'Aplicación'}</b><span>{goal?'Meta '+number(goal.tokens_meta):'Meta no configurada'}</span></div>
                  {a.usuario&&<small className="progress-caption">Usuario: @{a.usuario}</small>}
                  <input type="number" min="0" step="1" value={current} onChange={e=>setTokens({...tokens,[a.id]:e.target.value})} placeholder="Tokens registrados"/>
                  <input className="production-note" value={notes[a.id]||''} onChange={e=>setNotes({...notes,[a.id]:e.target.value})} placeholder="Observación opcional"/>
                  <div className="goal-progress"><i style={{width:String(pct)+'%'}}/></div>
                  <small className="progress-caption">{current?number(current)+' tokens en esta jornada · '+(goal?.tipo_periodo==='quincenal'?number(periodTotal)+' acumulados, faltan '+number(remaining):Math.round(pct)+'% de la meta'):'Escribe la producción de esta aplicación'}</small>
                </div>;
              }):<EmptyInline icon={MonitorPlay} title="Esta modelo no tiene aplicaciones asignadas" text="Primero configura sus plataformas y metas en Aplicaciones y metas."/>}
            </div>
            {activeAssignments.length>0&&<div className="form-actions"><button className="primary-btn" disabled={saving}>{saving?'Guardando…':'Guardar producción'}<Check size={16}/></button></div>}
          </form>
          <div className="individual-close-box">
            {reportForChosen?<><b><FileText size={15}/> Informe de esta modelo: {reportForChosen.estado==='enviado'?'ya enviado':'guardado y pendiente de enviar'}</b><p>El informe queda disponible en Reportes para compartirlo cuando ella lo necesite.</p></>:<><b>¿Ella ya terminó su jornada?</b><p>Esto cierra solamente el turno de esta modelo, prepara su informe individual y deja tu turno de monitor intacto.</p><button className="primary-btn" disabled={saving} onClick={closeModelShift}>{saving?'Preparando informe…':'Finalizar jornada y preparar informe'}<FileText size={15}/></button></>}
          </div>
        </>:<EmptyInline icon={Activity} title="Elige una jornada" text="Al seleccionar una modelo verás sus aplicaciones, podrás registrar tokens y finalizar su turno sin cerrar el tuyo."/>}
      </section>
    </div>
  </>;
}
function ReplacementsPage({models,replacements,refresh,notify}) {
 const [modal,setModal]=useState(false);const [form,setForm]=useState({modelo_id:'',horas:'',fecha_limite:'',motivo:''});const [saving,setSaving]=useState(false);
 const create=async e=>{e.preventDefault();setSaving(true);const {error}=await supabase.from('reposiciones').insert({...form,horas:Number(form.horas),fecha_limite:form.fecha_limite||null,motivo:safe(form.motivo)||null,estado:'pendiente'});setSaving(false);if(error){notify(error.message);return;}setModal(false);notify('Reposición registrada');refresh();};
 const setState=async (r,estado)=>{const payload={estado,...(estado==='cumplida'?{cumplida_at:new Date().toISOString()}:{})};const {error}=await supabase.from('reposiciones').update(payload).eq('id',r.id);if(error)notify(error.message);else{notify('Reposición actualizada');refresh();}};
 const pending=replacements.filter(r=>r.estado==='pendiente');const completed=replacements.filter(r=>r.estado==='cumplida');
 return <><PageHeading kicker="CONTROL DE ASISTENCIA" title="Reposiciones" subtitle="Registra las horas pendientes, su fecha límite y el cumplimiento de cada reposición." action={<button className="primary-btn" onClick={()=>setModal(true)} disabled={!models.length}><Plus size={16}/> Registrar reposición</button>}/><div className="stats-grid compact-stats"><StatCard label="Pendientes" value={pending.length} foot="Por coordinar" icon={Clock3}/><StatCard label="Horas pendientes" value={number(pending.reduce((s,r)=>s+Number(r.horas||0),0))} foot="Horas por reponer" icon={Activity} accent="stat-pink"/><StatCard label="Cumplidas" value={completed.length} foot="Historial de reposición" icon={BadgeCheck} accent="stat-lilac"/></div><section className="panel table-panel"><div className="panel-heading"><div><h3>Seguimiento de reposiciones</h3><p>Ordenadas por fecha límite</p></div></div>{replacements.length?<div className="table-scroll"><table><thead><tr><th>Modelo</th><th>Horas</th><th>Fecha límite</th><th>Motivo</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{replacements.slice().sort((a,b)=>(a.fecha_limite||'9999').localeCompare(b.fecha_limite||'9999')).map(r=><tr key={r.id}><td><b>{models.find(m=>m.id===r.modelo_id)?.nombre||'—'}</b></td><td>{r.horas}</td><td>{dateLabel(r.fecha_limite)}</td><td>{r.motivo||'—'}</td><td><span className={`status-pill ${r.estado}`}>{r.estado}</span></td><td>{r.estado==='pendiente'?<div className="row-actions"><button className="mini-success" onClick={()=>setState(r,'cumplida')}><Check size={14}/> Cumplida</button><button className="icon-btn" title="Cancelar" onClick={()=>setState(r,'cancelada')}><X size={15}/></button></div>:<span className="muted-small">—</span>}</td></tr>)}</tbody></table></div>:<EmptyInline icon={CalendarClock} title="Sin reposiciones registradas" text="Aquí podrás hacer seguimiento a las horas pendientes de cada modelo."/>}</section>{modal&&<Modal title="Nueva reposición" subtitle="Registra una obligación de horas por reponer." onClose={()=>setModal(false)}><form onSubmit={create} className="form-grid"><Field label="Modelo *" full><select required value={form.modelo_id} onChange={e=>setForm({...form,modelo_id:e.target.value})}><option value="">Selecciona una modelo</option>{models.map(m=><option value={m.id} key={m.id}>{m.nombre}</option>)}</select></Field><Field label="Horas por reponer *"><input type="number" min="0.5" step="0.5" required value={form.horas} onChange={e=>setForm({...form,horas:e.target.value})}/></Field><Field label="Fecha límite"><input type="date" value={form.fecha_limite} onChange={e=>setForm({...form,fecha_limite:e.target.value})}/></Field><Field label="Motivo" full><textarea rows="3" value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})} placeholder="Motivo u observaciones"/></Field><div className="field-full"><FormActions onCancel={()=>setModal(false)} saving={saving} label="Guardar reposición"/></div></form></Modal>}</>;
}

function DebtsPage({models,debts,installments,payments,refresh,notify}) {
 const [modal,setModal]=useState(false);const [paymentModal,setPaymentModal]=useState(null);const [form,setForm]=useState({modelo_id:'',concepto:'',categoria:'cafeteria',valor_total:'',numero_cuotas:'1',valor_cuota_sugerido:'',fecha_deuda:today(),notas:''});const [payment,setPayment]=useState({cuota_id:'',valor:'',fecha_abono:today(),tipo:'descuento',notas:''});const [saving,setSaving]=useState(false);
 const totalOpen=debts.filter(d=>d.estado==='activa').reduce((s,d)=>s+Math.max(0,Number(d.valor_total)-payments.filter(p=>p.deuda_id===d.id).reduce((x,p)=>x+Number(p.valor),0)),0);
 const saveDebt=async e=>{e.preventDefault();setSaving(true);const total=Number(form.valor_total), count=Math.max(1,Number(form.numero_cuotas)||1);const payload={...form,valor_total:total,numero_cuotas:count,valor_cuota_sugerido:Number(form.valor_cuota_sugerido)||Math.round(total/count),notas:safe(form.notas)||null};delete payload.valor_cuota_sugerido;const {data,error}=await supabase.from('deudas').insert({...payload,valor_cuota_sugerido:Number(form.valor_cuota_sugerido)||Math.round(total/count),estado:'activa'}).select('id').single();if(error){setSaving(false);notify(error.message);return;}const base=Math.floor((total/count)*100)/100;const rows=Array.from({length:count},(_,i)=>({deuda_id:data.id,numero_cuota:i+1,valor_programado:i===count-1?Math.round((total-base*(count-1))*100)/100:base,estado:'pendiente'}));const {error:installError}=await supabase.from('cuotas').insert(rows);setSaving(false);if(installError){notify(`Deuda creada; no se pudieron generar las cuotas: ${installError.message}`);}else notify('Deuda y cuotas registradas');setModal(false);refresh();};
 const openPayment=d=>{setPaymentModal(d);const first=installments.find(i=>i.deuda_id===d.id&&i.estado!=='pagada');setPayment({cuota_id:first?.id||'',valor:'',fecha_abono:today(),tipo:'descuento',notas:''});};
 const savePayment=async e=>{e.preventDefault();if(!paymentModal)return;const value=Number(payment.valor);const debtBalance=Math.max(0,Number(paymentModal.valor_total)-paidFor(paymentModal));const quota=installments.find(i=>i.id===payment.cuota_id);const quotaPaid=quota?payments.filter(p=>p.cuota_id===quota.id).reduce((s,p)=>s+Number(p.valor),0):0;const quotaBalance=quota?Math.max(0,Number(quota.valor_programado)-quotaPaid):debtBalance;if(value>debtBalance||value>quotaBalance){notify(`El abono no puede superar el saldo disponible (${money(Math.min(debtBalance,quotaBalance))}).`);return;}setSaving(true);const {error}=await supabase.from('abonos').insert({deuda_id:paymentModal.id,cuota_id:payment.cuota_id||null,valor:value,fecha_abono:payment.fecha_abono,tipo:payment.tipo,notas:safe(payment.notas)||null});if(error){setSaving(false);notify(error.message);return;}if(payment.cuota_id){const quota=installments.find(i=>i.id===payment.cuota_id);const already=payments.filter(p=>p.cuota_id===payment.cuota_id).reduce((s,p)=>s+Number(p.valor),0);const next=already+value;await supabase.from('cuotas').update({estado:next>=Number(quota.valor_programado)?'pagada':'parcial'}).eq('id',payment.cuota_id);}const paid=payments.filter(p=>p.deuda_id===paymentModal.id).reduce((s,p)=>s+Number(p.valor),0)+value;const state=paid>=Number(paymentModal.valor_total)?'pagada':'activa';await supabase.from('deudas').update({estado:state}).eq('id',paymentModal.id);setSaving(false);setPaymentModal(null);notify('Abono registrado');refresh();};
 const paidFor=d=>payments.filter(p=>p.deuda_id===d.id).reduce((s,p)=>s+Number(p.valor),0);
 return <><PageHeading kicker="CONTROL FINANCIERO" title="Deudas y abonos" subtitle="Controla cafetería, juguetería, lencería, préstamos y otros conceptos. Registra cuotas y pagos por modelo." action={<button className="primary-btn" onClick={()=>setModal(true)} disabled={!models.length}><Plus size={16}/> Registrar deuda</button>}/><div className="stats-grid compact-stats"><StatCard label="Saldo por cobrar" value={money(totalOpen)} foot="Total de deudas activas" icon={CircleDollarSign} accent="stat-warm"/><StatCard label="Deudas activas" value={debts.filter(d=>d.estado==='activa').length} foot="Con saldo pendiente" icon={CreditCard}/><StatCard label="Abonos registrados" value={payments.length} foot="Movimientos de pago" icon={Banknote} accent="stat-lilac"/></div><section className="panel table-panel"><div className="panel-heading"><div><h3>Estado de cuenta por modelo</h3><p>Saldo, pagos acumulados y seguimiento de cuotas</p></div></div>{debts.length?<div className="debt-list">{debts.map(d=>{const model=models.find(m=>m.id===d.modelo_id);const paid=paidFor(d);const balance=Math.max(0,Number(d.valor_total)-paid);const pct=Math.min(100,paid/Math.max(1,Number(d.valor_total))*100);return <div className="debt-card" key={d.id}><div className="debt-top"><div><span className="debt-category">{d.categoria}</span><h4>{d.concepto}</h4><small>{model?.nombre||'Modelo'} · {dateLabel(d.fecha_deuda)}</small></div><span className={`status-pill ${d.estado}`}>{d.estado}</span></div><div className="debt-numbers"><div><small>Valor inicial</small><b>{money(d.valor_total)}</b></div><div><small>Abonado</small><b className="paid-value">{money(paid)}</b></div><div><small>Saldo</small><b className="balance-value">{money(balance)}</b></div></div><div className="debt-progress"><i style={{width:`${pct}%`}}/></div><div className="debt-bottom"><span>{Math.round(pct)}% pagado · {installments.filter(i=>i.deuda_id===d.id&&i.estado==='pagada').length}/{installments.filter(i=>i.deuda_id===d.id).length} cuotas</span>{balance>0&&<button className="secondary-btn small-btn" onClick={()=>openPayment(d)}><Plus size={14}/> Registrar abono</button>}</div></div>;})}</div>:<EmptyInline icon={Wallet} title="No hay deudas registradas" text="Cuando registres una obligación, aquí verás su valor inicial, cuotas, abonos y saldo actualizado."/>}</section>{modal&&<Modal title="Registrar nueva deuda" subtitle="Se generará un plan de cuotas a partir del valor y cantidad indicados." onClose={()=>setModal(false)}><form onSubmit={saveDebt} className="form-grid"><Field label="Modelo *" full><select required value={form.modelo_id} onChange={e=>setForm({...form,modelo_id:e.target.value})}><option value="">Selecciona una modelo</option>{models.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}</select></Field><Field label="Concepto *" full><input required value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Ej. Compra de lencería"/></Field><Field label="Categoría *"><select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}><option value="cafeteria">Cafetería</option><option value="jugueteria">Juguetería</option><option value="lenceria">Lencería</option><option value="prestamo">Préstamo</option><option value="otro">Otro</option></select></Field><Field label="Fecha de la deuda *"><input type="date" required value={form.fecha_deuda} onChange={e=>setForm({...form,fecha_deuda:e.target.value})}/></Field><Field label="Valor total (COP) *"><input type="number" min="1" required value={form.valor_total} onChange={e=>setForm({...form,valor_total:e.target.value})}/></Field><Field label="Número de cuotas *"><input type="number" min="1" max="60" required value={form.numero_cuotas} onChange={e=>setForm({...form,numero_cuotas:e.target.value})}/></Field><Field label="Valor sugerido por cuota"><input type="number" min="0" value={form.valor_cuota_sugerido} onChange={e=>setForm({...form,valor_cuota_sugerido:e.target.value})} placeholder="Se calcula automáticamente"/></Field><Field label="Notas" full><textarea rows="2" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})}/></Field><div className="field-full"><FormActions onCancel={()=>setModal(false)} saving={saving} label="Guardar deuda y cuotas"/></div></form></Modal>}{paymentModal&&<Modal title="Registrar abono" subtitle={`${paymentModal.concepto} · ${models.find(m=>m.id===paymentModal.modelo_id)?.nombre||''}`} onClose={()=>setPaymentModal(null)}><form onSubmit={savePayment} className="form-grid"><Field label="Aplicar a cuota" full><select value={payment.cuota_id} onChange={e=>setPayment({...payment,cuota_id:e.target.value})}><option value="">Pago directo (sin cuota)</option>{installments.filter(i=>i.deuda_id===paymentModal.id&&i.estado!=='pagada').map(i=><option value={i.id} key={i.id}>Cuota {i.numero_cuota} · {money(i.valor_programado)}</option>)}</select></Field><Field label="Valor del abono (COP) *"><input type="number" min="1" required value={payment.valor} onChange={e=>setPayment({...payment,valor:e.target.value})}/></Field><Field label="Fecha del abono *"><input required type="date" value={payment.fecha_abono} onChange={e=>setPayment({...payment,fecha_abono:e.target.value})}/></Field><Field label="Tipo de abono"><select value={payment.tipo} onChange={e=>setPayment({...payment,tipo:e.target.value})}><option value="descuento">Descuento</option><option value="pago_directo">Pago directo</option><option value="ajuste">Ajuste</option></select></Field><Field label="Notas"><input value={payment.notas} onChange={e=>setPayment({...payment,notas:e.target.value})}/></Field><div className="field-full"><FormActions onCancel={()=>setPaymentModal(null)} saving={saving} label="Guardar abono"/></div></form></Modal>}</>;
}

function ReportsPage({models,shifts,production,assignments,apps,goals,debts,payments,reports,refresh,notify}) {
 const [modelId,setModelId]=useState('');const [shiftId,setShiftId]=useState('');const [saving,setSaving]=useState(false);const [filter,setFilter]=useState('');
 const modelShifts=shifts.filter(s=>s.modelo_id===modelId).sort((a,b)=>b.fecha.localeCompare(a.fecha));
 const chosen=shifts.find(s=>s.id===shiftId);const assigned=assignments.filter(a=>a.modelo_id===(chosen?.modelo_id||modelId)&&a.activa);
 const buildPayload=(shift)=>{const model=models.find(m=>m.id===shift.modelo_id);const lines=assignments.filter(a=>a.modelo_id===model?.id&&a.activa).map(a=>{const app=apps.find(x=>x.id===a.aplicacion_id);const p=production.find(x=>x.turno_id===shift.id&&x.modelo_aplicacion_id===a.id);const g=goals.filter(x=>x.modelo_aplicacion_id===a.id&&x.fecha_inicio<=shift.fecha&&(!x.fecha_fin||x.fecha_fin>=shift.fecha)).sort((x,y)=>y.fecha_inicio.localeCompare(x.fecha_inicio))[0];return {aplicacion:app?.nombre||'Aplicación',usuario:a.usuario||'',tokens:Number(p?.tokens||0),meta:Number(g?.tokens_meta||0),porcentaje:g?.tokens_meta?Math.round(Number(p?.tokens||0)/Number(g.tokens_meta)*100):null};});const total=lines.reduce((s,x)=>s+x.tokens,0);const open=debts.filter(d=>d.modelo_id===model?.id&&d.estado==='activa').reduce((s,d)=>s+Math.max(0,Number(d.valor_total)-payments.filter(p=>p.deuda_id===d.id).reduce((x,p)=>x+Number(p.valor),0)),0);return {modelo:model?.nombre||'Modelo',nickname:model?.nickname||'',fecha:shift.fecha,jornada:shift.jornada,hora_inicio:shift.hora_inicio,hora_fin:shift.hora_fin,sala:shift.sala||'',es_apoyo:!!shift.es_apoyo,tipo_turno:shift.tipo_turno||'normal',jornadas_cubiertas:shift.jornadas_cubiertas||[],pendientes:shift.pendientes||'',aplicaciones:lines,total_tokens:total,saldo_pendiente:open};};
  const generate=async()=>{
    if(!chosen)return;
    setSaving(true);
    const content=buildPayload(chosen);
    const existing=reports.find(r=>r.turno_id===chosen.id);
    const result=existing
      ? await supabase.from('reportes').update({contenido:content,fecha_reporte:chosen.fecha,estado:existing.estado==='enviado'?'enviado':'generado'}).eq('id',existing.id)
      : await supabase.from('reportes').insert({modelo_id:chosen.modelo_id,turno_id:chosen.id,fecha_reporte:chosen.fecha,contenido:content,estado:'generado'});
    setSaving(false);
    if(result.error){notify(result.error.message);return;}
    notify(existing?'Reporte actualizado':'Reporte generado');
    refresh();
  };
 const reportText=(report)=>{const c=report.contenido||{};const appsText=(c.aplicaciones||[]).map(a=>`• ${a.aplicacion}${a.usuario?' (@'+a.usuario+')':''}: ${number(a.tokens)} tokens${a.meta?` / meta ${number(a.meta)} (${a.porcentaje}%)`:''}`).join('\n');return `✨ *ELITE CONTROL · REPORTE DE TURNO*\n\nHola ${c.modelo||'modelo'}, este es el resumen de tu jornada del ${dateLabel(c.fecha)}.\nTurno: ${c.jornada||'—'}${c.hora_inicio?` (${c.hora_inicio} - ${c.hora_fin||'—'})`:''}\nSala: ${c.sala||'No registrada'}\n\n${appsText||'Sin producción registrada.'}\n\n*TOTAL: ${number(c.total_tokens||0)} tokens*\n${c.es_apoyo?'Modalidad: apoyo / doblaje.':''}\n\nGracias por tu trabajo. 💗`;};
 const openWhatsApp=(r)=>{const m=models.find(x=>x.id===r.modelo_id);if(!m?.telefono){notify('Agrega el teléfono de WhatsApp en la ficha de la modelo.');return;}const phone=m.telefono.replace(/\D/g,'');const intl=phone.startsWith('57')?phone:`57${phone}`;window.open(`https://wa.me/${intl}?text=${encodeURIComponent(reportText(r))}`,'_blank','noopener,noreferrer');};
 const markSent=async r=>{const {error}=await supabase.from('reportes').update({estado:'enviado',enviado_at:new Date().toISOString()}).eq('id',r.id);if(error)notify(error.message);else{notify('Reporte marcado como enviado');refresh();}};
 const visible=reports.filter(r=>!filter||r.modelo_id===filter);
 return <><PageHeading kicker="COMUNICACIÓN CON EL EQUIPO" title="Reportes de turno" subtitle="Genera un resumen individual de producción y compártelo con cada modelo por WhatsApp al finalizar su jornada."/><section className="panel report-generator"><div className="report-step-icon"><FileBarChart2 size={24}/></div><div className="report-builder"><h3>Crear un reporte individual</h3><p>Selecciona la modelo y su turno. El mensaje muestra aplicaciones, metas, tokens y saldo pendiente registrado.</p><div className="report-form"><Field label="Modelo"><select value={modelId} onChange={e=>{setModelId(e.target.value);setShiftId('');}}><option value="">Selecciona una modelo</option>{models.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}</select></Field><Field label="Turno"><select value={shiftId} onChange={e=>setShiftId(e.target.value)} disabled={!modelId}><option value="">Selecciona un turno</option>{modelShifts.map(s=><option key={s.id} value={s.id}>{dateLabel(s.fecha)} · {s.jornada} · {s.hora_inicio||'—'}</option>)}</select></Field><button className="primary-btn" disabled={!chosen||saving} onClick={generate}>{saving?'Generando…':'Generar reporte'}<Plus size={15}/></button></div>{chosen&&<div className="report-preview"><div className="preview-head"><span>VISTA PREVIA</span><span>{dateLabel(chosen.fecha)} · {chosen.jornada}</span></div><div className="preview-content">{buildPayload(chosen).aplicaciones.map(a=><div key={a.aplicacion}><span>{a.aplicacion}</span><b>{number(a.tokens)} tokens {a.meta?`· meta ${number(a.meta)}`:''}</b></div>)}<div className="preview-total"><span>Total de tokens</span><b>{number(buildPayload(chosen).total_tokens)}</b></div></div></div>}</div></section><section className="panel table-panel"><div className="table-toolbar"><div><h3>Historial de reportes</h3><p>Abre WhatsApp para compartir el mensaje y después marca el envío.</p></div><select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Todas las modelos</option>{models.map(m=><option value={m.id} key={m.id}>{m.nombre}</option>)}</select></div>{visible.length?<div className="report-list">{visible.map(r=><div className="report-row" key={r.id}><div className="report-file"><FileText size={20}/></div><div className="report-meta"><b>{models.find(m=>m.id===r.modelo_id)?.nombre||'Modelo'}</b><span>{dateLabel(r.fecha_reporte)} · {r.contenido?.jornada||'Turno'} · {number(r.contenido?.total_tokens||0)} tokens</span></div><span className={`status-pill ${r.estado}`}>{r.estado}</span><button className="whatsapp-btn" onClick={()=>openWhatsApp(r)}><MessageCircle size={15}/> WhatsApp</button>{r.estado!=='enviado'&&<button className="icon-btn" title="Marcar como enviado" onClick={()=>markSent(r)}><CheckCircle2 size={17}/></button>}</div>)}</div>:<EmptyInline icon={FileText} title="Todavía no hay reportes" text="Cuando generes el primer resumen, podrás compartirlo por WhatsApp desde aquí."/>}</section></>;
}

export default App;
