(() => {
  'use strict';

  const ACCESS_HASH = 'bc4095bf7299b32fe975a4848c92806999dae8baf20c1facb730bdc2f2deec10'; // SHA-256 de SCM2026
  const STORAGE_KEY = 'scm_si_anidada_2026';
  const MILESTONES = ['theory', 'multimedia', 'crossword', 'mental', 'wordsearch', 'quiz'];
  const LABELS = {
    theory: 'Teoría', multimedia: 'Multimedia', crossword: 'Crucigrama', mental: 'Reto mental', wordsearch: 'Sopa de letras', quiz: 'Cuestionario'
  };

  let state = {
    student: null,
    completed: {},
    stars: 0,
    quizBest: 0
  };

  let toastTimer;
  let wordSearchState = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') state = { ...state, ...saved, completed: saved.completed || {} };
    } catch (_) {}
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showToast(message, type = 'success') {
    const toast = $('#toast');
    toast.textContent = message;
    toast.className = `toast show${type === 'error' ? ' error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.className = 'toast', 2800);
  }

  function sha256Fallback(ascii) {
    // Implementación SHA-256 sin dependencias para abrir la app incluso desde file://.
    const rightRotate = (value, amount) => (value >>> amount) | (value << (32 - amount));
    const maxWord = Math.pow(2, 32);
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    const hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1/3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (let i = 0; i < ascii.length; i++) {
      const j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (let j = 0; j < words.length;) {
      const w = words.slice(j, j += 16);
      const oldHash = hash.slice(0);
      let a = hash[0], e = hash[4];
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const A = a, E = e;
        const temp1 = hash[7]
          + (rightRotate(E, 6) ^ rightRotate(E, 11) ^ rightRotate(E, 25))
          + ((E & hash[5]) ^ ((~E) & hash[6]))
          + k[i]
          + (w[i] = i < 16 ? w[i] : (
              w[i - 16]
              + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
              + w[i - 7]
              + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
            ) | 0);
        const temp2 = (rightRotate(A, 2) ^ rightRotate(A, 13) ^ rightRotate(A, 22))
          + ((A & hash[1]) ^ (A & hash[2]) ^ (hash[1] & hash[2]));
        hash[7] = hash[6]; hash[6] = hash[5]; hash[5] = hash[4];
        hash[4] = (hash[3] + temp1) | 0;
        hash[3] = hash[2]; hash[2] = hash[1]; hash[1] = hash[0];
        hash[0] = (temp1 + temp2) | 0;
        a = hash[0]; e = hash[4];
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) {
      for (let j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  async function sha256(text) {
    if (window.crypto?.subtle) {
      const data = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return sha256Fallback(text);
  }

  function sanitizeName(value) {
    return value.trim().replace(/\s+/g, ' ').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, '');
  }

  function setStudentUI() {
    if (!state.student) return;
    const full = `${state.student.firstName} ${state.student.lastName}`.trim();
    $('#userNameTop').textContent = full;
    $('#userSectionTop').textContent = state.student.section;
    $('#userInitials').textContent = `${state.student.firstName[0] || ''}${state.student.lastName[0] || ''}`.toUpperCase();
  }

  function completeMilestone(key, stars = 1) {
    if (!state.completed[key]) {
      state.completed[key] = true;
      state.stars = Math.max(0, (state.stars || 0) + stars);
      saveState();
      updateProgressUI();
      showToast(`¡Reto completado! +${stars} ⭐`);
    }
  }

  function progressPercent() {
    const done = MILESTONES.filter(k => state.completed[k]).length;
    return Math.round((done / MILESTONES.length) * 100);
  }

  function updateProgressUI() {
    const pct = progressPercent();
    $('#progressPercent').textContent = `${pct}%`;
    $('#progressLarge').textContent = `${pct}%`;
    $('#progressPillBar').style.width = `${pct}%`;
    $('#progressLargeBar').style.width = `${pct}%`;
    $('#diplomaProgressBar').style.width = `${pct}%`;
    $('#diplomaProgressText').textContent = `${pct}% completado`;
    $('#totalStars').textContent = state.stars || 0;

    const grid = $('#milestoneGrid');
    grid.innerHTML = MILESTONES.map(k => `<div class="milestone ${state.completed[k] ? 'done' : ''}">${state.completed[k] ? '✓' : '○'} ${LABELS[k]}</div>`).join('');

    $$('[data-complete]').forEach(btn => {
      const key = btn.dataset.complete;
      if (state.completed[key]) {
        btn.classList.add('done');
        btn.textContent = '✓ Revisado';
      }
    });

    $$('[data-status]').forEach(el => {
      const key = el.dataset.status;
      if (state.completed[key]) {
        el.textContent = '✓ Completado';
        el.classList.add('done');
      }
    });

    const unlocked = pct === 100;
    const lockChip = $('#diplomaLockChip');
    const gen = $('#generateDiploma');
    lockChip.textContent = unlocked ? '🏆 Diploma desbloqueado' : '🔒 Aún bloqueado';
    lockChip.classList.toggle('unlocked', unlocked);
    $('#diplomaTitle').textContent = unlocked ? '¡Meta alcanzada!' : 'Te falta un poco para llegar a la meta';
    $('#diplomaMessage').textContent = unlocked
      ? 'Ya puedes generar tu diploma personalizado de logro.'
      : 'Completa teoría, multimedia y los cuatro juegos para habilitar tu diploma.';
    gen.disabled = !unlocked;
  }

  function showApp() {
    $('#welcomeScreen').classList.add('is-hidden');
    $('#app').classList.remove('is-hidden');
    setStudentUI();
    updateProgressUI();
  }

  function showPage(id) {
    $$('.page-section').forEach(s => s.classList.toggle('active-section', s.id === id));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.target === id));
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openSidebar() {
    $('#sidebar').classList.add('open');
    $('#sidebarBackdrop').classList.add('show');
  }
  function closeSidebar() {
    $('#sidebar').classList.remove('open');
    $('#sidebarBackdrop').classList.remove('show');
  }

  // LOGIN
  $('#togglePassword').addEventListener('click', () => {
    const input = $('#accessKey');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = sanitizeName($('#firstName').value);
    const lastName = sanitizeName($('#lastName').value);
    const sectionEl = $('input[name="section"]:checked');
    const accessKey = $('#accessKey').value;
    const error = $('#loginError');
    error.textContent = '';

    if (!firstName || !lastName || !sectionEl) {
      error.textContent = 'Completa nombre, apellido y sección.';
      return;
    }
    const hash = await sha256(accessKey);
    if (hash !== ACCESS_HASH) {
      error.textContent = 'Clave incorrecta. Verifica el código de acceso.';
      $('#accessKey').select();
      return;
    }

    const previousStudent = state.student;
    state.student = { firstName, lastName, section: sectionEl.value };
    if (previousStudent && `${previousStudent.firstName}|${previousStudent.lastName}|${previousStudent.section}` !== `${firstName}|${lastName}|${sectionEl.value}`) {
      state.completed = {};
      state.stars = 0;
      state.quizBest = 0;
    }
    saveState();
    showApp();
    showToast(`¡Bienvenido(a), ${firstName}!`);
  });

  // NAVIGATION
  $$('.nav-item').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.target)));
  $$('[data-go]').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.go)));
  $('#openSidebar').addEventListener('click', openSidebar);
  $('#closeSidebar').addEventListener('click', closeSidebar);
  $('#sidebarBackdrop').addEventListener('click', closeSidebar);

  $$('[data-complete]').forEach(btn => btn.addEventListener('click', () => {
    completeMilestone(btn.dataset.complete, 1);
  }));

  $('#resetProgress').addEventListener('click', () => {
    if (!confirm('¿Deseas reiniciar todos tus avances y estrellas?')) return;
    state.completed = {};
    state.stars = 0;
    state.quizBest = 0;
    saveState();
    updateProgressUI();
    buildCrossword();
    buildMentalGame();
    buildWordSearch();
    buildQuiz();
    $('#diplomaCanvas').style.display = 'none';
    $('#diplomaPlaceholder').style.display = 'grid';
    $('#downloadDiploma').disabled = true;
    showToast('Progreso reiniciado. ¡Puedes volver a intentarlo!');
  });

  // QUICK CHOICE
  $$('[data-quick-answer]').forEach(btn => btn.addEventListener('click', () => {
    const good = btn.dataset.quickAnswer === 'correct';
    const feedback = $('#quickChoiceFeedback');
    feedback.className = `inline-feedback ${good ? 'success' : 'error'}`;
    feedback.textContent = good ? '¡Correcto! Se evalúa primero la condición más exigente.' : 'Casi. Si evalúas ≥ 11 primero, una nota 18 se quedaría allí. Empieza por ≥ 18.';
  }));

  // LAB
  $('#evaluateGrade').addEventListener('click', () => {
    const n = Number($('#gradeInput').value);
    const out = $('#gradeResult');
    if (!Number.isFinite(n) || n < 0 || n > 20) {
      out.className = 'lab-result low';
      out.textContent = 'Ingresa una nota válida entre 0 y 20.';
      return;
    }
    let category, cls;
    if (n >= 18) { category = 'AD · Logro destacado'; cls = 'good'; }
    else if (n >= 14) { category = 'A · Logro esperado'; cls = 'good'; }
    else if (n >= 11) { category = 'B · En proceso'; cls = 'mid'; }
    else { category = 'C · Requiere refuerzo'; cls = 'low'; }
    out.className = `lab-result ${cls}`;
    out.textContent = `Con una nota de ${n}, la fórmula devuelve: ${category}.`;
  });

  // GAME TABS
  $$('.game-tab').forEach(btn => btn.addEventListener('click', () => {
    $$('.game-tab').forEach(b => b.classList.toggle('active', b === btn));
    $$('.game-panel').forEach(p => p.classList.toggle('active-game', p.id === `game-${btn.dataset.game}`));
  }));

  // CROSSWORD
  const crosswordWords = [
    { number: 1, word: 'CONDICION', row: 1, col: 1, dir: 'h' },
    { number: 2, word: 'ANIDAR', row: 0, col: 3, dir: 'v' },
    { number: 3, word: 'VALOR', row: 4, col: 2, dir: 'h' },
    { number: 4, word: 'FALSO', row: 2, col: 4, dir: 'v' },
    { number: 5, word: 'SI', row: 5, col: 4, dir: 'h' }
  ];

  function buildCrossword() {
    const rows = 10, cols = 12;
    const active = new Map();
    const starts = new Map();
    crosswordWords.forEach(item => {
      [...item.word].forEach((letter, i) => {
        const r = item.row + (item.dir === 'v' ? i : 0);
        const c = item.col + (item.dir === 'h' ? i : 0);
        const key = `${r},${c}`;
        if (active.has(key) && active.get(key) !== letter) console.warn('Crossword conflict', key);
        active.set(key, letter);
        if (i === 0) starts.set(key, item.number);
      });
    });
    const grid = $('#crosswordGrid');
    grid.innerHTML = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const cell = document.createElement('div');
        cell.className = `cross-cell${active.has(key) ? '' : ' block'}`;
        if (active.has(key)) {
          if (starts.has(key)) cell.innerHTML = `<span class="cell-number">${starts.get(key)}</span>`;
          const input = document.createElement('input');
          input.maxLength = 1;
          input.autocomplete = 'off';
          input.dataset.answer = active.get(key);
          input.setAttribute('aria-label', `Casilla fila ${r + 1}, columna ${c + 1}`);
          input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-ZÑ]/g, '');
          });
          cell.appendChild(input);
        }
        grid.appendChild(cell);
      }
    }
    $('#crosswordFeedback').textContent = state.completed.crossword ? '✓ Ya completaste este juego.' : '';
  }

  $('#checkCrossword').addEventListener('click', () => {
    const inputs = $$('#crosswordGrid input');
    let correct = 0;
    inputs.forEach(input => {
      const ok = input.value.toUpperCase() === input.dataset.answer;
      input.parentElement.classList.toggle('correct', ok);
      input.parentElement.classList.toggle('incorrect', !ok);
      if (ok) correct++;
    });
    const fb = $('#crosswordFeedback');
    if (correct === inputs.length) {
      fb.className = 'inline-feedback success';
      fb.textContent = '¡Excelente! Crucigrama completo.';
      completeMilestone('crossword', 2);
    } else {
      fb.className = 'inline-feedback error';
      fb.textContent = `Tienes ${correct} de ${inputs.length} letras correctas. Revisa las casillas en rojo.`;
    }
  });

  // MENTAL GAME
  const mentalQuestions = [
    { q: 'Si la nota es 19 y la fórmula evalúa primero ≥18, ¿qué devuelve?', a: ['AD', 'A', 'B'], correct: 0, why: '19 cumple la primera condición: ≥18.' },
    { q: 'Si una condición es A2>10 y A2 vale 10, ¿es verdadera?', a: ['Sí', 'No'], correct: 1, why: '10 no es mayor que 10; sería verdadero con ≥10.' },
    { q: '¿Qué conviene evaluar primero en una escala 18, 14 y 11?', a: ['≥11', '≥14', '≥18'], correct: 2, why: 'La condición más exigente debe ir primero.' },
    { q: 'Si no se cumple ninguna condición anterior, ¿qué se usa al final?', a: ['El último valor_si_falso', 'Una celda vacía obligatoria', 'Un filtro'], correct: 0, why: 'El último valor_si_falso funciona como caso restante.' },
    { q: '¿Cuál es el problema de olvidar una comilla en un texto como "Aprobado"?', a: ['Ninguno', 'Puede producir error o interpretarse como nombre', 'Hace la fórmula más rápida'], correct: 1, why: 'Los textos de salida deben escribirse entre comillas.' },
    { q: '¿Qué representa SI(SI(...))?', a: ['Una suma', 'Una función anidada', 'Un gráfico'], correct: 1, why: 'Una función colocada dentro de otra es una función anidada.' }
  ];

  function buildMentalGame() {
    const root = $('#mentalGame');
    root.innerHTML = '';
    mentalQuestions.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'mental-question';
      card.innerHTML = `<h4>${idx + 1}. ${item.q}</h4><div class="answer-row"></div><div class="question-feedback"></div>`;
      const row = $('.answer-row', card);
      item.a.forEach((ans, ai) => {
        const b = document.createElement('button');
        b.textContent = ans;
        b.addEventListener('click', () => {
          $$('button', row).forEach(x => x.disabled = true);
          b.classList.add(ai === item.correct ? 'correct-answer' : 'wrong-answer');
          if (ai !== item.correct) $$('button', row)[item.correct].classList.add('correct-answer');
          $('.question-feedback', card).textContent = `${ai === item.correct ? '✓ Correcto. ' : '✗ Revisa. '}${item.why}`;
          card.dataset.answered = '1';
          card.dataset.correct = ai === item.correct ? '1' : '0';
          const answered = $$('.mental-question[data-answered="1"]', root).length;
          if (answered === mentalQuestions.length) {
            const hits = $$('.mental-question[data-correct="1"]', root).length;
            const summary = document.createElement('div');
            summary.className = 'quiz-explanation';
            summary.textContent = `Resultado: ${hits}/${mentalQuestions.length}. ${hits >= 4 ? '¡Buen trabajo!' : 'Repasa la teoría y vuelve a intentarlo.'}`;
            root.appendChild(summary);
            if (hits >= 4) completeMilestone('mental', 2);
          }
        });
        row.appendChild(b);
      });
      root.appendChild(card);
    });
  }

  // WORD SEARCH (exactly 10 words)
  const WORDS = ['SI', 'ANIDADA', 'LOGICA', 'CONDICION', 'VERDADERO', 'FALSO', 'FORMULA', 'CELDA', 'RESULTADO', 'OPERADOR'];
  const DIRS = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];

  function generateWordSearch(size = 13) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const board = Array.from({ length: size }, () => Array(size).fill(''));
      const placements = [];
      let success = true;
      for (const word of WORDS) {
        let placed = false;
        for (let tries = 0; tries < 250 && !placed; tries++) {
          const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
          const r = Math.floor(Math.random() * size);
          const c = Math.floor(Math.random() * size);
          const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
          if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
          let ok = true;
          for (let i = 0; i < word.length; i++) {
            const rr = r + dr * i, cc = c + dc * i;
            if (board[rr][cc] && board[rr][cc] !== word[i]) { ok = false; break; }
          }
          if (!ok) continue;
          const cells = [];
          for (let i = 0; i < word.length; i++) {
            const rr = r + dr * i, cc = c + dc * i;
            board[rr][cc] = word[i];
            cells.push([rr,cc]);
          }
          placements.push({ word, cells });
          placed = true;
        }
        if (!placed) { success = false; break; }
      }
      if (!success) continue;
      const letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
      board.forEach((row, r) => row.forEach((v, c) => { if (!v) board[r][c] = letters[Math.floor(Math.random() * letters.length)]; }));
      return { board, placements, found: new Set(), start: null };
    }
    throw new Error('No se pudo generar la sopa de letras');
  }

  function buildWordSearch() {
    wordSearchState = generateWordSearch();
    const grid = $('#wordSearchGrid');
    grid.innerHTML = '';
    wordSearchState.board.forEach((row, r) => row.forEach((letter, c) => {
      const b = document.createElement('button');
      b.className = 'ws-cell';
      b.textContent = letter;
      b.dataset.r = r;
      b.dataset.c = c;
      b.setAttribute('aria-label', `Letra ${letter}, fila ${r + 1}, columna ${c + 1}`);
      b.addEventListener('click', () => selectWordSearchCell(r, c));
      grid.appendChild(b);
    }));
    renderWordList();
    $('#wordSearchFeedback').textContent = state.completed.wordsearch ? '✓ Ya completaste este juego. Puedes generar otra sopa si deseas.' : 'Selecciona inicio y fin de una palabra.';
  }

  function lineCells(r1, c1, r2, c2) {
    const drRaw = r2 - r1, dcRaw = c2 - c1;
    const dr = Math.sign(drRaw), dc = Math.sign(dcRaw);
    if (!(drRaw === 0 || dcRaw === 0 || Math.abs(drRaw) === Math.abs(dcRaw))) return null;
    const len = Math.max(Math.abs(drRaw), Math.abs(dcRaw)) + 1;
    return Array.from({ length: len }, (_, i) => [r1 + dr * i, c1 + dc * i]);
  }

  function cellsEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    return a.every((cell, i) => cell[0] === b[i][0] && cell[1] === b[i][1]);
  }

  function selectWordSearchCell(r, c) {
    const cells = $$('.ws-cell');
    if (!wordSearchState.start) {
      wordSearchState.start = [r,c];
      cells.forEach(x => x.classList.remove('start'));
      $(`.ws-cell[data-r="${r}"][data-c="${c}"]`).classList.add('start');
      $('#wordSearchFeedback').textContent = 'Ahora toca la última letra de la palabra.';
      return;
    }
    const [r1,c1] = wordSearchState.start;
    const selected = lineCells(r1,c1,r,c);
    cells.forEach(x => x.classList.remove('start'));
    wordSearchState.start = null;
    if (!selected) {
      $('#wordSearchFeedback').className = 'inline-feedback error';
      $('#wordSearchFeedback').textContent = 'La selección debe ser horizontal, vertical o diagonal.';
      return;
    }
    const reverse = [...selected].reverse();
    const hit = wordSearchState.placements.find(p => !wordSearchState.found.has(p.word) && (cellsEqual(p.cells, selected) || cellsEqual(p.cells, reverse)));
    if (!hit) {
      $('#wordSearchFeedback').className = 'inline-feedback error';
      $('#wordSearchFeedback').textContent = 'Esa línea no corresponde a una palabra pendiente. Intenta otra vez.';
      return;
    }
    wordSearchState.found.add(hit.word);
    hit.cells.forEach(([rr,cc]) => $(`.ws-cell[data-r="${rr}"][data-c="${cc}"]`).classList.add('found'));
    renderWordList();
    const count = wordSearchState.found.size;
    const fb = $('#wordSearchFeedback');
    fb.className = 'inline-feedback success';
    fb.textContent = `¡Encontraste ${hit.word}! Vas ${count}/10.`;
    if (count === WORDS.length) {
      fb.textContent = '¡Excelente! Encontraste las 10 palabras.';
      completeMilestone('wordsearch', 2);
    }
  }

  function renderWordList() {
    $('#wordList').innerHTML = WORDS.map(w => `<span class="word-chip ${wordSearchState?.found.has(w) ? 'found' : ''}">${w}</span>`).join('');
  }
  $('#resetWordSearch').addEventListener('click', buildWordSearch);

  // QUIZ
  const quizQuestions = [
    { q: '¿Qué hace la función SI en Google Sheets?', options: ['Ordena datos', 'Evalúa una condición y devuelve un resultado', 'Crea un gráfico', 'Protege una hoja'], answer: 1, why: 'SI evalúa una prueba lógica y devuelve un valor si es verdadera y otro si es falsa.' },
    { q: '¿Qué significa anidar funciones?', options: ['Copiar una fórmula', 'Insertar una función dentro de otra', 'Cambiar el color de celdas', 'Fijar una referencia'], answer: 1, why: 'Anidar es colocar una función dentro de otra para ampliar la lógica.' },
    { q: 'En una escala AD ≥18, A ≥14, B ≥11, ¿qué condición debe ir primero?', options: ['≥11', '≥14', '≥18', 'Da igual'], answer: 2, why: 'Se empieza por el criterio más exigente para evitar que valores altos coincidan antes con criterios menores.' },
    { q: '¿Qué devuelve =SI(A2>=11;"Sí";"No") cuando A2 vale 9?', options: ['Sí', 'No', '11', 'Error'], answer: 1, why: '9 no cumple A2>=11, por eso se usa el valor_si_falso.' },
    { q: '¿Cómo debe escribirse un texto de salida en una fórmula?', options: ['Entre comillas', 'Entre corchetes', 'Sin símbolos', 'Con #'], answer: 0, why: 'Los textos literales se escriben entre comillas.' },
    { q: '¿Qué error lógico ocurre al evaluar primero >=11 y después >=18?', options: ['Ninguno', 'Las notas altas pueden quedarse clasificadas en el primer nivel', 'Sheets se cierra', 'Se borra la celda'], answer: 1, why: 'Una nota 18 también cumple >=11, así que no llegará al criterio >=18.' },
    { q: '¿Qué tecla puede alternar referencias relativas y absolutas mientras editas una fórmula en escritorio?', options: ['F4', 'Esc', 'F1', 'Tab'], answer: 0, why: 'F4 suele alternar A1, $A$1, A$1 y $A1 mientras editas una referencia.' },
    { q: 'En =SI(B2>=18;"AD";SI(B2>=14;"A";"B")), ¿qué devuelve si B2=15?', options: ['AD', 'A', 'B', 'Error'], answer: 1, why: '15 no cumple >=18, pero sí cumple >=14.' },
    { q: '¿Por qué conviene probar valores como 10, 11, 13, 14, 17 y 18?', options: ['Porque son números pares', 'Para revisar límites de cada condición', 'Para crear gráficos', 'Para ordenar alfabéticamente'], answer: 1, why: 'Los valores cercanos a cada límite revelan errores de comparación u orden.' },
    { q: '¿Qué representa el último valor_si_falso en una cadena SI anidada?', options: ['El caso restante cuando no se cumple lo anterior', 'Una condición extra obligatoria', 'La primera categoría', 'Un comentario'], answer: 0, why: 'Funciona como la salida final para todos los casos que no cumplieron las condiciones previas.' }
  ];
  let quizIndex = 0, quizScore = 0, quizLocked = false;

  function buildQuiz() {
    quizIndex = 0; quizScore = 0; quizLocked = false;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const root = $('#quizContainer');
    if (quizIndex >= quizQuestions.length) {
      const passed = quizScore >= 7;
      state.quizBest = Math.max(state.quizBest || 0, quizScore);
      saveState();
      if (passed) completeMilestone('quiz', 3);
      root.innerHTML = `<div class="quiz-result"><div class="result-emoji">${passed ? '🏆' : '📘'}</div><h3>${passed ? '¡Reto superado!' : 'Buen intento'}</h3><p>Obtuviste <strong>${quizScore}/10</strong>. ${passed ? 'Ya demostraste un buen dominio de la lógica.' : 'Necesitas 7 respuestas correctas para completar este reto.'}</p><button id="restartQuiz" class="primary-button">Intentar nuevamente</button></div>`;
      $('#restartQuiz').addEventListener('click', buildQuiz);
      return;
    }
    quizLocked = false;
    const item = quizQuestions[quizIndex];
    root.innerHTML = `
      <div class="quiz-progress"><span>${quizIndex + 1}/10</span><div class="track"><i style="width:${(quizIndex / 10) * 100}%"></i></div><strong>${quizScore} pts</strong></div>
      <div class="quiz-card">
        <h4>${quizIndex + 1}. ${item.q}</h4>
        <div class="quiz-options">${item.options.map((o,i) => `<button class="quiz-option" data-option="${i}">${o}</button>`).join('')}</div>
        <div id="quizExplanation"></div>
        <div class="quiz-nav"><button id="nextQuiz" class="primary-button" disabled>${quizIndex === 9 ? 'Ver resultado' : 'Siguiente'} →</button></div>
      </div>`;
    $$('.quiz-option', root).forEach(btn => btn.addEventListener('click', () => answerQuiz(Number(btn.dataset.option))));
    $('#nextQuiz').addEventListener('click', () => { quizIndex++; renderQuizQuestion(); });
  }

  function answerQuiz(option) {
    if (quizLocked) return;
    quizLocked = true;
    const item = quizQuestions[quizIndex];
    const opts = $$('.quiz-option');
    opts.forEach((b,i) => {
      b.disabled = true;
      if (i === item.answer) b.classList.add('correct-answer');
      if (i === option && option !== item.answer) b.classList.add('wrong-answer');
    });
    if (option === item.answer) quizScore++;
    $('#quizExplanation').innerHTML = `<div class="quiz-explanation"><b>${option === item.answer ? '✓ Correcto.' : '✗ No exactamente.'}</b> ${item.why}</div>`;
    $('#nextQuiz').disabled = false;
  }

  // DIPLOMA
  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
  }

  async function generateDiploma() {
    if (progressPercent() !== 100 || !state.student) return;
    const canvas = $('#diplomaCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#fffdf9'; ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = '#071f57'; ctx.lineWidth = 26; ctx.strokeRect(28,28,W-56,H-56);
    ctx.strokeStyle = '#e91823'; ctx.lineWidth = 7; ctx.strokeRect(54,54,W-108,H-108);

    ctx.fillStyle = '#071f57';
    roundedRect(ctx, 120, 112, W-240, 125, 24); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '700 34px Arial'; ctx.textAlign = 'center';
    ctx.fillText('COLEGIO SAGRADO CORAZÓN DE LA MOLINA', W/2, 162);
    ctx.font = '500 25px Arial'; ctx.fillText('LIMA · PERÚ', W/2, 202);

    const logo = new Image();
    logo.src = 'assets/logo-scm.png';
    try { await logo.decode(); } catch (_) {}
    const logoSize = 168;
    ctx.drawImage(logo, W/2-logoSize/2, 258, logoSize, logoSize);

    ctx.fillStyle = '#e91823'; ctx.font = '800 56px Arial'; ctx.fillText('DIPLOMA DE LOGRO', W/2, 495);
    ctx.fillStyle = '#5f6a7d'; ctx.font = '400 28px Arial'; ctx.fillText('Se otorga el presente reconocimiento a', W/2, 552);

    const full = `${state.student.firstName} ${state.student.lastName}`;
    ctx.fillStyle = '#071f57'; ctx.font = '700 62px Georgia'; ctx.fillText(full, W/2, 648);
    ctx.strokeStyle = '#d7dde8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(315,675); ctx.lineTo(W-315,675); ctx.stroke();

    ctx.fillStyle = '#4e5a70'; ctx.font = '400 27px Arial';
    ctx.fillText('por completar satisfactoriamente la experiencia interactiva', W/2, 735);
    ctx.fillStyle = '#071f57'; ctx.font = '700 36px Arial';
    ctx.fillText('“Función SI Anidada para Google Sheets”', W/2, 786);

    ctx.fillStyle = '#4e5a70'; ctx.font = '400 25px Arial';
    ctx.fillText(`2.º de Secundaria · Sección ${state.student.section}`, W/2, 842);

    const date = new Intl.DateTimeFormat('es-PE', { day:'2-digit', month:'long', year:'numeric' }).format(new Date());
    ctx.font = '400 23px Arial'; ctx.fillText(`Emitido el ${date}`, W/2, 908);

    ctx.fillStyle = '#071f57'; roundedRect(ctx, 585, 950, 430, 58, 29); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 22px Arial'; ctx.fillText('APRENDE · PRACTICA · CREA', W/2, 987);

    canvas.style.display = 'block';
    $('#diplomaPlaceholder').style.display = 'none';
    $('#downloadDiploma').disabled = false;
    showToast('Diploma generado correctamente.');
  }

  $('#generateDiploma').addEventListener('click', generateDiploma);
  $('#downloadDiploma').addEventListener('click', () => {
    const canvas = $('#diplomaCanvas');
    const a = document.createElement('a');
    const safeName = `${state.student.firstName}-${state.student.lastName}`.replace(/\s+/g,'-');
    a.download = `Diploma-SCM-${safeName}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  // INIT
  loadState();
  buildCrossword();
  buildMentalGame();
  buildWordSearch();
  buildQuiz();
  updateProgressUI();
  if (state.student) {
    // Por privacidad, no se salta automáticamente el acceso: se conservan los avances, pero se solicita la clave en cada nueva carga.
    $('#firstName').value = state.student.firstName || '';
    $('#lastName').value = state.student.lastName || '';
    const radio = $(`input[name="section"][value="${state.student.section}"]`);
    if (radio) radio.checked = true;
  }
})();
