/* Recepción de mercancía · Enjoy Videogames
   Página estática + Supabase (login, base de datos y tiempo real). */
const SECS=[
 {k:'nv',n:'GPU NVIDIA',e:'🟩',c:'var(--nv)'},{k:'amd',n:'GPU AMD',e:'🟥',c:'var(--amd)'},{k:'intel',n:'GPU INTEL',e:'🟦',c:'var(--intel)'},
 {k:'lap',n:'Portátiles',e:'💻',c:'var(--muted)'},{k:'comp',n:'Componentes',e:'⚙️',c:'var(--accent)',subs:['mb','cpu','ram','ssd','rl','rt','fan','psu','chasis']},
 {k:'con',n:'Consolas',e:'🎮',c:'var(--muted)'},{k:'ext',n:'Extras',e:'🎧',c:'var(--muted)'},{k:'apple',n:'Apple',e:'🍎',c:'var(--fg)'}];
const SUBN={mb:'MB',cpu:'CPU',ram:'RAM',ssd:'SSD',rl:'RL',rt:'RT',fan:'FAN',psu:'PSU',chasis:'Chasis'};
const secOf=s=>SUBN[s]?'comp':s;
const S={sb:null,me:null,recs:[],rid:null,lineas:{},conteos:{},cat:null,view:'login',sec:null,sub:'mb',q:'',f:{},more:false,
  gc:{},gone:{},openbox:false,kg:false,local:{},pend:{},undo:[],live:false,confirm:null,chan:null,recChan:null,busy:false,loginErr:''};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const slug=s=>norm(s).replace(/ /g,'-').slice(0,80)||'x';
const r2=n=>Math.round(n*100)/100;
const fmtQ=(q,u)=>u==='kg'?String(r2(q).toFixed(2)).replace(/\.?0+$/,'')+' kg':String(q);
const who=email=>{const n=String(email||'').split('@')[0].replace(/[._-]+/g,' ').trim();return n?n.charAt(0).toUpperCase()+n.slice(1):'Alguien'};

function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2200)}
function vib(){try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}}
function rec(){return S.recs.find(r=>r.id===S.rid)}
function closed(){const r=rec();return !!(r&&r.estado==='cerrada')}
function setSync(ok){$('sync').className='dot '+(ok?'ok':'warn')}

/* ---------- conversión filas <-> app ---------- */
const recFromRow=r=>({id:r.id,nombre:r.nombre,estado:r.estado,creada:Date.parse(r.creada)});
const lineFromRow=r=>({sec:r.seccion,nombre:r.nombre,pid:r.woo_id,sku:r.sku||'',unidad:r.unidad,estado:r.estado,ts:Date.parse(r.creada)});
const lineToRow=(key,l)=>({recepcion_id:S.rid,clave:key,seccion:l.sec,nombre:l.nombre,woo_id:l.pid||null,sku:l.sku||'',unidad:l.unidad,estado:l.estado});

