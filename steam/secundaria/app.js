
const $ = (s,ctx=document)=>ctx.querySelector(s);
const $$ = (s,ctx=document)=>[...ctx.querySelectorAll(s)];
const STORAGE_KEY='scm_bif_2026_state_v1';
const CONTENT_TRACK=['inicio','reto','equipo','ruta','stand','sustentacion','cronograma','evaluacion','reconocimientos','checklist','recursos'];
const GAME_KEYS=['sopa','memoria','crucigrama','cuestionario'];
const state={student:null,visited:new Set(),games:{sopa:false,memoria:false,crucigrama:false,cuestionario:false},checks:[],remember:true};
const phrases=[
 '“La evidencia convierte una buena idea en una oportunidad defendible.”',
 '“Innovar es observar mejor, probar antes y mejorar con intención.”',
 '“Una propuesta de valor clara explica para quién creas y por qué importa.”',
 '“Cada prueba con usuarios reduce supuestos y aumenta aprendizaje.”',
 '“Ideas que inspiran, soluciones que transforman.”'
];
const tips=[
 'Habla con usuarios antes de enamorarte de tu primera solución.',
 'Documenta cada cambio del MVP: qué probaste, qué aprendiste y qué mejoraste.',
 'El precio debe conversar con tus costos, el valor percibido y tu cliente objetivo.',
 'Ensaya el pitch con preguntas difíciles; no memorices sin comprender.',
 'En el stand muestra evidencia del proceso, no solo el producto final.',
 'Si una idea no funciona en una prueba, conviértelo en un aprendizaje visible.'
];
function saveState(){if(!state.remember)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify({student:state.student,visited:[...state.visited],games:state.games,checks:state.checks,remember:state.remember}));}catch(e){console.warn('No se pudo guardar el progreso localmente.',e);}}
function loadState(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!raw)return false;state.student=raw.student||null;state.visited=new Set(raw.visited||[]);state.games={...state.games,...(raw.games||{})};state.checks=raw.checks||[];state.remember=raw.remember!==false;return !!state.student}catch(e){return false}}
function initials(s){return ((s?.firstName?.[0]||'S')+(s?.lastName?.[0]||'C')).toUpperCase()}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2200)}
function setupStudentUI(){if(!state.student)return;const full=`${state.student.firstName} ${state.student.lastName}`;$('#studentSideName').textContent=full;$('#studentSideMeta').textContent=`${state.student.grade} · ${state.student.section}`;$('#studentInitials').textContent=initials(state.student);$('#certName').textContent=full;$('#certMeta').textContent=`${state.student.grade} · Sección ${state.student.section}`;$('#certDate').textContent='Finalizado el '+new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'long',year:'numeric'}).format(new Date());}
function enterApp(){
 const welcome=$('#welcomeScreen'),app=$('#app');
 setupStudentUI();
 if(welcome){welcome.hidden=true;welcome.setAttribute('aria-hidden','true');welcome.style.display='none';}
 if(app){app.hidden=false;app.removeAttribute('hidden');app.style.removeProperty('display');}
 restoreChecks();state.visited.add('inicio');saveState();updateProgress();navigate('inicio',false);
 requestAnimationFrame(()=>{window.scrollTo({top:0,behavior:'auto'});$('#mainArea')?.focus?.();});
}
$('#studentForm').addEventListener('submit',e=>{
 e.preventDefault();
 const firstName=$('#firstName').value.trim(),lastName=$('#lastName').value.trim(),grade=$('#grade').value,section=$('#section').value.trim();
 const error=$('#formError'),btn=$('#enterFairBtn');
 if(!firstName||!lastName||!grade||!section){error.classList.remove('success');error.textContent='Completa nombre, apellido, grado y sección para continuar.';return}
 error.textContent='';error.classList.remove('success');
 state.student={firstName,lastName,grade,section};state.remember=$('#rememberData').checked;
 if(!state.remember){try{localStorage.removeItem(STORAGE_KEY)}catch(e){}}
 saveState();
 if(btn){btn.disabled=true;btn.textContent='Ingresando…';}
 enterApp();
});
$('#resetSession').addEventListener('click',()=>{if(confirm('¿Deseas cerrar esta ruta y volver a la pantalla de acceso?')){try{localStorage.removeItem(STORAGE_KEY)}catch(e){}location.reload();}});
function navigate(id,track=true){$$('.content-section').forEach(s=>s.classList.toggle('active',s.id===id));$$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.section===id));const btn=$(`.nav-link[data-section="${id}"]`);$('#pageTitle').textContent=btn?btn.textContent.trim():'Ruta';if(track&&CONTENT_TRACK.includes(id)){state.visited.add(id);saveState();updateProgress()}window.scrollTo({top:0,behavior:'smooth'});$('#sidebar').classList.remove('open');$('#menuBtn')?.setAttribute('aria-expanded','false');}
$$('.nav-link').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.section)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('#menuBtn').addEventListener('click',()=>{const sb=$('#sidebar');sb.classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',sb.classList.contains('open'))});
function checklistComplete(){return state.checks.length===8}
function score(){const total=CONTENT_TRACK.length+GAME_KEYS.length+1;let done=CONTENT_TRACK.filter(x=>state.visited.has(x)).length+GAME_KEYS.filter(k=>state.games[k]).length+(checklistComplete()?1:0);return Math.round(done/total*100)}
function updateProgress(){const p=score();$('#progressText').textContent=p+'%';$('#mobileProgress').textContent=p+'%';$('#progressBar').style.width=p+'%';$('#diplomaProgressBar').style.width=p+'%';$('#diplomaProgressText').textContent=p+'%';const ready=p===100;$('#diplomaLocked').hidden=ready;$('#diplomaReady').hidden=!ready;if(ready)setupStudentUI();}
$$('#finalChecklist input').forEach(ch=>ch.addEventListener('change',()=>{state.checks=$$('#finalChecklist input:checked').map(x=>x.dataset.check);saveState();updateProgress();if(checklistComplete())toast('Checklist final completado ✓')}));
function restoreChecks(){$$('#finalChecklist input').forEach(ch=>ch.checked=state.checks.includes(ch.dataset.check))}
// Zoom panel
let zoom=1;function setZoom(v){zoom=Math.min(1.25,Math.max(.85,v));document.documentElement.style.setProperty('--scale',zoom);$('#zoomValue').textContent=Math.round(zoom*100)+'%'}
$('#zoomIn').onclick=()=>setZoom(zoom+.05);$('#zoomOut').onclick=()=>setZoom(zoom-.05);$('#zoomReset').onclick=()=>setZoom(1);
let pi=0,ti=0;$('#nextPhrase').onclick=()=>{$('#inspirePhrase').textContent=phrases[++pi%phrases.length]};$('#nextTip').onclick=()=>{$('#studentTip').textContent=tips[++ti%tips.length]};
// Welcome parallax
const hp=$('#heroParallax');if(hp){hp.addEventListener('pointermove',e=>{const r=hp.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;$('.hero-art',hp).style.transform=`rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-2px)`});hp.addEventListener('pointerleave',()=>$('.hero-art',hp).style.transform='')}
// Pitch timer
let timerLeft=120,timerId=null;function timerRender(){const m=String(Math.floor(timerLeft/60)).padStart(2,'0'),s=String(timerLeft%60).padStart(2,'0');$('#pitchTimer').textContent=`${m}:${s}`}
$('#timerStart').onclick=()=>{if(timerId){clearInterval(timerId);timerId=null;$('#timerStart').textContent='Continuar';return}$('#timerStart').textContent='Pausar';timerId=setInterval(()=>{timerLeft--;timerRender();if(timerLeft<=0){clearInterval(timerId);timerId=null;timerLeft=0;timerRender();$('#timerStart').textContent='Iniciar';toast('¡Tiempo! Tu pitch llegó a 2 minutos.')}},1000)};
$('#timerReset').onclick=()=>{clearInterval(timerId);timerId=null;timerLeft=120;timerRender();$('#timerStart').textContent='Iniciar'};
$('#calcPrice').onclick=()=>{const c=+$('#costUnit').value,m=+$('#marginPct').value;if(!(c>=0)||!(m>=0)){return $('#priceResult').textContent='Ingresa valores válidos.'}const p=c*(1+m/100);$('#priceResult').textContent=`Precio orientativo con ${m}% de margen: S/ ${p.toFixed(2)} por unidad.`};
$('#buildValue').onclick=()=>{const c=$('#valueClient').value.trim(),p=$('#valueProblem').value.trim(),d=$('#valueDiff').value.trim();$('#valueResult').textContent=(c&&p&&d)?`Para ${c}, nuestra propuesta resuelve ${p} y se diferencia porque ${d}.`:'Completa cliente, problema y diferenciador.'};
$$('.template-copy').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('Plantilla copiada ✓')}catch(e){toast('Selecciona y copia la plantilla manualmente.')}});
// Word search
const wsWords=['OPORTUNIDAD','VALIDACION','MVP','MARCA','VALOR','CLIENTE','INNOVACION','PITCH','PROTOTIPO','COSTOS'];
let wsGrid=[],wsPlaced=[],wsPick=[],wsFound=new Set();
function seeded(seed){let x=seed>>>0;return()=>((x=Math.imul(1664525,x)+1013904223>>>0)/4294967296)}
function buildWordSearch(){
 const N=14,letters='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ',dirs=[[1,0],[0,1],[1,1],[-1,1],[-1,0],[0,-1],[-1,-1],[1,-1]];
 let built=false,attemptSeed=0;
 while(!built && attemptSeed<50){
  attemptSeed++;
  const rnd=seeded(20261104+attemptSeed*97+Math.floor(Math.random()*1000));
  wsGrid=Array.from({length:N},()=>Array(N).fill(''));wsPlaced=[];
  let failed=false;
  for(const word of wsWords){
   let ok=false;
   for(let attempt=0;attempt<900 && !ok;attempt++){
    const [dx,dy]=dirs[Math.floor(rnd()*dirs.length)],x=Math.floor(rnd()*N),y=Math.floor(rnd()*N),xe=x+dx*(word.length-1),ye=y+dy*(word.length-1);
    if(xe<0||xe>=N||ye<0||ye>=N)continue;
    let can=true;
    for(let i=0;i<word.length;i++){
      const v=wsGrid[y+dy*i][x+dx*i];
      if(v && v!==word[i]){can=false;break}
    }
    if(!can)continue;
    const cells=[];
    for(let i=0;i<word.length;i++){
      wsGrid[y+dy*i][x+dx*i]=word[i];
      cells.push([x+dx*i,y+dy*i]);
    }
    wsPlaced.push({word,cells});
    ok=true;
   }
   if(!ok){failed=true;break}
  }
  if(failed)continue;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!wsGrid[y][x])wsGrid[y][x]=letters[Math.floor(rnd()*letters.length)];
  built=true;
 }
 if(!built){console.warn('No se pudo construir la sopa en el primer intento, reintentando...');return buildWordSearch();}
 renderWordSearch();
}
function renderWordSearch(){const g=$('#wordSearchGrid');g.innerHTML='';wsPick=[];wsFound=new Set();wsGrid.forEach((row,y)=>row.forEach((letter,x)=>{const c=document.createElement('button');c.type='button';c.className='word-cell';c.textContent=letter;c.dataset.x=x;c.dataset.y=y;c.addEventListener('click',()=>selectWordCell(c));g.appendChild(c)}));$('#wordList').innerHTML=wsWords.map(w=>`<span data-w="${w}">${w}</span>`).join('');$('#wordStatus').textContent='0 / '+wsWords.length+' encontradas'}
function clearWordSelection(){$$('.word-cell.selected').forEach(c=>c.classList.remove('selected'));wsPick=[]}
function lineCells(a,b){const dx=b.x-a.x,dy=b.y-a.y,sx=Math.sign(dx),sy=Math.sign(dy);if(!(dx===0||dy===0||Math.abs(dx)===Math.abs(dy)))return[];const len=Math.max(Math.abs(dx),Math.abs(dy))+1;return Array.from({length:len},(_,i)=>[a.x+sx*i,a.y+sy*i])}
function selectWordCell(el){
 const p={x:+el.dataset.x,y:+el.dataset.y};
 if(wsPick.length===0){clearWordSelection();wsPick=[p];el.classList.add('selected');return}
 const a=wsPick[0],cells=lineCells(a,p);clearWordSelection();
 if(!cells.length)return toast('Selecciona una línea recta.');
 const word=cells.map(([x,y])=>wsGrid[y][x]).join(''),rev=[...word].reverse().join('');
 const target=wsWords.find(w=>w===word||w===rev);
 if(!target)return toast('Esa combinación no corresponde a una palabra.');
 if(wsFound.has(target))return toast('Esa palabra ya fue encontrada.');
 wsFound.add(target);
 cells.forEach(([x,y])=>{const c=$(`.word-cell[data-x="${x}"][data-y="${y}"]`);c.classList.add('found')});
 const chip=$(`#wordList [data-w="${target}"]`); if(chip) chip.classList.add('done');
 const found=wsFound.size;$('#wordStatus').textContent=`${found} / ${wsWords.length} encontradas`;
 if(found===wsWords.length){state.games.sopa=true;saveState();updateProgress();toast('¡Sopa de letras completada! ✓')}
}
$('#resetWordSearch').onclick=()=>{state.games.sopa=false;saveState();updateProgress();buildWordSearch();};
// Memory game
const memPairs=[
 ['DETECTAR','Identificar una necesidad, problema u oportunidad relevante.'],['VALIDAR','Obtener evidencia y comprender al cliente objetivo.'],['IDEAR','Generar soluciones y seleccionar una propuesta viable.'],['MVP','Construir una versión funcional para probar la solución.'],['MEJORAR','Analizar retroalimentación y documentar cambios.'],['VALOR','Precisar para quién es, qué resuelve y por qué es diferente.'],['MARCA','Definir identidad, posicionamiento, comunicación y marketing.'],['NEGOCIO','Analizar costos, precio, canales, viabilidad y crecimiento.'],['SUSTENTAR','Presentar el proyecto y defenderlo con un pitch.']];
