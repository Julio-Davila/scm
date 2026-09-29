(() => {
  'use strict';

  const PASSWORD_HASH = 'bc4095bf7299b32fe975a4848c92806999dae8baf20c1facb730bdc2f2deec10';
  const STORAGE_PREFIX = 'scm_psicologia_progress_v4_';
  const LAST_USER_KEY = 'scm_psicologia_last_user_v4';
  const contentTasks = ['definicion','beneficios','leyes','conflictos','tips','infografias','videos'];
  const gameTasks = ['memory','wordsearch','crossword'];
  const allTasks = [...contentTasks, ...gameTasks];
  const state = { teacher:'', email:'', completed:new Set(), textScale:1, lastSection:'inicio', lastLaw:0, savedAt:null };

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const loginView = $('#loginView');
  const appView = $('#appView');

  function initials(name){
    return (name.trim().split(/\s+/).slice(0,2).map(x => x[0] || '').join('') || 'D').toUpperCase();
  }
  async function sha256(text){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  function normalizeEmail(email){ return String(email || '').trim().toLowerCase(); }
  function userStorageKey(email){ return STORAGE_PREFIX + encodeURIComponent(normalizeEmail(email)); }
  function save(){
    if(!state.email) return;
    state.savedAt = new Date().toISOString();
    const payload = {
      teacher: state.teacher,
      email: normalizeEmail(state.email),
      completed: [...state.completed],
      textScale: state.textScale,
      lastSection: state.lastSection,
      lastLaw: state.lastLaw,
      savedAt: state.savedAt
    };
    try{
      localStorage.setItem(userStorageKey(state.email), JSON.stringify(payload));
      localStorage.setItem(LAST_USER_KEY, JSON.stringify({teacher:state.teacher,email:normalizeEmail(state.email)}));
      updateSaveIndicator();
    }catch(err){
      console.warn('No se pudo guardar el progreso localmente.', err);
    }
  }
  function loadUser(email){
    try{
      const raw = localStorage.getItem(userStorageKey(email));
      if(!raw) return false;
      const saved = JSON.parse(raw);
      state.teacher = saved.teacher || state.teacher;
      state.email = normalizeEmail(saved.email || email);
      state.completed = new Set(Array.isArray(saved.completed) ? saved.completed.filter(t => allTasks.includes(t)) : []);
      state.textScale = Math.min(1.35, Math.max(.9, Number(saved.textScale) || 1));
      state.lastSection = titles?.[saved.lastSection] ? saved.lastSection : 'inicio';
      state.lastLaw = Math.max(0, Math.min(6, Number(saved.lastLaw) || 0));
      state.savedAt = saved.savedAt || null;
      return true;
    }catch(err){ console.warn('No se pudo recuperar el progreso.', err); return false; }
  }
  function loadLastUser(){
    try{
      let last = JSON.parse(localStorage.getItem(LAST_USER_KEY) || '{}');
      // Migración automática desde la versión anterior de la plataforma.
      if(!last.email){
        const legacy = JSON.parse(localStorage.getItem('scm_psicologia_state_v2') || '{}');
        if(legacy.email){
          last = {teacher:legacy.teacher || '', email:legacy.email};
          state.teacher = legacy.teacher || '';
          state.email = normalizeEmail(legacy.email);
          state.completed = new Set(Array.isArray(legacy.completed) ? legacy.completed.filter(t => allTasks.includes(t)) : []);
          state.textScale = Math.min(1.35, Math.max(.9, Number(legacy.textScale) || 1));
          save();
        }
      }
      if(last.email){
        $('#teacherName').value = last.teacher || state.teacher || '';
        $('#teacherEmail').value = last.email || state.email || '';
        state.teacher = last.teacher || state.teacher || '';
        state.email = normalizeEmail(last.email || state.email);
        return loadUser(state.email) || !!state.email;
      }
    }catch{}
    return false;
  }
  function updateSaveIndicator(){
    const label = $('#saveStateLabel');
    if(!label) return;
    if(state.savedAt){
      const d = new Date(state.savedAt);
      label.textContent = 'Guardado ' + new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(d);
    } else label.textContent = 'Guardado automático';
  }
  function applyTextScale(){
    document.documentElement.style.setProperty('--text-scale', String(state.textScale));
    const label = $('#zoomResetBtn');
    if(label) label.textContent = Math.round(state.textScale * 100) + '%';
  }
  function enterApp(){
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    $('#userName').textContent = state.teacher;
    $('#userEmail').textContent = state.email;
    $('#avatar').textContent = initials(state.teacher);
    $('#diplomaName').textContent = state.teacher;
    applyTextScale();
    refreshProgress();
    updateSaveIndicator();
    showSection(state.lastSection || 'inicio', false);
  }

  $('#togglePassword').addEventListener('click', () => {
    const p = $('#password');
    p.type = p.type === 'password' ? 'text' : 'password';
    $('#togglePassword').textContent = p.type === 'password' ? 'Ver' : 'Ocultar';
  });

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#teacherName').value.trim();
    const email = $('#teacherEmail').value.trim();
    const pass = $('#password').value;
    const err = $('#loginError');
    err.textContent = '';
    if(name.length < 3){ err.textContent = 'Ingresa tu nombre completo.'; return; }
    if(!/^\S+@\S+\.\S+$/.test(email)){ err.textContent = 'Ingresa un correo institucional válido.'; return; }
    if(await sha256(pass) !== PASSWORD_HASH){ err.textContent = 'Contraseña incorrecta.'; return; }
    state.teacher = name;
    state.email = normalizeEmail(email);
    const hadProgress = loadUser(state.email);
    // Conserva el nombre recién escrito si aún no existía progreso previo.
    if(!hadProgress) state.teacher = name;
    save();
    enterApp();
  });
  $('#logoutBtn').addEventListener('click', () => {
    save();
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
    $('#password').value = '';
    $('#teacherName').value = state.teacher;
    $('#teacherEmail').value = state.email;
    $('#loginError').textContent = 'Tu avance quedó guardado en esta PC. Ingresa nuevamente para continuar.';
  });
  applyTextScale();

  const titles = {
    inicio:'Bienvenida', definicion:'Definición de relaciones interpersonales', beneficios:'Beneficios',
    leyes:'Las 7 leyes', conflictos:'Manejo de conflictos', tips:'Tips para docentes',
    infografias:'Infografías', videos:'Videos recomendados', juegos:'Juegos didácticos', diploma:'Diploma'
  };
  function showSection(id, shouldSave=true){
    $$('.content-section').forEach(s => s.classList.toggle('active-section', s.id === id));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === id));
    $('#sectionTitle').textContent = titles[id] || 'Psicología';
    $('#sidebar').classList.remove('open');
    state.lastSection = id;
    if(shouldSave && state.email) save();
    window.scrollTo({top:0, behavior:'smooth'});
  }
  $$('.nav-item').forEach(b => b.addEventListener('click', () => showSection(b.dataset.section)));
  $$('.go-section').forEach(b => b.addEventListener('click', () => showSection(b.dataset.target)));
  $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  function complete(task){
    state.completed.add(task);
    save();
    refreshProgress();
    const btn = document.querySelector(`[data-complete="${task}"]`);
    if(btn){ btn.classList.add('done'); btn.textContent = '✓ Contenido completado'; }
  }
  $$('.complete-btn').forEach(b => b.addEventListener('click', () => complete(b.dataset.complete)));
  function refreshProgress(){
    const pct = Math.round(state.completed.size / allTasks.length * 100);
    $('#sidePercent').textContent = pct + '%';
    $('#sideBar').style.width = pct + '%';
    $('#diplomaPercent').textContent = pct + '%';
    $('#diplomaBar').style.width = pct + '%';
    contentTasks.forEach(t => {
      const b = document.querySelector(`[data-complete="${t}"]`);
      if(b && state.completed.has(t)){ b.classList.add('done'); b.textContent = '✓ Contenido completado'; }
    });
    if(pct === 100){
      $('#diplomaLock').classList.add('hidden');
      $('#diplomaArea').classList.remove('hidden');
      $('#diplomaName').textContent = state.teacher || 'Docente';
      $('#diplomaDate').textContent = new Intl.DateTimeFormat('es-PE',{dateStyle:'long'}).format(new Date());
    }else{
      $('#diplomaLock').classList.remove('hidden');
      $('#diplomaArea').classList.add('hidden');
    }
  }

  const laws = [
    ['La mejor manera de cambiar una relación es cambiar uno mismo.','Realiza una autoevaluación periódica de tu desempeño para identificar competencias por desarrollar o potenciar.','Antes de pedir un cambio al estudiante, pregúntate qué puedes ajustar en tu forma de comunicar, organizar o acompañar.'],
    ['Busque lo positivo de cada persona.','Evita colocar etiquetas o rótulos. Confía en el potencial del estudiante y co-construye herramientas para su proceso personal.','Sustituye “es desordenado” por “necesita una estrategia concreta para organizar sus tareas”.'],
    ['Gánese la confianza de las personas.','Un ambiente de confianza facilita la conexión con los estudiantes y el trabajo en equipo.','Cumple los acuerdos, escucha con coherencia y evita exponer públicamente errores personales.'],
    ['Mantenga una actitud ganar–ganar.','La flexibilidad permite generar acuerdos que beneficien a ambas partes durante las sesiones de clase.','Busca soluciones que protejan simultáneamente el aprendizaje, los acuerdos y la dignidad del estudiante.'],
    ['Escuchar con empatía.','Amplía la perspectiva para tomar decisiones considerando el punto de vista del estudiante.','Pregunta “¿cómo lo estás viviendo?” antes de concluir por qué ocurrió una conducta.'],
    ['Sea asertivo al expresarse.','Permite establecer reglas y brindar retroalimentación sin afectar a los estudiantes durante el proceso.','Expresa con claridad: hecho observado, acuerdo esperado y próximo paso.'],
    ['Distinga entre las personas y su conducta.','Al retroalimentar, describe el comportamiento sin etiquetar a la persona.','En vez de “eres irrespetuoso”, usa “ese comportamiento no está alineado con los acuerdos de clase”.']
  ];
  const lawMeta = [
    {icon:'🪞',name:'Cambio personal',color:'#5267d9',soft:'#eef0ff'},
    {icon:'🌟',name:'Mirada positiva',color:'#11a46f',soft:'#e9fbf4'},
    {icon:'🤝',name:'Confianza',color:'#8b55c7',soft:'#f5edff'},
    {icon:'⚖️',name:'Ganar–ganar',color:'#f39a24',soft:'#fff4e3'},
    {icon:'👂',name:'Empatía',color:'#0aa7c9',soft:'#e8faff'},
    {icon:'💬',name:'Asertividad',color:'#e34f65',soft:'#fff0f3'},
    {icon:'🧭',name:'Persona ≠ conducta',color:'#1c6fbb',soft:'#eaf4ff'}
  ];
  const lawsTabs = $('#lawsTabs'), lawDetail = $('#lawDetail');
  laws.forEach((l,i) => {
    const m=lawMeta[i];
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'law-tab' + (i===state.lastLaw ? ' active' : '');
    b.style.setProperty('--law-color',m.color); b.style.setProperty('--law-soft',m.soft);
    b.innerHTML = `<span class="law-tab-num">${String(i+1).padStart(2,'0')}</span><span class="law-tab-icon">${m.icon}</span><span class="law-tab-copy"><strong>${m.name}</strong><small>${l[0]}</small></span>`;
    b.addEventListener('click', () => renderLaw(i));
    lawsTabs.appendChild(b);
  });
  function renderLaw(i){
    state.lastLaw=i;
    $$('.law-tab').forEach((b,j) => b.classList.toggle('active', j===i));
    const l = laws[i], m=lawMeta[i];
    lawDetail.style.setProperty('--law-color',m.color); lawDetail.style.setProperty('--law-soft',m.soft);
    lawDetail.innerHTML = `<div class="law-detail-head"><div class="law-hero-icon">${m.icon}</div><div><span class="law-eyebrow">LEY ${String(i+1).padStart(2,'0')} · ${m.name.toUpperCase()}</span><h4>${l[0]}</h4></div></div><div class="law-body-grid"><div class="law-principle"><span>Idea central</span><p>${l[1]}</p></div><div class="law-tip"><span>Aplicación práctica</span><p>${l[2]}</p></div></div><div class="law-footer-note"><b>Para recordar:</b> una relación educativa se fortalece cuando el docente combina claridad, respeto, empatía y coherencia.</div>`;
    if(state.email) save();
  }
  renderLaw(state.lastLaw || 0);

  $$('.scenario-options button').forEach(b => b.addEventListener('click', () => {
    const fb = $('#scenarioFeedback');
    if(b.dataset.feedback === 'good'){
      fb.textContent = '✓ Respuesta recomendada: describe la conducta y la vincula con acuerdos, sin etiquetar a la persona.'; fb.style.color = '#087d4d';
    }else if(b.dataset.feedback === 'mid'){
      fb.textContent = '△ Es directa, pero no modela una comunicación asertiva ni invita a revisar el acuerdo.'; fb.style.color = '#9a6a00';
    }else{
      fb.textContent = '✕ Etiqueta a la persona y puede deteriorar el vínculo. Conviene describir la conducta observable.'; fb.style.color = '#b81923';
    }
  }));

  $$('.game-tab').forEach(b => b.addEventListener('click', () => {
    $$('.game-tab').forEach(x => x.classList.toggle('active', x === b));
    $$('.game-panel').forEach(p => p.classList.toggle('active-game', p.id === b.dataset.game));
  }));

  // MEMORY
  const pairs = [
    ['Empatía','Comprender la perspectiva del otro'], ['Asertividad','Expresar con respeto y claridad'],
    ['Confianza','Generar seguridad en el vínculo'], ['Ganar–ganar','Buscar acuerdos beneficiosos'],
    ['Escucha','Atender antes de responder'], ['Conducta','Describir el comportamiento, no etiquetar']
  ];
  let memoryFirst = null, memoryLock = false, matches = 0;
  function shuffled(arr){
    const copy = [...arr];
    for(let i=copy.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
    return copy;
  }
  function setupMemory(){
    matches=0; memoryFirst=null; memoryLock=false;
    const cards = shuffled(pairs.flatMap((p,i) => [{id:i,text:p[0]},{id:i,text:p[1]}]));
    const grid = $('#memoryGrid'); grid.innerHTML='';
    cards.forEach(c => {
      const btn=document.createElement('button'); btn.type='button'; btn.className='memory-card'; btn.dataset.id=c.id; btn.dataset.text=c.text; btn.textContent='?';
      btn.addEventListener('click',()=>flipMemory(btn)); grid.appendChild(btn);
    });
    $('#memoryStatus').textContent = state.completed.has('memory') ? 'Juego ya completado. Puedes volver a practicar.' : '';
  }
  function flipMemory(btn){
    if(memoryLock || btn.classList.contains('matched') || btn===memoryFirst) return;
    btn.classList.add('flipped'); btn.textContent=btn.dataset.text;
    if(!memoryFirst){ memoryFirst=btn; return; }
    if(memoryFirst.dataset.id===btn.dataset.id){
      memoryFirst.classList.add('matched'); btn.classList.add('matched'); memoryFirst=null; matches++;
      if(matches===pairs.length){ $('#memoryStatus').textContent='¡Excelente! Completaste el juego de memoria.'; complete('memory'); }
    }else{
      memoryLock=true;
      setTimeout(()=>{ memoryFirst.classList.remove('flipped'); btn.classList.remove('flipped'); memoryFirst.textContent='?'; btn.textContent='?'; memoryFirst=null; memoryLock=false; },650);
    }
  }
  $('#resetMemory').addEventListener('click',setupMemory); setupMemory();

  // WORD SEARCH - posiciones válidas y selección guiada
  const W=12, H=12;
  const words = ['EMPATIA','CONFIANZA','ASERTIVO','ESCUCHA','RESPETO','ACUERDOS'];
  const placements = [
    ['EMPATIA',0,0,0,1],        // horizontal
    ['CONFIANZA',2,1,0,1],     // horizontal
    ['ASERTIVO',4,10,1,0],     // vertical
    ['ESCUCHA',6,1,0,1],       // horizontal
    ['RESPETO',4,8,1,0],       // vertical
    ['ACUERDOS',10,2,0,1]      // horizontal
  ];
  let selected=[], found=new Set(), wordCells=[];
  function cellRC(index){ return {r:Math.floor(index/W), c:index%W}; }
  function directionValid(nextIndex){
    if(selected.length===0) return true;
    const a=cellRC(Number(selected[selected.length-1].dataset.index));
    const b=cellRC(nextIndex);
    const dr=b.r-a.r, dc=b.c-a.c;
    if(Math.abs(dr)>1 || Math.abs(dc)>1 || (dr===0&&dc===0)) return false;
    if(selected.length===1) return true;
    const p0=cellRC(Number(selected[0].dataset.index));
    const p1=cellRC(Number(selected[1].dataset.index));
    return dr===p1.r-p0.r && dc===p1.c-p0.c;
  }
  function setupWord(){
    found=new Set(); selected=[];
    const grid=Array.from({length:H},()=>Array(W).fill(''));
    placements.forEach(([w,r,c,dr,dc]) => [...w].forEach((ch,i) => { grid[r+dr*i][c+dc*i]=ch; }));
    const letters='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    for(let r=0;r<H;r++) for(let c=0;c<W;c++) if(!grid[r][c]) grid[r][c]=letters[Math.floor(Math.random()*letters.length)];
    const el=$('#wordGrid'); el.innerHTML=''; wordCells=[];
    grid.flat().forEach((ch,i) => {
      const b=document.createElement('button'); b.type='button'; b.className='word-cell'; b.textContent=ch; b.dataset.index=i;
      b.setAttribute('aria-label',`Fila ${Math.floor(i/W)+1}, columna ${i%W+1}, letra ${ch}`);
      b.addEventListener('click',()=>toggleWordCell(b)); el.appendChild(b); wordCells.push(b);
    });
    renderWordList(); $('#wordStatus').textContent='Haz clic en letras contiguas formando una línea recta.';
  }
  function toggleWordCell(b){
    if(b.classList.contains('found')) return;
    const pos=selected.indexOf(b);
    if(pos>=0){
      if(pos===selected.length-1){ selected.pop(); b.classList.remove('selected'); }
      else { $('#wordStatus').textContent='Para deshacer, retira primero la última letra seleccionada.'; }
      return;
    }
    if(!directionValid(Number(b.dataset.index))){ $('#wordStatus').textContent='Selecciona letras contiguas y mantén la misma dirección.'; return; }
    b.classList.add('selected'); selected.push(b);
    $('#wordStatus').textContent='Selección: '+selected.map(x=>x.textContent).join('');
  }
  function renderWordList(){
    const ul=$('#wordList'); ul.innerHTML='';
    words.forEach(w => { const li=document.createElement('li'); li.textContent=w; li.className=found.has(w)?'found':''; ul.appendChild(li); });
  }
  function clearWordSelection(){ selected.forEach(b=>b.classList.remove('selected')); selected=[]; }
  $('#validateWord').addEventListener('click',()=>{
    const seq=selected.map(b=>b.textContent).join('');
    const rev=[...seq].reverse().join('');
    const w=words.find(x=>!found.has(x)&&(x===seq||x===rev));
    if(w){
      found.add(w); selected.forEach(b=>{b.classList.remove('selected');b.classList.add('found')}); selected=[]; renderWordList();
      $('#wordStatus').textContent=`✓ Encontraste ${w}.`;
      if(found.size===words.length){ $('#wordStatus').textContent='¡Muy bien! Encontraste todas las palabras.'; complete('wordsearch'); }
    }else{
      $('#wordStatus').textContent = selected.length ? 'La selección no corresponde a una palabra pendiente. Prueba otra línea.' : 'Primero selecciona una palabra en la cuadrícula.';
      clearWordSelection();
    }
  });
  $('#clearWord').addEventListener('click',()=>{ clearWordSelection(); $('#wordStatus').textContent='Selección limpiada.'; });
  $('#resetWord').addEventListener('click',setupWord); setupWord();

  // CROSSWORD - navegación por palabra y comprobación completa
  const crossEntries = [
    {word:'EMPATIA', r:5,c:2,dr:0,dc:1,num:1, clue:'Capacidad para comprender el punto de vista de otra persona.'},
    {word:'CONFIANZA',r:0,c:5,dr:1,dc:0,num:2, clue:'Base relacional que genera seguridad.'},
    {word:'ASERTIVO',r:1,c:6,dr:1,dc:0,num:3, clue:'Modo de expresarse con claridad y respeto.'},
    {word:'REGLAS',r:1,c:8,dr:1,dc:0,num:4, clue:'Normas que orientan la convivencia.'},
    {word:'RESPETO',r:4,c:2,dr:1,dc:0,num:5, clue:'Valor que reconoce la dignidad de los demás.'}
  ];
  let crossCellMap=new Map(), activeEntry=0;
  function setupCross(){
    const rows=11, cols=10; crossCellMap=new Map(); activeEntry=0;
    crossEntries.forEach((e,entryIndex)=>[...e.word].forEach((ch,i)=>{
      const r=e.r+e.dr*i, c=e.c+e.dc*i, k=`${r}-${c}`;
      if(!crossCellMap.has(k)) crossCellMap.set(k,{letter:ch, nums:[], entries:[]});
      const data=crossCellMap.get(k); data.entries.push({entryIndex,pos:i}); if(i===0) data.nums.push(e.num);
    }));
    const grid=$('#crossGrid'); grid.innerHTML='';
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const k=`${r}-${c}`, data=crossCellMap.get(k); const d=document.createElement('div'); d.className='cross-cell'+(data?'':' block'); d.dataset.key=k;
      if(data){
        if(data.nums.length){ const n=document.createElement('span'); n.className='num'; n.textContent=data.nums.join('/'); d.appendChild(n); }
        const inp=document.createElement('input'); inp.maxLength=1; inp.autocomplete='off'; inp.inputMode='text'; inp.dataset.answer=data.letter; inp.dataset.key=k;
        inp.setAttribute('aria-label',`Casilla ${r+1}, ${c+1}`);
        inp.addEventListener('focus',()=>{
          const entry=data.entries.find(x=>x.entryIndex===activeEntry) || data.entries[0]; activeEntry=entry.entryIndex; highlightCrossEntry(activeEntry);
        });
        inp.addEventListener('input',()=>{
          inp.value=inp.value.toUpperCase().replace(/[^A-ZÑ]/g,'').slice(0,1); inp.classList.remove('wrong','right');
          if(inp.value) moveInEntry(activeEntry, k, 1);
        });
        inp.addEventListener('keydown',e=>{
          if(e.key==='Backspace' && !inp.value){ e.preventDefault(); moveInEntry(activeEntry,k,-1,true); }
          if(e.key==='ArrowRight'||e.key==='ArrowDown'){ e.preventDefault(); moveInEntry(activeEntry,k,1,true); }
          if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ e.preventDefault(); moveInEntry(activeEntry,k,-1,true); }
        });
        d.appendChild(inp);
      }
      grid.appendChild(d);
    }
    const clues=$('.clues ol'); clues.innerHTML='';
    crossEntries.forEach((e,i)=>{
      const li=document.createElement('li'); const btn=document.createElement('button'); btn.type='button'; btn.className='clue-btn'; btn.innerHTML=`<strong>${e.num}.</strong> ${e.clue}`; btn.addEventListener('click',()=>{activeEntry=i;highlightCrossEntry(i);focusEntry(i)}); li.appendChild(btn); clues.appendChild(li);
    });
    $('#crossStatus').textContent='Selecciona una pista o una casilla y escribe la respuesta.'; highlightCrossEntry(0);
  }
  function entryKeys(entryIndex){
    const e=crossEntries[entryIndex]; return [...e.word].map((_,i)=>`${e.r+e.dr*i}-${e.c+e.dc*i}`);
  }
  function highlightCrossEntry(entryIndex){
    const keys=new Set(entryKeys(entryIndex));
    $$('.cross-cell').forEach(c=>c.classList.toggle('active-word', keys.has(c.dataset.key)));
    $$('.clue-btn').forEach((b,i)=>b.classList.toggle('active',i===entryIndex));
  }
  function focusEntry(entryIndex){
    const key=entryKeys(entryIndex)[0]; const input=document.querySelector(`.cross-cell[data-key="${key}"] input`); if(input) input.focus();
  }
  function moveInEntry(entryIndex,currentKey,delta,force=false){
    const keys=entryKeys(entryIndex); const idx=keys.indexOf(currentKey); if(idx<0) return;
    let target=idx+delta;
    while(target>=0 && target<keys.length){
      const input=document.querySelector(`.cross-cell[data-key="${keys[target]}"] input`);
      if(input){ if(force || !input.value){ input.focus(); return; } }
      target+=delta;
    }
  }
  $('#validateCross').addEventListener('click',()=>{
    const ins=$$('#crossGrid input'); let good=true, empty=0;
    ins.forEach(i=>{
      const ok=i.value.toUpperCase()===i.dataset.answer; if(!i.value) empty++;
      i.classList.toggle('right',ok); i.classList.toggle('wrong',!ok && !!i.value); if(!ok) good=false;
    });
    if(good){ $('#crossStatus').textContent='¡Correcto! Crucigrama completado.'; complete('crossword'); }
    else if(empty){ $('#crossStatus').textContent=`Faltan ${empty} casillas por completar.`; }
    else { $('#crossStatus').textContent='Hay letras por corregir. Las casillas marcadas requieren revisión.'; }
  });
  $('#resetCross').addEventListener('click',setupCross); setupCross();

  // BARRA DERECHA DINÁMICA
  const tipItems = [
    'Antes de corregir una conducta, describe primero lo que observaste sin etiquetar al estudiante.',
    'Cuando un estudiante discrepe, pide que sustente su punto de vista antes de responder.',
    'Construye reglas de convivencia con participación del grupo para aumentar compromiso y claridad.',
    'Una pregunta empática puede abrir más información que una conclusión apresurada.',
    'Después de una situación difícil, revisa qué parte de tu comunicación puedes mejorar.'
  ];
  const phraseItems = [
    '“Escuchar con empatía amplía nuestra perspectiva antes de tomar decisiones.”',
    '“La mejor manera de cambiar una relación es comenzar por uno mismo.”',
    '“La confianza se construye con coherencia, respeto y escucha.”',
    '“Ganar–ganar significa buscar acuerdos donde ambas partes puedan avanzar.”',
    '“La conducta se corrige; la dignidad de la persona se respeta.”'
  ];
  const challengeItems = [
    'Reto: en tu próxima clase formula una retroalimentación usando: hecho observado + acuerdo esperado + próximo paso.',
    'Reto: identifica una fortaleza concreta en tres estudiantes y comunícala sin usar etiquetas generales.',
    'Reto: convierte una regla impuesta en un acuerdo de convivencia construido con tus estudiantes.',
    'Reto: ante una interrupción, pregunta primero qué ocurrió antes de emitir una conclusión.',
    'Reto: al finalizar la jornada, anota una interacción que podrías manejar de manera diferente mañana.'
  ];
  let currentToolType='tip';
  function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function showTool(type){
    currentToolType=type;
    const map={tip:{icon:'💡',title:'Tip docente',items:tipItems},phrase:{icon:'💬',title:'Frase del módulo',items:phraseItems},challenge:{icon:'🎯',title:'Reto práctico',items:challengeItems}};
    const item=map[type];
    $('#toolPopoverIcon').textContent=item.icon; $('#toolPopoverTitle').textContent=item.title; $('#toolPopoverText').textContent=randomFrom(item.items); $('#toolPopover').classList.remove('hidden');
  }
  $('#tipBtn').addEventListener('click',()=>showTool('tip'));
  $('#phraseBtn').addEventListener('click',()=>showTool('phrase'));
  $('#challengeBtn').addEventListener('click',()=>showTool('challenge'));
  $('#nextToolContent').addEventListener('click',()=>showTool(currentToolType));
  $('#closeToolPopover').addEventListener('click',()=>$('#toolPopover').classList.add('hidden'));
  $('#zoomInBtn').addEventListener('click',()=>{ state.textScale=Math.min(1.35, +(state.textScale+.08).toFixed(2)); applyTextScale(); save(); });
  $('#zoomOutBtn').addEventListener('click',()=>{ state.textScale=Math.max(.9, +(state.textScale-.08).toFixed(2)); applyTextScale(); save(); });
  $('#zoomResetBtn').addEventListener('click',()=>{ state.textScale=1; applyTextScale(); save(); });
  $('#focusBtn').addEventListener('click',()=>{
    document.body.classList.toggle('reading-mode');
    $('#focusBtn').classList.toggle('active',document.body.classList.contains('reading-mode'));
  });

  // ZOOM DE IMÁGENES AL CLIC
  const lightbox=$('#imageLightbox'), lbImg=$('#lightboxImage'); let imageScale=1;
  function applyImageScale(){ lbImg.style.transform=`scale(${imageScale})`; $('#lightboxScale').textContent=Math.round(imageScale*100)+'%'; }
  function openImage(img){
    lbImg.src=img.src; lbImg.alt=img.alt||'Imagen ampliada'; imageScale=1; applyImageScale(); lightbox.classList.remove('hidden'); document.body.classList.add('no-scroll');
  }
  function closeImage(){ lightbox.classList.add('hidden'); document.body.classList.remove('no-scroll'); lbImg.removeAttribute('src'); }
  $$('#appView img').forEach(img=>{
    if(img.closest('.app-footer') || img.closest('.side-brand') || img.closest('.diploma-top')) return;
    img.classList.add('zoomable-image'); img.tabIndex=0; img.setAttribute('role','button'); img.setAttribute('aria-label',(img.alt||'Imagen')+', abrir ampliada');
    img.addEventListener('click',()=>openImage(img));
    img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openImage(img)}});
  });
  $('#lightboxClose').addEventListener('click',closeImage);
  $('#lightboxPlus').addEventListener('click',()=>{imageScale=Math.min(3,+(imageScale+.25).toFixed(2));applyImageScale()});
  $('#lightboxMinus').addEventListener('click',()=>{imageScale=Math.max(.5,+(imageScale-.25).toFixed(2));applyImageScale()});
  $('#lightboxReset').addEventListener('click',()=>{imageScale=1;applyImageScale()});
  $('#lightboxStage').addEventListener('click',e=>{if(e.target===$('#lightboxStage'))closeImage()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!lightbox.classList.contains('hidden'))closeImage()});


  // PERSISTENCIA LOCAL: el avance se conserva al cerrar y volver a abrir el mismo navegador.
  const saveBtn = $('#saveStatusBtn');
  if(saveBtn) saveBtn.addEventListener('click',()=>{
    save();
    showToolMessage('💾','Progreso guardado','Tu nombre, correo, módulos completados, juegos superados y preferencias quedaron guardados temporalmente en esta PC.');
  });
  const resetBtn = $('#resetProgressBtn');
  if(resetBtn) resetBtn.addEventListener('click',()=>{
    if(!state.email) return;
    if(confirm('¿Deseas borrar únicamente tu avance guardado en esta PC? Esta acción no se puede deshacer.')){
      localStorage.removeItem(userStorageKey(state.email));
      state.completed=new Set(); state.lastSection='inicio'; state.lastLaw=0; state.textScale=1; state.savedAt=null;
      applyTextScale(); refreshProgress(); renderLaw(0); showSection('inicio',false); save();
      showToolMessage('↺','Progreso reiniciado','Se reinició el avance de este docente en esta PC.');
    }
  });
  function showToolMessage(icon,title,message){
    $('#toolPopoverIcon').textContent=icon; $('#toolPopoverTitle').textContent=title; $('#toolPopoverText').textContent=message; $('#toolPopover').classList.remove('hidden');
  }
  window.addEventListener('beforeunload',()=>{ if(state.email) save(); });

  // DIPLOMA
  $('#printDiploma').addEventListener('click',()=>window.print());
  $('#downloadDiploma').addEventListener('click',()=>{
    const c=document.createElement('canvas'); c.width=1600; c.height=1120; const ctx=c.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); ctx.strokeStyle='#0c2a63'; ctx.lineWidth=28; ctx.strokeRect(30,30,c.width-60,c.height-60);
    ctx.strokeStyle='#e2242c'; ctx.lineWidth=6; ctx.strokeRect(70,70,c.width-140,c.height-140); ctx.textAlign='center';
    ctx.fillStyle='#0c2a63'; ctx.font='700 40px Arial'; ctx.fillText('COLEGIO SAGRADO CORAZÓN DE LA MOLINA',800,150);
    ctx.fillStyle='#e2242c'; ctx.font='700 28px Arial'; ctx.fillText('ÁREA DE PSICOLOGÍA',800,205); ctx.fillText('DIPLOMA DE FINALIZACIÓN',800,320);
    ctx.fillStyle='#333'; ctx.font='28px Arial'; ctx.fillText('Se otorga el presente reconocimiento a',800,395);
    ctx.fillStyle='#0c2a63'; ctx.font='700 60px Arial'; ctx.fillText(state.teacher||'Docente',800,500);
    ctx.strokeStyle='#ccd5e2'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(350,530); ctx.lineTo(1250,530); ctx.stroke();
    ctx.fillStyle='#333'; ctx.font='27px Arial'; ctx.fillText('por haber completado satisfactoriamente el módulo',800,605);
    ctx.fillStyle='#0c2a63'; ctx.font='700 38px Arial'; ctx.fillText('Relaciones Interpersonales en la Práctica Docente',800,675);
    ctx.fillStyle='#59667b'; ctx.font='24px Arial'; ctx.fillText('Empatía · Escucha activa · Comunicación asertiva · Manejo de conflictos',800,750);
    ctx.fillStyle='#333'; ctx.font='24px Arial'; ctx.fillText('Fecha de conclusión',800,860);
    ctx.fillStyle='#0c2a63'; ctx.font='700 28px Arial'; ctx.fillText($('#diplomaDate').textContent,800,905);
    ctx.fillStyle='#0c2a63'; ctx.font='700 22px Arial'; ctx.fillText('Área de Psicología · Formación Docente SCM',800,1020);
    const a=document.createElement('a'); a.download=`Diploma_SCM_${(state.teacher||'Docente').replace(/\s+/g,'_')}.png`; a.href=c.toDataURL('image/png'); a.click();
  });

  const restored = loadLastUser();
  if(restored) enterApp();
  refreshProgress();
})();
