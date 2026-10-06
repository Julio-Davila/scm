(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const THEORY_TASKS = ['reto','ruta','mvp','valor','stand','pitch','cronograma'];
  const TASK_LABELS = {reto:'El reto',ruta:'Ruta del emprendimiento',mvp:'MVP y validación',valor:'Valor y negocio',stand:'Stand y marca',pitch:'Pitch y sustentación',cronograma:'Cronograma y rúbrica',crossword:'Crucigrama',mental:'Ruta mental',wordsearch:'Sopa de letras',quiz:'Cuestionario'};
  const ALL_TASKS = [...THEORY_TASKS,'crossword','mental','wordsearch','quiz'];

  const state = {
    user:null,
    progress:Object.fromEntries(ALL_TASKS.map(k=>[k,false])),
    quizScore:0,
    foundWords:new Set(),
    crosswordWordDone:new Set(),
    mentalIndex:0,
    wordStart:null
  };

  let stopWelcomeCarousel = () => {};

  const routeSteps = [
    ['🔎','Detectar','Identificar una necesidad, problema u oportunidad relevante.'],
    ['🧭','Investigar y validar','Obtener evidencia y comprender al cliente objetivo.'],
    ['💡','Idear y diferenciar','Generar soluciones y seleccionar una propuesta innovadora y viable.'],
    ['🧪','Desarrollar MVP / prototipo','Construir una versión funcional que permita probar la solución.'],
    ['🔁','Probar y mejorar','Validar con usuarios, analizar retroalimentación y documentar mejoras.'],
    ['💎','Definir propuesta de valor','Precisar para quién es, qué resuelve y por qué es diferente.'],
    ['🎨','Construir marca y estrategia','Definir identidad, posicionamiento, comunicación y marketing.'],
    ['📈','Modelar el negocio','Analizar costos, precio, cliente, canales, comercialización, viabilidad y crecimiento.'],
    ['🎤','Lanzar y sustentar','Preparar el stand, presentar y defender la propuesta con un pitch.']
  ];

  const quiz = [
    {q:'¿Cuál es el punto de partida del proyecto?',o:['Diseñar el logo','Identificar una necesidad, problema u oportunidad relevante','Definir el precio final','Preparar el stand'],a:1,fb:'La ruta empieza detectando una necesidad, problema u oportunidad relevante.'},
    {q:'¿Qué evidencia sirve para validar la necesidad y al cliente objetivo?',o:['Solo opiniones del equipo','Entrevistas, encuestas, observación, datos o pruebas','El color del prototipo','La cantidad de seguidores'],a:1,fb:'La guía menciona entrevistas, encuestas, observación, datos y/o pruebas.'},
    {q:'¿Para qué sirve principalmente un MVP o prototipo funcional?',o:['Para decorar el stand','Para probar la solución con usuarios y aprender','Para reemplazar la investigación','Para evitar recibir feedback'],a:1,fb:'El MVP permite probar, recoger retroalimentación y documentar mejoras.'},
    {q:'Una propuesta de valor clara debe explicar…',o:['Solo el nombre de la marca','Para quién es, qué resuelve y por qué es diferente','Únicamente cuánto cuesta','Solo cómo se verá el stand'],a:1,fb:'La propuesta de valor conecta cliente, problema resuelto y diferenciación.'},
    {q:'¿Qué elementos forman parte del análisis del modelo de negocio según la guía?',o:['Cliente, costos, precio, canales, comercialización y viabilidad','Solo publicidad en redes','Solo el nombre del producto','Decoración y uniforme del equipo'],a:0,fb:'El modelo de negocio analiza cliente, costos, precio, canales, comercialización, viabilidad y crecimiento.'},
    {q:'¿Qué duración aproximada debe tener el pitch?',o:['30 segundos','1 hora','2 minutos','10 minutos'],a:2,fb:'La guía pide una presentación breve de aproximadamente 2 minutos.'},
    {q:'¿Qué debe mostrar el stand?',o:['Solo el producto terminado','Problema, solución, proceso, valor y elementos del negocio','Solo premios y reconocimientos','Únicamente el precio'],a:1,fb:'El stand debe comunicar el proceso completo y el valor, no solo el producto final.'},
    {q:'¿Cuál de estas acciones corresponde al apoyo familiar adecuado?',o:['Hacer la investigación por el estudiante','Sustentar ante el jurado en lugar del equipo','Escuchar ensayos del pitch y hacer preguntas desafiantes','Tomar todas las decisiones del proyecto'],a:2,fb:'La familia puede orientar, apoyar logística o escuchar ensayos, sin sustituir el trabajo del estudiante.'},
    {q:'¿Cuál es el puntaje máximo de la rúbrica de Secundaria?',o:['10 puntos','20 puntos','50 puntos','100 puntos'],a:1,fb:'La rúbrica establece un máximo de 20 puntos.'},
    {q:'¿Qué valora el criterio transversal?',o:['Solo el volumen de ventas','Solo la estética del stand','La coherencia entre oportunidad, usuario, solución, valor, mejora, comunicación y comercialización','Solo el uso de códigos QR'],a:2,fb:'La coherencia de todo el proyecto es un criterio transversal central.'}
  ];

  const cwPlacements = [
    {word:'OPORTUNIDAD',r:2,c:2,d:'H',clue:'Necesidad, problema o posibilidad relevante que puede dar origen al emprendimiento.'},
    {word:'VIABILIDAD',r:1,c:9,d:'V',clue:'Capacidad de la propuesta para funcionar y sostenerse.'},
    {word:'EVIDENCIA',r:10,c:6,d:'H',clue:'Información obtenida de entrevistas, encuestas, observación o pruebas que sustenta una decisión.'},
    {word:'PROTOTIPO',r:7,c:3,d:'H',clue:'Versión funcional construida para probar la solución.'},
    {word:'CLIENTE',r:5,c:7,d:'H',clue:'Persona o grupo objetivo para quien se crea valor.'},
    {word:'PRECIO',r:7,c:3,d:'V',clue:'Monto que se analiza junto con costos y estrategia comercial.'},
    {word:'VALOR',r:12,c:0,d:'H',clue:'Beneficio relevante que la solución genera para el cliente.'},
    {word:'MARCA',r:10,c:0,d:'H',clue:'Identidad y posicionamiento que comunican la propuesta.'},
    {word:'PITCH',r:0,c:6,d:'V',clue:'Presentación breve para explicar y defender la propuesta.'}
  ];
  const cwRows=13,cwCols=15;

  const wsRows = [
    'DPROTOTIPOMEEUF','ZVNTCMCMTOAVQIR','AVXDPVARYIRIYUK','DJNIFONAXXCDIQY','FQTDUJAUQTAEGEL',
    'YCFRYQLATKPNAPD','HLZJHBEHSCCCXRP','CYRYEESVPRFIIEQ','TNGSOLUCIONARCY','XWGWJMVULOQODIH',
    'HCKASRHSHACWUOB','HCBKCQHVALORIVP','MGREXSSETNEILCP','VHZPZNGDDVNLNNO','PXBVUUDBMXKZDHG'
  ];
  const wsWords = ['CLIENTE','EVIDENCIA','SOLUCION','MVP','PROTOTIPO','VALOR','MARCA','PRECIO','CANALES','PITCH'];

  const railContent = {
    inicio:['🌟 Tu primera tarea es comprender el problema antes de pensar en la solución.','Una buena idea gana fuerza cuando puede explicarse con evidencia.'],
    reto:['🔎 Valida con personas reales: entrevistas, encuestas, observación, datos o pruebas.','Orientar no es resolver: las decisiones finales deben pertenecer al equipo.'],
    ruta:['🧭 Cada etapa deja una evidencia o decisión que alimenta la siguiente.','No necesitas acertar a la primera; necesitas aprender y mejorar.'],
    mvp:['🧪 Un MVP no tiene que ser perfecto: debe permitir probar la idea con usuarios.','Documenta qué cambió, por qué cambió y qué aprendiste del usuario.'],
    valor:['💎 Resume tu valor en tres preguntas: ¿para quién?, ¿qué resuelve?, ¿por qué es diferente?','Conecta cliente, costos, precio, canales y viabilidad en una sola historia coherente.'],
    stand:['🎨 El stand debe explicar el proceso completo, no solo mostrar un producto atractivo.','Marca, precio, evidencia, MVP y propuesta de valor deben verse conectados.'],
    pitch:['🎤 Practica respuestas a preguntas difíciles, no solo el discurso memorizado.','En aproximadamente 2 minutos, explica el problema, la evidencia, la solución y por qué genera valor.'],
    cronograma:['📅 Divide el trabajo en investigación, mejora, preparación del stand y sustentación.','La rúbrica reconoce principalmente aprendizaje, creatividad, evolución y participación auténtica.'],
    juegos:['🎮 Usa los juegos como repaso: cada error te indica qué concepto revisar.','Completar los tres retos acerca tu progreso al diploma.'],
    quiz:['🧠 Lee el feedback de cada pregunta antes de reintentar.','Necesitas responder todas las preguntas y alcanzar al menos 8/10.'],
    diploma:['🏆 El diploma se desbloquea cuando teoría, juegos y cuestionario están completos.','Tu meta final es demostrar que puedes explicar y defender cómo tu propuesta genera valor.']
  };

  function storageKey(){
    if(!state.user) return null;
    const raw=[state.user.name,state.user.lastName,state.user.grade,state.user.section].join('|').toLowerCase();
    const slug=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    return `scm-bif:${slug}`;
  }
  function save(){ if(!state.user) return; localStorage.setItem(storageKey(), JSON.stringify({progress:state.progress,quizScore:state.quizScore})); }
  function load(){
    const raw = localStorage.getItem(storageKey()); if(!raw) return;
    try{const x=JSON.parse(raw); state.progress={...state.progress,...(x.progress||{})}; state.quizScore=x.quizScore||0;}catch{}
  }
  function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2600)}
  function celebrate(){
    const layer=$('#confettiLayer'); const colors=['#cf1626','#0a2a5e','#138a5b','#e69b19','#6b4ed9'];
    for(let i=0;i<80;i++){const p=document.createElement('i');p.className='confetti';p.style.left=`${Math.random()*100}%`;p.style.background=colors[i%colors.length];p.style.animationDelay=`${Math.random()*.45}s`;p.style.transform=`rotate(${Math.random()*180}deg)`;layer.appendChild(p);setTimeout(()=>p.remove(),2400)}
  }
  function setTask(task,value=true,quiet=false){
    if(!Object.hasOwn(state.progress,task)) return;
    const was=state.progress[task];state.progress[task]=value;save();renderProgress();renderDiplomaGate();syncTaskButtons();
    if(value && !was && !quiet){toast(`✓ ${TASK_LABELS[task]} completado`);}
    if(isEligible() && value && !was){celebrate();toast('🏆 ¡Diploma desbloqueado!');}
  }
  function isEligible(){return ALL_TASKS.every(k=>state.progress[k]) && state.quizScore>=8;}
  function renderProgress(){
    const done=ALL_TASKS.filter(k=>state.progress[k]).length;const pct=Math.round(done/ALL_TASKS.length*100);
    $('#progressPercent').textContent=`${pct}%`;$('#progressText').textContent=`${done} de ${ALL_TASKS.length}`;$('#progressRing').style.setProperty('--p',`${pct}%`);
    $('#taskChecklist').innerHTML=ALL_TASKS.map(k=>`<div class="task-row ${state.progress[k]?'done':''}"><span class="task-dot">${state.progress[k]?'✓':'•'}</span><span>${esc(TASK_LABELS[k])}</span></div>`).join('');
  }
  function syncTaskButtons(){
    $$('.complete-theory').forEach(b=>{const d=state.progress[b.dataset.task];b.classList.toggle('completed',d);b.textContent=d?'✓ Sección revisada':'✓ Marcar sección como revisada'});
  }
  function renderDiplomaGate(){
    const groups=[['Teoría',THEORY_TASKS.every(k=>state.progress[k])],['Juegos',['crossword','mental','wordsearch'].every(k=>state.progress[k])],['Cuestionario',state.progress.quiz && state.quizScore>=8]];
    $('#diplomaGate').innerHTML=`<div class="gate-grid">${groups.map(([l,d])=>`<div class="gate-item ${d?'done':''}"><span>${d?'✓':'○'}</span><strong>${l}</strong></div>`).join('')}</div>`;
    const ok=isEligible();$('#diplomaPreview').classList.toggle('locked',!ok);$('#downloadDiploma').disabled=!ok;$('#printDiploma').disabled=!ok;
    if(state.user){$('#diplomaName').textContent=`${state.user.name} ${state.user.lastName}`;$('#diplomaGrade').textContent=state.user.grade;$('#diplomaSection').textContent=`Sección: ${state.user.section}`;$('#diplomaDate').textContent=new Intl.DateTimeFormat('es-PE',{dateStyle:'long'}).format(new Date());$('#diplomaScore').textContent=`Cuestionario: ${state.quizScore}/10`; }
  }

  function initNavigation(){
    const go=id=>{const sec=$(`#${id}`);if(!sec)return;$$('.page-section').forEach(x=>x.classList.remove('active-section'));sec.classList.add('active-section');$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.target===id));$('#sectionTitle').textContent=sec.dataset.title||id;$('#sectionKicker').textContent=sec.dataset.kicker||'Plataforma educativa';updateContextRail(id);window.scrollTo({top:0,behavior:'smooth'});closeSidebar();closeTools();};
    $$('.nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.target)));$$('[data-jump]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.jump)));
    window.goSection=go;
    $('#openSidebar').addEventListener('click',()=>{$('#sidebar').classList.add('open');$('#sidebarBackdrop').classList.add('show')});
    $('#closeSidebar').addEventListener('click',closeSidebar);$('#sidebarBackdrop').addEventListener('click',closeSidebar);
    function closeSidebar(){$('#sidebar').classList.remove('open');$('#sidebarBackdrop').classList.remove('show')}
  }

  function updateContextRail(id){
    const content = railContent[id] || railContent.inicio;
    const msg = Array.isArray(content) ? (content[1] || content[0]) : content;
    const msgEl = $('#rightMessage');
    if(msgEl) msgEl.textContent = msg;
  }

  function closeTools(){
    const rail=$('#toolsRail'),back=$('#toolsBackdrop');
    rail?.classList.remove('open');back?.classList.remove('show');
  }

  function initTools(){
    const rail=$('#toolsRail'),back=$('#toolsBackdrop'),open=$('#openTools'),close=$('#closeTools');
    if(!rail)return;
    open?.addEventListener('click',()=>{rail.classList.add('open');back?.classList.add('show')});
    close?.addEventListener('click',closeTools);back?.addEventListener('click',closeTools);
    let z=1;const min=.85,max=1.2,step=.05;
    const apply=()=>{z=Math.min(max,Math.max(min,Math.round(z*100)/100));document.documentElement.style.setProperty('--content-zoom',String(z));const val=$('#zoomValue');if(val)val.textContent=`${Math.round(z*100)}%`;};
    $('#zoomOut')?.addEventListener('click',()=>{z-=step;apply()});
    $('#zoomIn')?.addEventListener('click',()=>{z+=step;apply()});
    $('#zoomReset')?.addEventListener('click',()=>{z=1;apply()});
    updateContextRail('inicio');apply();
  }

  function initRoute(){
    $('#routeTimeline').innerHTML=routeSteps.map((s,i)=>`<article class="route-card"><span class="num">${i+1}</span><span class="route-icon">${s[0]}</span><h3>${i+1} · ${s[1]}</h3><p>${s[2]}</p></article>`).join('');
  }


  function initGameTabs(){
    $$('.game-tab').forEach(b=>b.addEventListener('click',()=>{$$('.game-tab').forEach(x=>x.classList.toggle('active',x===b));$$('.game-panel').forEach(x=>x.classList.toggle('active-game',x.id===b.dataset.game))}));
  }

  function initCrossword(){
    const grid=$('#crosswordGrid'); const map=new Map(); const starts=new Map();
    cwPlacements.forEach((p,idx)=>{for(let i=0;i<p.word.length;i++){const r=p.r+(p.d==='V'?i:0),c=p.c+(p.d==='H'?i:0),k=`${r},${c}`;if(!map.has(k))map.set(k,{ch:p.word[i],words:[]});map.get(k).words.push(p.word);if(i===0)starts.set(k,(starts.get(k)||[]).concat(idx+1));}});
    for(let r=0;r<cwRows;r++)for(let c=0;c<cwCols;c++){const k=`${r},${c}`,cell=map.get(k);if(!cell){const d=document.createElement('div');d.className='cw-block';grid.appendChild(d);continue}const d=document.createElement('div');d.className='cw-cell';if(starts.has(k)){const n=document.createElement('span');n.className='cw-number';n.textContent=starts.get(k).join('/');d.appendChild(n)}const inp=document.createElement('input');inp.maxLength=1;inp.setAttribute('aria-label',`Fila ${r+1}, columna ${c+1}`);inp.dataset.r=r;inp.dataset.c=c;inp.dataset.answer=cell.ch;inp.addEventListener('input',e=>{const v=e.target.value.toUpperCase().replace(/[^A-ZÑ]/g,'');e.target.value=v;e.target.classList.toggle('correct',v===cell.ch);e.target.classList.toggle('wrong',!!v&&v!==cell.ch);checkCrossword();if(v){const inputs=$$('.cw-cell input',grid),idx=inputs.indexOf(e.target);inputs[idx+1]?.focus();}});d.appendChild(inp);grid.appendChild(d)}
    const across=cwPlacements.map((p,i)=>({...p,n:i+1})).filter(p=>p.d==='H'),down=cwPlacements.map((p,i)=>({...p,n:i+1})).filter(p=>p.d==='V');
    $('#crosswordClues').innerHTML=`<div class="clue-group"><h4>Horizontales</h4>${across.map(p=>`<div class="clue"><b>${p.n}.</b> ${p.clue}</div>`).join('')}</div><div class="clue-group"><h4>Verticales</h4>${down.map(p=>`<div class="clue"><b>${p.n}.</b> ${p.clue}</div>`).join('')}</div>`;
    function checkCrossword(){
      let done=0;cwPlacements.forEach(p=>{let ok=true;for(let i=0;i<p.word.length;i++){const r=p.r+(p.d==='V'?i:0),c=p.c+(p.d==='H'?i:0);const inp=$(`input[data-r="${r}"][data-c="${c}"]`,grid);if(!inp||inp.value.toUpperCase()!==p.word[i]){ok=false;break}}if(ok)done++});$('#crosswordStatus').textContent=`${done}/${cwPlacements.length} palabras`;if(done===cwPlacements.length)setTask('crossword');}
  }

  function shuffled(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){const j=(i*7+3)% (i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
  function initMental(){
    const options=routeSteps.map((s,i)=>({i,label:`${i+1}. ${s[1]}`}));
    const draw=()=>{$('#mentalOptions').innerHTML=shuffled(options).map(x=>`<button class="mental-option ${x.i<state.mentalIndex?'used':''}" data-i="${x.i}">${x.label}</button>`).join('');$('#mentalSelected').innerHTML=options.slice(0,state.mentalIndex).map(x=>`<span>✓ ${x.label}</span>`).join('');$('#mentalStatus').textContent=state.mentalIndex>=9?'¡Ruta completa!':`Paso ${state.mentalIndex+1} de 9`;$$('.mental-option').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.i;if(i===state.mentalIndex){state.mentalIndex++;draw();if(state.mentalIndex===9)setTask('mental')}else{b.classList.add('wrong');toast(`Ese paso no va todavía. Busca el paso ${state.mentalIndex+1}.`);setTimeout(()=>b.classList.remove('wrong'),350)}}));};
    $('#resetMental').addEventListener('click',()=>{state.mentalIndex=0;setTask('mental',false,true);draw()});draw();
  }

  function initWordSearch(){
    const grid=$('#wordGrid');
    wsRows.forEach((row,r)=>[...row].forEach((ch,c)=>{const b=document.createElement('button');b.className='word-cell';b.textContent=ch;b.dataset.r=r;b.dataset.c=c;b.addEventListener('click',()=>selectWordCell(b));grid.appendChild(b)}));
    renderWordList();$('#clearWordSelection').addEventListener('click',clearWordStart);
    function clearWordStart(){state.wordStart=null;$$('.word-cell').forEach(x=>x.classList.remove('start'))}
    function lineCells(a,b){const dr=b.r-a.r,dc=b.c-a.c;const sr=Math.sign(dr),sc=Math.sign(dc);if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)))return null;const len=Math.max(Math.abs(dr),Math.abs(dc))+1;const out=[];for(let i=0;i<len;i++){const r=a.r+sr*i,c=a.c+sc*i;if(r<0||r>=15||c<0||c>=15)return null;out.push({r,c,ch:wsRows[r][c]})}return out}
    function selectWordCell(b){const pt={r:+b.dataset.r,c:+b.dataset.c};if(!state.wordStart){state.wordStart=pt;b.classList.add('start');return}const cells=lineCells(state.wordStart,pt);if(!cells){toast('Selecciona una línea horizontal, vertical o diagonal.');clearWordStart();return}const str=cells.map(x=>x.ch).join(''),rev=[...str].reverse().join('');const found=wsWords.find(w=>!state.foundWords.has(w)&&(str===w||rev===w));if(found){state.foundWords.add(found);cells.forEach(x=>$(`.word-cell[data-r="${x.r}"][data-c="${x.c}"]`).classList.add('found'));toast(`✓ Encontraste ${found}`);renderWordList();if(state.foundWords.size===wsWords.length)setTask('wordsearch')}else toast('Esa selección no corresponde a una palabra pendiente.');clearWordStart();}
    function renderWordList(){$('#wordList').innerHTML=wsWords.map(w=>`<span class="${state.foundWords.has(w)?'found':''}">${w}</span>`).join('');$('#wordStatus').textContent=`${state.foundWords.size}/10 encontradas`}
  }

  function initQuiz(){
    const box=$('#quizContainer');box.innerHTML=quiz.map((q,i)=>`<article class="quiz-q" data-q="${i}"><h3>${i+1}. ${q.q}</h3><div class="quiz-options">${q.o.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"><span>${o}</span></label>`).join('')}</div><div class="quiz-feedback"></div></article>`).join('');
    $('#gradeQuiz').addEventListener('click',()=>{
      let unanswered=0,score=0;quiz.forEach((q,i)=>{const art=$(`.quiz-q[data-q="${i}"]`);const chosen=$(`input[name="q${i}"]:checked`);$$('label',art).forEach(l=>l.classList.remove('correct-answer','wrong-answer'));if(!chosen){unanswered++;$('.quiz-feedback',art).textContent='Selecciona una respuesta.';return}const v=+chosen.value;if(v===q.a)score++;const labels=$$('label',art);labels[q.a].classList.add('correct-answer');if(v!==q.a)labels[v].classList.add('wrong-answer');$('.quiz-feedback',art).textContent=(v===q.a?'✓ Correcto. ':'✗ Revisa. ')+q.fb;});
      if(unanswered){toast(`Faltan ${unanswered} pregunta(s) por responder.`);return}state.quizScore=score;if(score>=8){setTask('quiz',true,true);$('#quizResult').textContent=`🎉 ${score}/10 · ¡Aprobado!`;celebrate();toast('Cuestionario aprobado. ¡Excelente trabajo!')}else{setTask('quiz',false,true);$('#quizResult').textContent=`${score}/10 · Necesitas 8/10. Revisa el feedback y reintenta.`;toast('Puedes reintentar después de revisar las respuestas.')}save();renderDiplomaGate();$('#retryQuiz').hidden=false;
    });
    $('#retryQuiz').addEventListener('click',()=>{$$('input[type=radio]',box).forEach(x=>x.checked=false);$$('.quiz-feedback',box).forEach(x=>x.textContent='');$$('.quiz-options label',box).forEach(x=>x.classList.remove('correct-answer','wrong-answer'));$('#quizResult').textContent='';window.scrollTo({top:0,behavior:'smooth'})});
  }

  function initDiploma(){
    $('#downloadDiploma').addEventListener('click',downloadDiploma);$('#printDiploma').addEventListener('click',()=>window.print());
    async function downloadDiploma(){
      if(!isEligible())return toast('Completa todas las actividades para desbloquear el diploma.');
      const jspdf=window.jspdf;if(!jspdf?.jsPDF){toast('No se pudo cargar el generador PDF. Usa “Imprimir / Guardar como PDF”.');return}
      const {jsPDF}=jspdf;const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});const W=297,H=210;
      doc.setFillColor(255,255,255);doc.rect(0,0,W,H,'F');doc.setDrawColor(10,42,94);doc.setLineWidth(2.2);doc.rect(8,8,W-16,H-16);doc.setDrawColor(207,22,38);doc.setLineWidth(.8);doc.rect(12,12,W-24,H-24);
      try{const img=$('.diploma-border img');doc.addImage(img,'PNG',W/2-15,17,30,30);}catch{}
      doc.setTextColor(10,42,94);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('COLEGIO SAGRADO CORAZÓN DE LA MOLINA',W/2,54,{align:'center'});
      doc.setTextColor(207,22,38);doc.setFont('times','bold');doc.setFontSize(25);doc.text('DIPLOMA DE FINALIZACIÓN',W/2,70,{align:'center'});
      doc.setTextColor(80,96,118);doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text('Se otorga a',W/2,84,{align:'center'});
      doc.setTextColor(10,42,94);doc.setFont('times','bold');doc.setFontSize(27);doc.text(`${state.user.name} ${state.user.lastName}`,W/2,102,{align:'center',maxWidth:230});
      doc.setDrawColor(210,180,140);doc.line(55,108,W-55,108);doc.setTextColor(80,96,118);doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text('por completar satisfactoriamente la experiencia educativa',W/2,120,{align:'center'});
      doc.setTextColor(207,22,38);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('SCM BUSINESS & INNOVATION FAIR · SECUNDARIA',W/2,134,{align:'center'});
      doc.setTextColor(80,96,118);doc.setFontSize(9);doc.setFont('helvetica','normal');const date=new Intl.DateTimeFormat('es-PE',{dateStyle:'long'}).format(new Date());doc.text(`${state.user.grade} · Sección ${state.user.section}`,W/2,149,{align:'center'});doc.text(`Fecha de finalización: ${date}   |   Cuestionario: ${state.quizScore}/10`,W/2,158,{align:'center'});
      doc.setDrawColor(135,152,173);doc.line(64,177,128,177);doc.line(169,177,233,177);doc.setTextColor(10,42,94);doc.setFont('helvetica','bold');doc.text('SCM',96,184,{align:'center'});doc.text('Finalización verificada',201,184,{align:'center'});
      const safe=`${state.user.name}_${state.user.lastName}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_');doc.save(`Diploma_SCM_${safe}.pdf`);toast('Diploma generado en PDF.');
    }
  }


  function initWelcomeCarousel(){
    const root=$('#welcomeCarousel');
    if(!root)return;
    const slides=$$('.welcome-slide',root);
    const dots=$$('[data-slide-to]',root);
    const prev=$('#welcomePrev'),next=$('#welcomeNext'),bar=$('#welcomeCarouselProgress');
    if(slides.length<2)return;
    let index=0,timer=null;
    const restartBar=()=>{
      if(!bar)return;
      bar.classList.remove('is-running');
      void bar.offsetWidth;
      bar.classList.add('is-running');
    };
    const show=(nextIndex,restart=true)=>{
      index=(nextIndex+slides.length)%slides.length;
      slides.forEach((s,i)=>s.classList.toggle('is-active',i===index));
      dots.forEach((d,i)=>d.classList.toggle('is-active',i===index));
      if(restart)restartBar();
    };
    const schedule=()=>{
      clearInterval(timer);
      timer=setInterval(()=>show(index+1),5000);
      restartBar();
    };
    prev?.addEventListener('click',()=>{show(index-1);schedule();});
    next?.addEventListener('click',()=>{show(index+1);schedule();});
    dots.forEach(d=>d.addEventListener('click',()=>{show(Number(d.dataset.slideTo)||0);schedule();}));
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){clearInterval(timer);bar?.classList.remove('is-running');}
      else if($('#welcomeModal')?.classList.contains('is-open'))schedule();
    });
    stopWelcomeCarousel=()=>{clearInterval(timer);bar?.classList.remove('is-running');};
    show(0,false);schedule();
  }

  function initReset(){
    $('#resetProgress').addEventListener('click',()=>{if(!confirm('¿Deseas reiniciar todo tu avance en esta plataforma?'))return;ALL_TASKS.forEach(k=>state.progress[k]=false);state.quizScore=0;state.foundWords.clear();state.mentalIndex=0;localStorage.removeItem(storageKey());location.reload()});
  }

  function startApp(){
    stopWelcomeCarousel();
    $('#welcomeModal').classList.remove('is-open');$('#appShell').setAttribute('aria-hidden','false');
    $('#studentDisplay').textContent=`${state.user.name} ${state.user.lastName}`;$('#studentMetaDisplay').textContent=`${state.user.grade} · Sección ${state.user.section}`;$('#studentInitials').textContent=[state.user.name,state.user.lastName].map(x=>x.trim()[0]||'').join('').toUpperCase();
    load();renderProgress();renderDiplomaGate();syncTaskButtons();
  }

  function initAuth(){
    $('#studentForm').addEventListener('submit',e=>{
      e.preventDefault();
      const name=$('#studentName').value.trim();
      const lastName=$('#studentLastName').value.trim();
      const grade=$('#studentGrade').value;
      const section=$('#studentSection').value.trim();
      const err=$('#studentFormError');
      err.textContent='';
      if(name.length<2)return err.textContent='Ingresa tus nombres.';
      if(lastName.length<2)return err.textContent='Ingresa tus apellidos.';
      if(!grade)return err.textContent='Selecciona tu año o grado.';
      if(section.length<1)return err.textContent='Ingresa tu sección.';
      state.user={name,lastName,grade,section};
      startApp();
    });
  }

  function init(){
    initNavigation();initTools();initRoute();initGameTabs();initCrossword();initMental();initWordSearch();initQuiz();initDiploma();initReset();initWelcomeCarousel();initAuth();
    $$('.complete-theory').forEach(b=>b.addEventListener('click',()=>setTask(b.dataset.task)));
    renderProgress();renderDiplomaGate();
  }
  document.addEventListener('DOMContentLoaded',init);
})();