let memOpen=[],memLock=false,memMatched=0;function shuffle(a){return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1])}
function buildMemory(){memOpen=[];memLock=false;memMatched=0;const cards=[];memPairs.forEach((p,i)=>{cards.push({pair:i,text:p[0],type:'term'});cards.push({pair:i,text:p[1],type:'def'})});const g=$('#memoryGrid');g.innerHTML='';shuffle(cards).forEach((d,idx)=>{const c=document.createElement('button');c.type='button';c.className='memory-card';c.dataset.pair=d.pair;c.dataset.type=d.type;c.setAttribute('aria-label',d.type==='term'?'Tarjeta de etapa':'Tarjeta de descripción');const frontIcon=d.type==='term'?'💡':'🧩';c.innerHTML=`<span class="memory-card-inner"><span class="memory-face memory-front">${frontIcon}</span><span class="memory-face memory-back"><small>${d.type==='term'?'ETAPA':'PROPÓSITO'}</small><strong>${d.text}</strong></span></span>`;c.addEventListener('click',()=>flipMemory(c));g.appendChild(c)});$('#memoryStatus').textContent='0 / 9 parejas'}
function flipMemory(c){if(memLock||c.classList.contains('flipped')||c.classList.contains('matched'))return;c.classList.add('flipped');memOpen.push(c);if(memOpen.length===2){memLock=true;const[a,b]=memOpen;if(a===b){memOpen=[];memLock=false;return}if(a.dataset.pair===b.dataset.pair){setTimeout(()=>{a.classList.add('matched');b.classList.add('matched');memOpen=[];memLock=false;memMatched++;$('#memoryStatus').textContent=`${memMatched} / 9 parejas`;if(memMatched===9){state.games.memoria=true;saveState();updateProgress();toast('¡Memoria completada! ✓')}},380)}else{setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');memOpen=[];memLock=false},820)}}}
$('#resetMemory').onclick=()=>{state.games.memoria=false;saveState();updateProgress();buildMemory()};
// Crossword: 9 concepts connected on an 11x11 board.
const crossWords=[
 {n:1,word:'INNOVACION',r:4,c:0,dir:'H',clue:'Capacidad de generar una solución novedosa y diferenciada que responda al usuario.'},
 {n:2,word:'PROTOTIPO',r:2,c:3,dir:'V',clue:'Representación funcional que permite probar una solución antes de desarrollarla por completo.'},
 {n:3,word:'VALIDAR',r:3,c:5,dir:'V',clue:'Obtener evidencia para comprobar la necesidad, el cliente o la propuesta.'},
 {n:4,word:'CLIENTE',r:4,c:6,dir:'V',clue:'Persona o público objetivo para quien se diseña la solución.'},
 {n:5,word:'COSTOS',r:0,c:8,dir:'V',clue:'Elemento del modelo de negocio que debe conocerse para analizar la viabilidad.'},
 {n:6,word:'MARCA',r:0,c:5,dir:'H',clue:'Identidad que ayuda a posicionar y comunicar el emprendimiento.'},
 {n:7,word:'PITCH',r:3,c:6,dir:'H',clue:'Presentación breve para explicar y defender la propuesta.'},
 {n:8,word:'VALOR',r:4,c:4,dir:'V',clue:'Beneficio que la solución genera para el cliente objetivo.'},
 {n:9,word:'MVP',r:3,c:4,dir:'H',clue:'Versión mínima y funcional utilizada para aprender mediante pruebas con usuarios.'}
];
function buildCrossword(){
 const rows=11,cols=11,cells=new Map();
 crossWords.forEach(w=>{for(let i=0;i<w.word.length;i++){
   const r=w.r+(w.dir==='V'?i:0),c=w.c+(w.dir==='H'?i:0),key=`${r},${c}`,ch=w.word[i];
   if(cells.has(key) && cells.get(key).letter!==ch){console.warn('Crossword collision',key,w.word);}
   const prev=cells.get(key)||{}; cells.set(key,{letter:ch,num:i===0?w.n:(prev.num||null)});
 }});
 const g=$('#crossGrid');g.style.gridTemplateColumns=`repeat(${cols},1fr)`;g.style.gridTemplateRows=`repeat(${rows},1fr)`;g.innerHTML='';
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const d=cells.get(`${r},${c}`),el=document.createElement('div');el.className='cross-cell'+(d?'':' block');
   if(d){if(d.num){const n=document.createElement('span');n.className='cross-num';n.textContent=d.num;el.appendChild(n)}
     const inp=document.createElement('input');inp.maxLength=1;inp.dataset.answer=d.letter;inp.setAttribute('aria-label',`Fila ${r+1}, columna ${c+1}`);
     inp.addEventListener('input',()=>{inp.value=inp.value.toUpperCase().replace(/[^A-ZÑ]/g,'').slice(0,1);el.classList.remove('wrong','correct')});el.appendChild(inp)}
   g.appendChild(el)
 }
 $('#crossClues').innerHTML=crossWords.map(w=>`<li><b>${w.n}.</b> ${w.clue}</li>`).join('');$('#crossStatus').textContent='';
}
$('#checkCrossword').onclick=()=>{const cells=$$('.cross-cell:not(.block)'),all=cells.every(c=>{const i=$('input',c),ok=i.value.toUpperCase()===i.dataset.answer;c.classList.toggle('correct',ok);c.classList.toggle('wrong',!ok);return ok});if(all){state.games.crucigrama=true;saveState();updateProgress();$('#crossStatus').textContent='¡Crucigrama completado! ✓';toast('¡Crucigrama completado! ✓')}else $('#crossStatus').textContent='Revisa las casillas marcadas.'};
$('#resetCrossword').onclick=()=>{$$('#crossGrid input').forEach(i=>i.value='');$$('.cross-cell').forEach(c=>c.classList.remove('correct','wrong'));$('#crossStatus').textContent=''};

// Cuestionario final de 10 preguntas, basado en el documento oficial de la feria.
const quizQuestions=[
 {q:'¿Cuál describe mejor el reto principal de la Business & Innovation Fair en Secundaria?',options:['Diseñar únicamente una presentación visual llamativa.','Partir de una necesidad, problema u oportunidad, validarla, desarrollar una solución y sustentarla con evidencia.','Vender la mayor cantidad posible de productos durante la feria.','Construir un prototipo sin investigar al cliente objetivo.'],answer:1,why:'El reto exige identificar una oportunidad relevante, investigarla y validarla, diseñar una solución, desarrollar un MVP o prototipo, analizar su viabilidad y sustentarla con evidencia.'},
 {q:'¿Qué conjunto de acciones sí corresponde a la investigación y validación del cliente objetivo?',options:['Entrevistas, encuestas, observación, datos y/o pruebas.','Solo elegir un nombre y un logotipo.','Definir el precio sin conversar con usuarios.','Preparar únicamente el stand final.'],answer:0,why:'La guía menciona entrevistas, encuestas, observación, datos y/o pruebas como formas de investigar y validar la necesidad y al cliente objetivo.'},
 {q:'¿Cuál es el rol adecuado de la familia en el proyecto?',options:['Realizar la sustentación cuando el equipo tenga dificultades.','Tomar las decisiones finales del modelo de negocio.','Apoyar con logística, materiales, contactos o supervisión sin sustituir el trabajo intelectual y creativo del equipo.','Desarrollar el MVP completo para asegurar su calidad.'],answer:2,why:'La familia puede apoyar en organización, logística, materiales, contactos y supervisión, pero no debe sustituir el trabajo intelectual, creativo ni la sustentación del equipo.'},
 {q:'¿Qué corresponde a la etapa 4 de la ruta del emprendimiento?',options:['Construir marca y estrategia.','Desarrollar MVP / prototipo.','Modelar el negocio.','Lanzar y sustentar.'],answer:1,why:'La etapa 4 es “Desarrollar MVP / prototipo”: construir una versión funcional que permita probar la solución.'},
 {q:'En la etapa “Definir la propuesta de valor”, ¿qué debe precisarse?',options:['Solo el diseño del stand.','Para quién es la solución, qué resuelve y por qué es diferente.','Únicamente el costo unitario.','El orden de exposición del jurado.'],answer:1,why:'La propuesta de valor debe precisar para quién es, qué resuelve y por qué la solución es diferente.'},
 {q:'¿Cuál de los siguientes elementos forma parte de los requisitos del stand?',options:['Precio, estructura básica de costos y estrategia de comercialización.','Una decoración costosa como requisito obligatorio.','Un mínimo obligatorio de ventas durante la feria.','Una presentación de diez minutos.'],answer:0,why:'El stand debe incluir precio, estructura básica de costos y estrategia de comercialización, además de evidencia del proceso, marca, MVP y otros componentes.'},
 {q:'¿Cuánto debe durar aproximadamente la presentación breve o pitch?',options:['30 segundos.','1 minuto.','2 minutos.','10 minutos.'],answer:2,why:'El documento indica una presentación breve o pitch de aproximadamente 2 minutos.'},
 {q:'¿Cuál es el puntaje máximo de la rúbrica de evaluación de Secundaria?',options:['10 puntos.','16 puntos.','20 puntos.','25 puntos.'],answer:2,why:'La rúbrica de Secundaria establece un puntaje máximo de 20 puntos, distribuido en cinco criterios.'},
 {q:'¿Qué criterio evalúa cliente, costos, precio, estrategia comercial, canales y viabilidad?',options:['Innovación y propuesta de valor.','MVP / prototipo, validación y mejora.','Modelo de negocio y viabilidad.','Marca, pitch y sustentación.'],answer:2,why:'El criterio “Modelo de negocio y viabilidad” evalúa cliente, costos, precio, estrategia comercial, canales y viabilidad de la propuesta.'},
 {q:'¿Qué días se realiza la feria, presentación, demostración, comercialización y sustentación ante visitantes y jurado?',options:['12 y 13 de octubre.','30 y 31 de octubre.','2 y 3 de noviembre.','4 y 5 de noviembre.'],answer:3,why:'El cronograma de actividades señala que la feria se realiza el 4 y 5 de noviembre.'}
];
function renderQuiz(){
 const form=$('#contentQuiz');if(!form)return;
 form.innerHTML=quizQuestions.map((item,i)=>`<fieldset class="quiz-question" data-q="${i}"><legend><span>${String(i+1).padStart(2,'0')}</span>${item.q}</legend><div class="quiz-options">${item.options.map((op,j)=>`<label><input type="radio" name="quiz_${i}" value="${j}"><span class="quiz-option-letter">${String.fromCharCode(65+j)}</span><span>${op}</span></label>`).join('')}</div><p class="quiz-feedback" hidden></p></fieldset>`).join('');
}
function evaluateQuiz(){
 const form=$('#contentQuiz');if(!form)return;
 const unanswered=[];let correct=0;
 quizQuestions.forEach((item,i)=>{const field=$(`.quiz-question[data-q="${i}"]`,form),selected=$(`input[name="quiz_${i}"]:checked`,form);if(!selected){unanswered.push(i+1);field.classList.remove('answered','is-correct','is-wrong');return;}const value=Number(selected.value),ok=value===item.answer;if(ok)correct++;field.classList.add('answered');field.classList.toggle('is-correct',ok);field.classList.toggle('is-wrong',!ok);$$('label',field).forEach((label,j)=>{label.classList.toggle('correct-option',j===item.answer);label.classList.toggle('wrong-option',j===value&&!ok)});const fb=$('.quiz-feedback',field);fb.hidden=false;fb.innerHTML=`<b>${ok?'✓ Respuesta correcta':'✕ Revisa este punto'}</b> ${item.why}`;});
 if(unanswered.length){$('#quizResult').className='quiz-result quiz-warning';$('#quizResult').textContent=`Faltan ${unanswered.length} pregunta(s) por responder: ${unanswered.join(', ')}.`;return;}
 const passed=correct>=8;state.games.cuestionario=passed;saveState();updateProgress();const result=$('#quizResult');result.className='quiz-result '+(passed?'quiz-passed':'quiz-failed');result.innerHTML=passed?`<b>¡Excelente! ${correct}/10.</b> Has aprobado el cuestionario y esta actividad ya cuenta para tu progreso.`:`<b>Resultado: ${correct}/10.</b> Necesitas al menos 8/10. Revisa la retroalimentación y vuelve a intentarlo.`;if(passed)toast('¡Cuestionario aprobado! ✓');
}
function resetQuiz(){state.games.cuestionario=false;saveState();updateProgress();renderQuiz();const result=$('#quizResult');result.className='quiz-result';result.textContent='Responde las 10 preguntas y luego comprueba tu resultado.';window.scrollTo({top:0,behavior:'smooth'});}
$('#checkQuiz')?.addEventListener('click',evaluateQuiz);
$('#resetQuiz')?.addEventListener('click',resetQuiz);

// Diploma
async function getLogoData(){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);resolve(c.toDataURL('image/png'))};img.onerror=reject;img.src='assets/scm_logo.png'})}
$('#downloadDiploma').onclick=async()=>{if(score()<100)return toast('Completa el 100% para desbloquear el diploma.');const full=`${state.student.firstName} ${state.student.lastName}`;if(window.jspdf?.jsPDF){try{const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});doc.setFillColor(255,255,255);doc.rect(0,0,297,210,'F');doc.setDrawColor(7,29,73);doc.setLineWidth(3);doc.rect(8,8,281,194);doc.setDrawColor(217,25,32);doc.setLineWidth(1);doc.rect(12,12,273,186);const logo=await getLogoData();doc.addImage(logo,'PNG',132,18,33,33);doc.setTextColor(7,29,73);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('COLEGIO SAGRADO CORAZÓN DE LA MOLINA',148.5,60,{align:'center'});doc.setTextColor(217,25,32);doc.setFontSize(24);doc.text('DIPLOMA DE FINALIZACIÓN',148.5,77,{align:'center'});doc.setTextColor(80,94,113);doc.setFont('helvetica','normal');doc.setFontSize(12);doc.text('Se otorga a',148.5,91,{align:'center'});doc.setTextColor(7,29,73);doc.setFont('times','bold');doc.setFontSize(28);doc.text(full,148.5,108,{align:'center'});doc.setFont('helvetica','normal');doc.setTextColor(70,85,108);doc.setFontSize(11);doc.text(`${state.student.grade} · Sección ${state.student.section}`,148.5,119,{align:'center'});const body='por haber completado la Ruta de Aprendizaje de la Feria de Emprendimiento e Innovación, demostrando compromiso con la investigación, la validación, la creatividad y la sustentación basada en evidencia.';doc.text(doc.splitTextToSize(body,185),148.5,137,{align:'center'});doc.setFont('times','italic');doc.setTextColor(7,29,73);doc.setFontSize(15);doc.text('“Ideas que inspiran, soluciones que transforman”',148.5,169,{align:'center'});doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(100,112,128);doc.text(new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'long',year:'numeric'}).format(new Date()),148.5,186,{align:'center'});doc.save(`Diploma_SCM_${full.replace(/\s+/g,'_')}.pdf`);toast('Diploma descargado ✓');return}catch(e){console.error(e)}}window.print()};