/* ---------- conteos ---------- */
function cid(key,u){return key+'~'+u}
function qtyOf(id){return id in S.local?S.local[id]:(S.conteos[id]?.cantidad||0)}
function idsOf(key){const p=key+'~';return [...new Set([...Object.keys(S.conteos),...Object.keys(S.local)].filter(i=>i.startsWith(p)))]}
function totals(key){let t=0;const by=[];for(const id of idsOf(key)){const q=qtyOf(id);if(q){t+=q;by.push([who(id.slice(key.length+1)),q])}}return{t:r2(t),by}}
function bump(key,delta,noUndo,usr){
  if(!S.me||closed())return;
  /* sumar: siempre a mi nombre. Restar: primero lo mío; si no tengo, a quien más haya contado */
  let u=usr||S.me;
  if(!usr&&delta<0&&qtyOf(cid(key,S.me))<=0){let bq=0;for(const id of idsOf(key)){const q=qtyOf(id);if(q>bq){bq=q;u=id.slice(key.length+1)}}}
  const id=cid(key,u);const cur=qtyOf(id);const next=r2(Math.max(0,cur+delta));
  if(next===cur)return;
  S.local[id]=next;if(!noUndo){S.undo.push([key,next-cur,u]);if(S.undo.length>50)S.undo.shift()}
  if(next>0){clearTimeout(S.gc[key]);delete S.gc[key]}
  vib();render();queue(id,key);
  if(totals(key).t===0)toast('Producto quitado de la lista · Deshacer para recuperarlo');
}
function queue(id,key){const p=S.pend[id]||(S.pend[id]={});clearTimeout(p.t);p.t=setTimeout(()=>flush(id,key),450)}
async function flush(id,key){
  const p=S.pend[id];if(!p)return;if(p.w){p.dirty=true;return}
  p.w=true;p.dirty=false;const qty=S.local[id];const usuario=id.slice(key.length+1);
  let {error}=await S.sb.from('recepcion_conteos').upsert({recepcion_id:S.rid,clave:key,usuario,cantidad:qty,actualizado:new Date().toISOString()},{onConflict:'recepcion_id,clave,usuario'});
  if(error&&error.code==='23503'){await restore(key,true);({error}=await S.sb.from('recepcion_conteos').upsert({recepcion_id:S.rid,clave:key,usuario,cantidad:qty,actualizado:new Date().toISOString()},{onConflict:'recepcion_id,clave,usuario'}))}
  p.w=false;
  if(error){
    if(isAuthErr(error))return sessionLost();
    p.tries=(p.tries||0)+1;
    if(p.tries>5){toast('Sin conexión: tus conteos no se están guardando. Revisa el wifi o los datos.');p.tries=0;return setTimeout(()=>flush(id,key),15000)}
    toast('No se pudo guardar; reintentando…');return setTimeout(()=>flush(id,key),2000*p.tries);
  }
  p.tries=0;if(p.dirty)return flush(id,key);
  S.conteos[id]={...(S.conteos[id]||{}),cantidad:qty};
  if(S.local[id]===qty){delete S.local[id];delete S.pend[id]}
  if(qty===0&&totals(key).t===0){clearTimeout(S.gc[key]);S.gc[key]=setTimeout(()=>cleanup(key),3000)}
}
const isAuthErr=e=>e&&(e.code==='PGRST301'||e.code==='42501'||/JWT|jwt/.test(e.message||''));
/* total 0 → se borra el producto (y sus conteos, en cascada). Deshacer lo recupera. */
async function cleanup(key){
  delete S.gc[key];
  if(totals(key).t!==0||!S.lineas[key]||Object.keys(S.pend).some(id=>id.startsWith(key+'~')))return;
  S.gone[key]=S.lineas[key];
  await S.sb.from('recepcion_lineas').delete().eq('recepcion_id',S.rid).eq('clave',key);
}
async function restore(key,force){
  if((S.lineas[key]&&!force)||!(S.gone[key]||S.lineas[key]))return;const l=S.gone[key]||S.lineas[key];S.lineas[key]=l;
  await S.sb.from('recepcion_lineas').upsert(lineToRow(key,l),{onConflict:'recepcion_id,clave',ignoreDuplicates:true});
}
async function addLine({sec,nombre,pid,sku}){
  const unit=(S.kg&&secOf(sec)==='ext')?'kg':'u';
  const key=(pid?'p'+pid:'t-'+slug(nombre))+(S.openbox?'-ob':'')+(unit==='kg'?'-kg':'');
  if(!S.lineas[key]){
    const l={sec,nombre,pid:pid||null,sku:sku||'',unidad:unit,estado:S.openbox?'Open box':'Nuevo',ts:Date.now()};
    S.lineas[key]=l;
    const {error}=await S.sb.from('recepcion_lineas').upsert(lineToRow(key,l),{onConflict:'recepcion_id,clave',ignoreDuplicates:true});
    if(error){delete S.lineas[key];if(isAuthErr(error))return sessionLost();toast('No se pudo añadir el producto');return render()}
  }
  bump(key,unit==='kg'?0.5:1);S.q='';S.f={};S.more=false;render();toast('Añadido: '+nombre);
  requestAnimationFrame(()=>document.querySelector(`[data-card="${CSS.escape(key)}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}));
}

/* ---------- catálogo ---------- */
async function loadCat(){try{const r=await fetch('catalogo.json');S.cat=await r.json();S.cat.p.forEach(p=>p.h=norm(p[1]+' '+p[2]+' '+p[3]))}catch(e){S.cat={p:[],f:{}}}render()}
const LV=[['m','Marca',5],['g','Gama',6],['r','Referencia',7]];
function pool(sec){
  if(!S.cat)return[];const match=sec==='comp'?S.sub:sec;
  return S.cat.p.filter(p=>p[4]===match&&LV.every(([k,,i])=>S.f[k]==null||(p[i]||'')===S.f[k]));
}
function search(sec,q){
  if(norm(q).length<2)return[];const toks=norm(q).split(' ');
  return pool(sec).filter(p=>toks.every(t=>p.h.includes(t))).slice(0,25);
}
/* siguiente nivel a elegir: el primero sin seleccionar que tenga más de un valor */
function nextLevel(items){
  for(const [k,label,i] of LV){if(S.f[k]!=null)continue;
    const c=new Map();items.forEach(p=>{const v=p[i]||'';c.set(v,(c.get(v)||0)+1)});
    if(c.size<2&&!(c.size===1&&!c.has('')))continue;
    const w=S.cat?.w?.[S.sec==='comp'?S.sub:S.sec]||{};
    const vals=[...c].sort((a,b)=>(!a[0])-(!b[0])||(w[k+':'+b[0]]||0)-(w[k+':'+a[0]]||0)||b[1]-a[1]);
    if(c.size===1){S.f[k]=vals[0][0];continue}
    return{k,label,vals};
  }
  return null;
}
function facetName(){return [S.f.g,S.f.m,S.f.r].filter(Boolean).join(' ')}

/* ---------- Supabase: sesión, datos y tiempo real ---------- */
function boot(){
  loadCat();
  if(!window.CONFIG?.supabaseUrl||!window.supabase){$('app').innerHTML='<h2>Falta configuración</h2><p class="muted">Revisa config.js.</p>';return}
  S.sb=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseKey);
  S.sb.auth.onAuthStateChange((_ev,session)=>{
    if(session&&expired()){setTimeout(()=>forceLogout(),0);return}
    const email=session?.user?.email||null;
    if(email===S.me)return;
    S.me=email;
    if(email){S.view='home';startRecs()}else{stopAll();S.view='login'}
    render();
  });
}
/* La sesión dura hasta las 00:00 hora Colombia: cada día hay que volver a entrar. */
const DAY_KEY='enjoy.diaSesion';
const hoyCO=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota'}).format(new Date());
function expired(){let d=null;try{d=localStorage.getItem(DAY_KEY)}catch(e){}return d!==hoyCO()}
async function forceLogout(){
  if(S.loggingOut)return;S.loggingOut=true;
  await S.sb.auth.signOut();S.loggingOut=false;S.me=null;stopAll();S.view='login';
  S.loginErr='Tu sesión terminó a las 00:00 (hora Colombia). Vuelve a entrar.';render();
}
setInterval(()=>{if(S.me&&expired())forceLogout()},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.me&&expired())forceLogout()});
async function login(email,password){
  S.busy=true;S.loginErr='';render();
  try{localStorage.setItem(DAY_KEY,hoyCO())}catch(e){}
  const {error}=await S.sb.auth.signInWithPassword({email,password});
  S.busy=false;if(error){S.loginErr='Correo o contraseña incorrectos.';try{localStorage.removeItem(DAY_KEY)}catch(e){}}render();
}
function sessionLost(){toast('Tu sesión caducó: vuelve a entrar');S.sb.auth.signOut()}
function stopAll(){if(S.chan){S.sb.removeChannel(S.chan);S.chan=null}if(S.recChan){S.sb.removeChannel(S.recChan);S.recChan=null}S.recs=[];S.rid=null;S.live=false}
async function loadRecs(){
  const {data,error}=await S.sb.from('recepciones').select('*').order('creada',{ascending:false}).limit(40);
  if(error){setSync(false);if(isAuthErr(error))return sessionLost();return toast('No se pudieron cargar las recepciones')}
  S.recs=data.map(recFromRow);S.live=true;render();
}
function startRecs(){
  loadRecs();
  S.recChan=S.sb.channel('recepciones').on('postgres_changes',{event:'*',schema:'public',table:'recepciones'},pl=>{
    if(pl.eventType==='DELETE'){S.recs=S.recs.filter(r=>r.id!==pl.old.id);if(S.rid===pl.old.id){closeRec();toast('Esta recepción fue eliminada')}}
    else{const r=recFromRow(pl.new);const i=S.recs.findIndex(x=>x.id===r.id);if(i<0)S.recs.unshift(r);else S.recs[i]=r}
    render();
  }).subscribe(st=>{if(st==='SUBSCRIBED'){setSync(true);loadRecs()}else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT')setSync(false)});
}
function closeRec(){if(S.chan){S.sb.removeChannel(S.chan);S.chan=null}S.rid=null;S.view='home'}
async function loadRec(id){
  const [l,c]=await Promise.all([
    S.sb.from('recepcion_lineas').select('*').eq('recepcion_id',id),
    S.sb.from('recepcion_conteos').select('*').eq('recepcion_id',id)]);
  if(S.rid!==id)return;
  if(l.error||c.error){setSync(false);return toast('No se pudo cargar la recepción')}
  const lo={};l.data.forEach(r=>lo[r.clave]=lineFromRow(r));S.lineas=lo;
  const co={};c.data.forEach(r=>co[cid(r.clave,r.usuario)]={cantidad:Number(r.cantidad)});S.conteos=co;
  for(const id2 in S.local){if(!S.pend[id2]?.w&&co[id2]?.cantidad===S.local[id2]){delete S.local[id2];delete S.pend[id2]}}
  render();
}
function openRec(id){
  if(S.chan){S.sb.removeChannel(S.chan);S.chan=null}
  S.rid=id;S.lineas={};S.conteos={};S.local={};S.undo=[];S.view='rec';
  const f='recepcion_id=eq.'+id;
  S.chan=S.sb.channel('rec-'+id)
    .on('postgres_changes',{event:'*',schema:'public',table:'recepcion_lineas',filter:f},pl=>{
      if(pl.eventType==='DELETE'){const k=pl.old.clave;delete S.lineas[k];for(const i of Object.keys(S.conteos))if(i.startsWith(k+'~'))delete S.conteos[i]}
      else S.lineas[pl.new.clave]=lineFromRow(pl.new);
      render()})
    .on('postgres_changes',{event:'*',schema:'public',table:'recepcion_conteos',filter:f},pl=>{
      const r=pl.eventType==='DELETE'?pl.old:pl.new;const i=cid(r.clave,r.usuario);
      if(pl.eventType==='DELETE')delete S.conteos[i];else S.conteos[i]={cantidad:Number(r.cantidad)};
      if(!S.pend[i]?.w&&S.local[i]===S.conteos[i]?.cantidad){delete S.local[i];delete S.pend[i]}
      render()})
    .subscribe(st=>{if(st==='SUBSCRIBED'){setSync(true);loadRec(id)}else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT')setSync(false)});
  loadRec(id);render();window.scrollTo(0,0);
}
async function newRec(){
  const nombre='Recepción '+new Date().toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'});
  const {data,error}=await S.sb.from('recepciones').insert({nombre}).select().single();
  if(error)return isAuthErr(error)?sessionLost():toast('No se pudo crear la recepción');
  const r=recFromRow(data);if(!S.recs.find(x=>x.id===r.id))S.recs.unshift(r);openRec(r.id);
}
async function deleteRec(id){
  S.deleting=true;render();
  const {error}=await S.sb.from('recepciones').delete().eq('id',id);
  S.deleting=false;S.confirmDel=null;
  if(error)toast('No se pudo eliminar; inténtalo de nuevo');
  else{S.recs=S.recs.filter(r=>r.id!==id);if(S.rid===id)closeRec();toast('Recepción eliminada')}
  render();
}
async function setEstado(estado){
  const {error}=await S.sb.from('recepciones').update({estado,cerrada:estado==='cerrada'?new Date().toISOString():null}).eq('id',S.rid);
  if(error)return toast('No se pudo cambiar el estado');
  const r=rec();if(r)r.estado=estado;render();toast(estado==='cerrada'?'Recepción cerrada':'Recepción reabierta');
}

/* ---------- salida ---------- */
function rows(){
  const out=[];
  for(const key in S.lineas){const l=S.lineas[key];const t=totals(key);if(t.t>0)out.push({key,...l,qty:t.t,by:t.by})}
  const order=k=>{const s=secOf(k);const i=SECS.findIndex(x=>x.k===s);const j=SECS[4].subs.indexOf(k);return i*100+(j<0?0:j)};
  return out.sort((a,b)=>order(a.sec)-order(b.sec)||a.ts-b.ts);
}
function whatsapp(){
  const rs=rows();const lines=[];
  for(const s of SECS){const rr=rs.filter(r=>secOf(r.sec)===s.k);if(!rr.length)continue;
    lines.push(`${s.e}${s.n}${s.e}`);
    for(const r of rr){let t='- '+r.nombre;
      if(r.unidad==='kg')t+=' '+fmtQ(r.qty,'kg').replace(' ','');else if(r.qty>1)t+=` - ${r.qty} unidades`;
      if(r.estado==='Open box')t+=' (OPEN BOX)';lines.push(t)}}
  return lines.join('\n');
}
function csv(){
  const h=['Sección','Subsección','Producto','Cantidad','Unidad','Estado','SKU','ID Woo','Contado por','Nº pedido'];
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const body=rows().map(r=>{const s=SECS.find(x=>x.k===secOf(r.sec));return[s.n,SUBN[r.sec]||'',r.nombre,String(r.qty).replace('.',','),r.unidad==='kg'?'kg':'unidades',r.estado,r.sku,r.pid||'',r.by.map(b=>b[0]+' ('+fmtQ(b[1],r.unidad)+')').join(', '),''].map(q).join(';')});
  return '﻿'+[h.map(q).join(';'),...body].join('\r\n');
}
async function copyWA(){
  const t=whatsapp();if(!t)return toast('Todavía no hay productos contados');
  try{await navigator.clipboard.writeText(t);toast('Mensaje copiado: pégalo en WhatsApp')}
  catch(e){const pre=$('wa');if(pre){const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r)}toast('Texto seleccionado: cópialo manualmente')}
}
function downloadCSV(){
  if(!rows().length)return toast('Todavía no hay productos contados');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv()],{type:'text/csv;charset=utf-8'}));
  a.download=(rec()?.nombre||'recepcion').replace(/[^\w\- áéíóúñ]/gi,'').replace(/\s+/g,'-')+'.csv';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('Excel descargado');
}

/* ---------- render ---------- */
function secTotal(k){let u=0,kg=0;for(const key in S.lineas){const l=S.lineas[key];if(secOf(l.sec)!==k)continue;const t=totals(key).t;if(l.unidad==='kg')kg+=t;else u+=t}return{u,kg:r2(kg)}}
function card(key){
  const l=S.lineas[key];const t=totals(key);const mine=qtyOf(cid(key,S.me));const kg=l.unidad==='kg';const dis=closed()?'disabled':'';
  const steps=kg?[-0.1,0.1,0.5]:[-1,1,5];
  return `<div class="card ${mine?'mine':''}" data-card="${esc(key)}">
    <div class="card-head"><div class="grow"><b>${esc(l.nombre)}</b>
      <div class="row" style="margin-top:6px">${l.estado==='Open box'?'<span class="pill open">Open box</span>':''}${l.sec!==secOf(l.sec)?`<span class="pill">${SUBN[l.sec]}</span>`:''}${l.sku?`<span class="pill">${esc(l.sku)}</span>`:''}</div>
      <div class="who" style="margin-top:6px">${t.by.length?t.by.map(b=>esc(b[0])+': '+fmtQ(b[1],l.unidad)).join(' · '):'Sin contar todavía'}</div></div>
      <div class="total">${fmtQ(t.t,l.unidad)}<small>total</small></div></div>
    <div class="counter">${steps.map(s=>`<button ${dis} class="${s>0?'add':''}" data-act="bump" data-key="${esc(key)}" data-d="${s}" aria-label="${s>0?'Sumar':'Restar'} ${Math.abs(s)}">${s>0?'+':'−'}${String(Math.abs(s)).replace('.',',')}</button>`).join('')}</div>
  </div>`;
}
function render(){
  const app=$('app');const bar=$('bar');const barIn=$('barIn');
  $('whoName').textContent=S.me?who(S.me):'Entrar';
  const r=rec();$('sub').textContent=r?r.nombre+(r.estado==='cerrada'?' · cerrada':''):'Inventario de mercancía';
  const active=document.activeElement?.id;const caret=active&&document.activeElement.tagName==='INPUT'&&!['checkbox','password','email'].includes(document.activeElement.type)?document.activeElement.selectionStart:null;
  let h='';bar.hidden=true;

  if(!S.me||S.view==='login'){
    h=`<h2>Entrar</h2><p class="muted">Usa el mismo correo y contraseña del control de garantías.</p>
      <form id="loginForm" class="stack names" autocomplete="on">
        <input id="email" type="email" required placeholder="Correo" autocomplete="username" aria-label="Correo">
        <input id="pass" type="password" required placeholder="Contraseña" autocomplete="current-password" aria-label="Contraseña">
        ${S.loginErr?`<div class="note">${esc(S.loginErr)}</div>`:''}
        <button class="btn primary" type="submit" ${S.busy?'disabled':''}>${S.busy?'Entrando…':'Entrar'}</button>
      </form>`;
  }
  else if(S.view==='who'){
    h=`<h2>Tu cuenta</h2><p class="muted">Has entrado como <b>${esc(S.me)}</b>. Tus conteos se guardan a tu nombre y se suman a los del equipo.</p>
      <div class="stack"><button class="btn" data-act="logout">Cerrar sesión</button><button class="btn ghost" data-act="home">Volver</button></div>`;
  }
  else if(S.view==='home'||!r){
    const open=S.recs.filter(x=>x.estado!=='cerrada'),done=S.recs.filter(x=>x.estado==='cerrada').slice(0,10);
    const item=x=>`<div class="rec-row"><button class="list-item" data-act="open" data-id="${esc(x.id)}"><span class="grow"><b>${esc(x.nombre)}</b><span class="muted">${new Date(x.creada).toLocaleString('es-CO',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></span><span class="pill ${x.estado==='cerrada'?'':'open'}">${x.estado==='cerrada'?'Cerrada':'Abierta'}</span></button>
      <button class="icon-btn del" data-act="askdel" data-id="${esc(x.id)}" aria-label="Eliminar ${esc(x.nombre)}">✕</button></div>
      ${S.confirmDel===x.id?`<div class="note stack"><span><b>¿Eliminar «${esc(x.nombre)}»?</b> Se borran todos sus productos y conteos para todo el equipo. No se puede deshacer.</span>
        <div class="row"><button class="btn primary" style="flex:1" data-act="dodel" data-id="${esc(x.id)}" ${S.deleting?'disabled':''}>${S.deleting?'Eliminando…':'Sí, eliminar'}</button><button class="btn" style="flex:1" data-act="nodel">Cancelar</button></div></div>`:''}`;
    h=`<h2>Recepciones</h2>
      ${S.live||S.recs.length?'':'<p class="muted">Cargando recepciones…</p>'}
      ${open.length?`<h3>En curso: únete a una</h3><div class="stack">${open.map(item).join('')}</div>`:(S.live?'<div class="note">No hay ninguna recepción abierta. Cuando llegue la mercancía, crea una y el resto del equipo podrá unirse desde su móvil.</div>':'')}
      ${done.length?`<h3>Cerradas</h3><div class="stack">${done.map(item).join('')}</div>`:''}`;
    bar.hidden=false;barIn.innerHTML=`<button class="btn primary" data-act="new">Nueva recepción</button>`;
  }
  else if(S.view==='rec'){
    const all=rows();const units=all.filter(x=>x.unidad!=='kg').reduce((a,b)=>a+b.qty,0);
    h=`${closed()?'<div class="note" style="margin-top:14px">Esta recepción está cerrada. Reábrela desde el resumen si necesitas corregir algo.</div>':''}
      <h2>Secciones</h2><p class="muted">${units} unidades · ${all.length} productos contados</p>
      <div class="grid">${SECS.map(s=>{const t=secTotal(s.k);return`<button class="tile" style="--c:${s.c}" data-act="sec" data-k="${s.k}"><span class="t-name">${s.e} ${esc(s.n)}</span><span class="t-count">${t.u}<small>uds${t.kg?' · '+fmtQ(t.kg,'kg'):''}</small></span></button>`}).join('')}</div>`;
    bar.hidden=false;barIn.innerHTML=`<button class="btn ghost" data-act="home">Recepciones</button><button class="btn primary" data-act="sum">Resumen y enviar</button>`;
  }
  else if(S.view==='sec'){
    const s=SECS.find(x=>x.k===S.sec);
    const keys=Object.keys(S.lineas).filter(k=>totals(k).t>0&&secOf(S.lineas[k].sec)===s.k&&(s.k!=='comp'||S.lineas[k].sec===S.sub)).sort((a,b)=>(S.lineas[b].ts||0)-(S.lineas[a].ts||0));
    const searching=norm(S.q).length>=2;
    const items=pool(s.k);const nl=searching?null:nextLevel(items);const res=searching?search(s.k,S.q):(nl&&items.length>10?[]:items.slice(0,40));
    const picked=LV.filter(([k])=>S.f[k]!=null);const unit=S.kg&&s.k==='ext'?'kg':'1';
    const prodRow=p=>`<button data-act="addcat" data-id="${p[0]}"><span class="grow">${esc(p[1])}<span class="sku">${esc(p[2]||p[3]||'')}</span></span><span class="plus">+1</span></button>`;
    const shown=nl?(S.more?nl.vals:nl.vals.slice(0,18)):[];
    h=`<h2>${s.e} ${esc(s.n)}</h2>
      ${s.subs?`<div class="subs" role="tablist">${s.subs.map(k=>`<button class="chip ${S.sub===k?'on':''}" data-act="sub" data-k="${k}" role="tab" aria-selected="${S.sub===k}">${SUBN[k]}</button>`).join('')}</div>`:''}
      ${closed()?'':`<div class="stack" style="margin-top:12px">
        ${picked.length?`<div class="crumbs">${picked.map(([k,label])=>`<button class="chip on" data-act="unf" data-k="${k}" aria-label="Quitar ${label}">${esc(S.f[k]||'Otros')} <span aria-hidden="true">✕</span></button>`).join('<span class="sep">›</span>')}</div>`:''}
        ${nl?`<h3 style="margin:4px 0 0">Elige ${nl.label.toLowerCase()} <span class="muted" style="text-transform:none;letter-spacing:0">· ${items.length} productos</span></h3>
          <div class="facets">${shown.map(([v,c])=>`<button class="fchip" data-act="f" data-k="${nl.k}" data-v="${esc(v)}">${esc(v||'Otros')}<small>${c}</small></button>`).join('')}
          ${nl.vals.length>18&&!S.more?`<button class="fchip ghost" data-act="more">Ver todas (${nl.vals.length})</button>`:''}</div>`:''}
        ${res.length?`<h3 style="margin:4px 0 0">${searching?'Resultados':'Elige el producto'}</h3><div class="res">${res.map(prodRow).join('')}</div>`:''}
        ${searching||picked.length?`<div class="res"><button data-act="addfree"><span class="grow">Añadir «${esc(searching?S.q.trim():facetName())}» tal cual<span class="sku">Si no aparece en la lista</span></span><span class="plus">+${unit}</span></button></div>`:''}
        <div class="search"><input id="q" type="search" autocomplete="off" placeholder="…o busca por modelo o referencia" value="${esc(S.q)}" aria-label="Buscar producto"></div>
        <div class="row"><label class="toggle"><input type="checkbox" id="ob" ${S.openbox?'checked':''}> Open box</label>${s.k==='ext'?`<label class="toggle"><input type="checkbox" id="kg" ${S.kg?'checked':''}> Contar en kg</label>`:''}</div>
      </div>`}
      <h3>Contado en ${s.subs?SUBN[S.sub]:'esta sección'} (${keys.length})</h3>
      <div class="stack">${keys.length?keys.map(card).join(''):'<p class="muted">Aún no hay productos. Elige marca, gama y referencia, o búscalo arriba.</p>'}</div>`;
    bar.hidden=false;barIn.innerHTML=`<button class="btn ghost" data-act="back">← Secciones</button><button class="btn" data-act="undo" ${S.undo.length&&!closed()?'':'disabled'}>Deshacer</button>`;
  }
  else if(S.view==='sum'){
    const rs=rows();const wa=whatsapp();
    h=`<h2>Resumen</h2><p class="muted">${rs.length} productos. Revisa antes de enviar al grupo.</p>
      <div class="stack">${SECS.map(s=>{const rr=rs.filter(r=>secOf(r.sec)===s.k);if(!rr.length)return'';return`<section class="sum-sec"><header><span>${s.e} ${esc(s.n)}</span><span>${rr.filter(r=>r.unidad!=='kg').reduce((a,b)=>a+b.qty,0)}</span></header>${rr.map(r=>`<div class="sum-row"><span class="grow">${esc(r.nombre)}${r.estado==='Open box'?' <span class="pill open">Open box</span>':''}<div class="who">${r.by.map(b=>esc(b[0])+' '+fmtQ(b[1],r.unidad)).join(' · ')}</div></span><span class="q">${fmtQ(r.qty,r.unidad)}</span></div>`).join('')}</section>`}).join('')||'<p class="muted">Todavía no se ha contado nada.</p>'}</div>
      <h3>Mensaje para WhatsApp</h3><pre class="wa" id="wa">${esc(wa)||'—'}</pre>
      <div class="stack" style="margin-top:12px">
        <button class="btn" data-act="csv">Descargar Excel (con Nº pedido)</button>
        ${closed()?`<button class="btn ghost" data-act="reopen">Reabrir recepción</button>`:
          (S.confirm==='close'?`<div class="note">¿Cerrar la recepción? Nadie podrá seguir contando hasta que se reabra.</div><div class="row"><button class="btn primary" style="flex:1" data-act="doclose">Sí, cerrar</button><button class="btn" style="flex:1" data-act="noclose">Cancelar</button></div>`
          :`<button class="btn ghost" data-act="close">Cerrar recepción</button>`)}
      </div>`;
    bar.hidden=false;barIn.innerHTML=`<button class="btn ghost" data-act="backrec">← Secciones</button><button class="btn primary" data-act="wa">Copiar para WhatsApp</button>`;
  }
  const keep=$('email')?.value;app.innerHTML=h;if(keep&&$('email'))$('email').value=keep;
  if(active&&caret!=null){const q=$(active);if(q){q.focus();try{q.setSelectionRange(caret,caret)}catch(x){}}}
}

/* ---------- eventos ---------- */
document.addEventListener('submit',e=>{if(e.target.id==='loginForm'){e.preventDefault();login($('email').value.trim(),$('pass').value)}});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;
  if(a==='who'){if(S.me){S.view='who';render()}return}
  if(a==='logout')return S.sb.auth.signOut();
  if(a==='new')return newRec();
  if(a==='open')return openRec(b.dataset.id);
  if(a==='askdel'){S.confirmDel=b.dataset.id;return render()}
  if(a==='nodel'){S.confirmDel=null;return render()}
  if(a==='dodel')return deleteRec(b.dataset.id);
  if(a==='home'){S.view='home';return render()}
  if(a==='sec'){S.view='sec';S.sec=b.dataset.k;S.q='';S.f={};S.more=false;window.scrollTo(0,0);return render()}
  if(a==='sub'){S.sub=b.dataset.k;S.q='';S.f={};S.more=false;return render()}
  if(a==='f'){S.f[b.dataset.k]=b.dataset.v;S.more=false;vib();return render()}
  if(a==='unf'){const i=LV.findIndex(l=>l[0]===b.dataset.k);LV.slice(i).forEach(([k])=>delete S.f[k]);S.more=false;return render()}
  if(a==='more'){S.more=true;return render()}
  if(a==='back'||a==='backrec'){S.view=S.rid?'rec':'home';S.q='';S.confirm=null;window.scrollTo(0,0);return render()}
  if(a==='sum'){S.view='sum';window.scrollTo(0,0);return render()}
  if(a==='bump')return bump(b.dataset.key,+b.dataset.d);
  if(a==='undo'){const u=S.undo.pop();if(u){restore(u[0]).then(()=>bump(u[0],-u[1],true,u[2]))}return render()}
  if(a==='addcat'){const p=S.cat.p.find(p=>p[0]==b.dataset.id);return addLine({sec:p[4],nombre:p[1],pid:p[0],sku:p[2]||p[3]})}
  if(a==='addfree'){const n=S.q.trim()||facetName();if(n)addLine({sec:S.sec==='comp'?S.sub:S.sec,nombre:n});return}
  if(a==='wa')return copyWA();
  if(a==='csv')return downloadCSV();
  if(a==='close'){S.confirm='close';return render()}
  if(a==='noclose'){S.confirm=null;return render()}
  if(a==='doclose'){S.confirm=null;return setEstado('cerrada')}
  if(a==='reopen')return setEstado('abierta');
});
document.addEventListener('input',e=>{if(e.target.id==='q'){S.q=e.target.value;clearTimeout(render.t);render.t=setTimeout(render,120)}});
document.addEventListener('change',e=>{if(e.target.id==='ob'){S.openbox=e.target.checked}if(e.target.id==='kg'){S.kg=e.target.checked;render()}});
document.addEventListener('keydown',e=>{if(e.target.id==='q'&&e.key==='Enter'){e.preventDefault();document.querySelector('.res button')?.click()}});
render();boot();