// Ampliación de ilustraciones ultrarrealistas
const lightbox=$('#imageLightbox'),lightboxImg=$('#lightboxImage'),lightboxCaption=$('#lightboxCaption'),closeLightbox=$('#closeLightbox');
function openImageLightbox(img){if(!lightbox||!lightboxImg)return;lightboxImg.src=img.currentSrc||img.src;lightboxImg.alt=img.alt||'Ilustración ampliada';const cap=img.closest('figure')?.querySelector('figcaption');lightboxCaption.textContent=cap?cap.textContent.trim():(img.alt||'');lightbox.hidden=false;lightbox.setAttribute('aria-hidden','false');document.body.classList.add('lightbox-open');closeLightbox?.focus();}
function hideImageLightbox(){if(!lightbox)return;lightbox.hidden=true;lightbox.setAttribute('aria-hidden','true');document.body.classList.remove('lightbox-open');lightboxImg.removeAttribute('src');}
$$('img.zoomable').forEach(img=>{img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',(img.alt||'Ilustración')+'. Presiona para ampliar.');img.addEventListener('click',()=>openImageLightbox(img));img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openImageLightbox(img)}})});
closeLightbox?.addEventListener('click',hideImageLightbox);lightbox?.addEventListener('click',e=>{if(e.target===lightbox)hideImageLightbox()});


// Rotación de imágenes de bienvenida
const welcomeSlides=[
 {src:'assets/fair_hero_ultra.webp',alt:'Estudiantes SCM desarrollando proyectos de innovación, robótica y sostenibilidad'},
 {src:'assets/validation_research.webp',alt:'Estudiantes investigando y validando una oportunidad con evidencia'},
 {src:'assets/mvp_prototype.webp',alt:'Estudiantes construyendo y probando un MVP innovador'},
 {src:'assets/pitch_presentation.webp',alt:'Estudiantes presentando su pitch ante jurado y visitantes'},
 {src:'assets/awards_fair.webp',alt:'Estudiantes SCM recibiendo reconocimientos en la feria'},
 {src:'assets/business_model_branding.webp',alt:'Equipo SCM modelando negocio, marca y propuesta de valor'}
];
function initWelcomeRotator(){
 const img=$('#welcomeRotatingImage'),dotsWrap=$('#welcomeDots');
 if(!img||!dotsWrap)return;
 let current=0,intervalId=null;
 dotsWrap.innerHTML=welcomeSlides.map((_,i)=>`<button type="button" class="welcome-dot-btn${i===0?' active':''}" data-slide="${i}" aria-label="Ver imagen ${i+1}"></button>`).join('');
 const dots=$$('.welcome-dot-btn',dotsWrap);
 function setSlide(i){
  current=(i+welcomeSlides.length)%welcomeSlides.length;
  const slide=welcomeSlides[current];
  img.classList.add('is-fading');
  setTimeout(()=>{
   img.src=slide.src;
   img.alt=slide.alt;
   dots.forEach((d,idx)=>d.classList.toggle('active',idx===current));
  },180);
  setTimeout(()=>img.classList.remove('is-fading'),360);
 }
 function start(){clearInterval(intervalId);intervalId=setInterval(()=>setSlide(current+1),3000)}
 dots.forEach((dot,idx)=>dot.addEventListener('click',()=>{setSlide(idx);start();}));
 setSlide(0);start();
}

// Keyboard escape closes sidebar
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(lightbox&&!lightbox.hidden)hideImageLightbox();$('#sidebar').classList.remove('open')}});
// Init games and state
buildWordSearch();buildMemory();buildCrossword();renderQuiz();initWelcomeRotator();
if(loadState()) enterApp();
