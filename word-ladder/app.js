const WORD_SET = new Set(WORDS);

function neighbors(word) {
  const res = [];
  for (let i = 0; i < word.length; i++) {
    for (let c = 65; c <= 90; c++) {
      const ch = String.fromCharCode(c);
      if (ch === word[i]) continue;
      const cand = word.slice(0, i) + ch + word.slice(i + 1);
      if (WORD_SET.has(cand)) res.push(cand);
    }
  }
  return res;
}

function bfsPath(start, end) {
  if (start === end) return [start];
  const queue = [start];
  const prev = { [start]: null };
  while (queue.length) {
    const cur = queue.shift();
    for (const n of neighbors(cur)) {
      if (n in prev) continue;
      prev[n] = cur;
      if (n === end) {
        const path = [];
        let x = n;
        while (x !== null) { path.unshift(x); x = prev[x]; }
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dayNumber() {
  return Math.floor(Date.now() / 86400000);
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const els = {
  puzzleLabel: document.getElementById("puzzleLabel"),
  stats: document.getElementById("stats"),
  ladder: document.getElementById("ladder"),
  guessForm: document.getElementById("guessForm"),
  guessInput: document.getElementById("guessInput"),
  feedback: document.getElementById("feedback"),
  hintBtn: document.getElementById("hintBtn"),
  giveUpBtn: document.getElementById("giveUpBtn"),
  newPuzzleBtn: document.getElementById("newPuzzleBtn"),
  moveCount: document.getElementById("moveCount"),
  parCount: document.getElementById("parCount"),
  hintCount: document.getElementById("hintCount"),
  celebration: document.getElementById("celebration"),
  celebrationEmoji: document.getElementById("celebrationEmoji"),
  celebrationText: document.getElementById("celebrationText"),
  celebrationSub: document.getElementById("celebrationSub"),
  celebrationClose: document.getElementById("celebrationClose"),
};

const stats = load("wordLadderStats", {
  lastSolvedDate: null,
  currentStreak: 0,
  maxStreak: 0,
});

let state = null;

function newState(puzzle, isDaily) {
  return {
    puzzleIndex: PUZZLES.indexOf(puzzle),
    start: puzzle.start,
    end: puzzle.end,
    chain: [puzzle.start],
    moves: 0,
    hintsUsed: 0,
    solved: false,
    revealed: false,
    isDaily,
  };
}

function initDaily() {
  const idx = dayNumber() % PUZZLES.length;
  const puzzle = PUZZLES[idx];
  const saved = load("wordLadderProgress", null);
  if (saved && saved.date === todayKey() && saved.puzzleIndex === idx) {
    state = saved.state;
  } else {
    state = newState(puzzle, true);
    persistDaily();
  }
  els.puzzleLabel.textContent = "Daily puzzle";
}

function persistDaily() {
  if (!state.isDaily) return;
  save("wordLadderProgress", { date: todayKey(), puzzleIndex: state.puzzleIndex, state });
}

function startPractice() {
  const idx = Math.floor(Math.random() * PUZZLES.length);
  state = newState(PUZZLES[idx], false);
  els.puzzleLabel.textContent = "Practice puzzle";
  renderAll();
}

function letterDiffIndex(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return i;
  }
  return -1;
}

function renderLadder() {
  els.ladder.innerHTML = "";
  state.chain.forEach((word, idx) => {
    const rung = document.createElement("div");
    rung.className = "rung";
    if (idx === 0) rung.classList.add("start");
    if (word === state.end) rung.classList.add("end");
    if (hintedIndices.has(idx)) rung.classList.add("hinted");

    const prev = idx > 0 ? state.chain[idx - 1] : null;
    const diffIdx = prev ? letterDiffIndex(prev, word) : -1;

    for (let i = 0; i < word.length; i++) {
      const span = document.createElement("span");
      span.className = "letter" + (i === diffIdx ? " changed" : "");
      span.textContent = word[i];
      rung.appendChild(span);
    }
    els.ladder.appendChild(rung);
  });

  const last = state.chain[state.chain.length - 1];
  if (last !== state.end) {
    const ghost = document.createElement("div");
    ghost.className = "rung end ghost";
    ghost.style.opacity = "0.35";
    for (const ch of state.end) {
      const span = document.createElement("span");
      span.className = "letter";
      span.textContent = ch;
      ghost.appendChild(span);
    }
    els.ladder.appendChild(ghost);
  }
}

function renderMeta() {
  els.moveCount.textContent = `Moves: ${state.moves}`;
  const optimal = bfsPath(state.start, state.end);
  els.parCount.textContent = `Best possible: ${optimal ? optimal.length - 1 : "?"}`;
  els.hintCount.textContent = `Hints used: ${state.hintsUsed}`;
}

function renderStats() {
  els.stats.textContent = `🔥 ${stats.currentStreak} day streak`;
}

function renderAll() {
  renderLadder();
  renderMeta();
  renderStats();
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  const finished = state.solved || state.revealed;
  els.guessInput.disabled = finished;
  els.guessForm.querySelector("button").disabled = finished;
  els.hintBtn.disabled = finished;
  els.giveUpBtn.disabled = finished;
  els.guessInput.value = "";
  if (!finished) els.guessInput.focus();
}

function showFeedback(msg, ok) {
  els.feedback.textContent = msg;
  els.feedback.className = "feedback" + (ok ? " ok" : "");
}

function submitGuess(raw) {
  const guess = raw.trim().toUpperCase();
  const last = state.chain[state.chain.length - 1];

  if (!guess) return;
  if (guess.length !== state.start.length) {
    showFeedback(`Must be a ${state.start.length}-letter word.`);
    return;
  }
  if (guess === last) {
    showFeedback("That's the word you're already on.");
    return;
  }
  if (state.chain.includes(guess)) {
    showFeedback("You've already used that word.");
    return;
  }
  if (letterDiffIndex(guess, last) === -1 || countDiff(guess, last) !== 1) {
    showFeedback("Change exactly one letter from the last word.");
    return;
  }
  if (!WORD_SET.has(guess)) {
    showFeedback(`"${guess}" isn't in the word list.`);
    return;
  }

  state.chain.push(guess);
  state.moves += 1;

  if (guess === state.end) {
    finishPuzzle(false);
  } else {
    showFeedback("Nice move!", true);
  }

  persistDaily();
  renderAll();
}

function countDiff(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

function useHint() {
  const last = state.chain[state.chain.length - 1];
  const path = bfsPath(last, state.end);
  if (!path || path.length < 2) return;
  const next = path[1];
  state.chain.push(next);
  state.moves += 1;
  state.hintsUsed += 1;
  hintedIndices.add(state.chain.length - 1);

  if (next === state.end) {
    finishPuzzle(false);
  } else {
    showFeedback("Here's a hint.", true);
  }
  persistDaily();
  renderAll();
}

const hintedIndices = new Set();

function finishPuzzle(revealed) {
  state.solved = true;
  state.revealed = revealed;

  if (state.isDaily && !revealed) {
    if (stats.lastSolvedDate !== todayKey()) {
      const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      stats.currentStreak = stats.lastSolvedDate === yesterdayKey ? stats.currentStreak + 1 : 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      stats.lastSolvedDate = todayKey();
      save("wordLadderStats", stats);
    }
  } else if (state.isDaily && revealed) {
    stats.currentStreak = 0;
    save("wordLadderStats", stats);
  }

  if (!revealed) {
    playChime();
    showCelebration(
      "Solved! 🏆",
      `${state.moves} moves (best possible: ${bfsPath(state.start, state.end).length - 1}), ${state.hintsUsed} hint(s) used.`
    );
  }
}

function giveUp() {
  const path = bfsPath(state.chain[state.chain.length - 1], state.end);
  if (path) {
    for (let i = 1; i < path.length; i++) state.chain.push(path[i]);
  }
  finishPuzzle(true);
  persistDaily();
  renderAll();
  showCelebration("Answer revealed", "No worries — try tomorrow's puzzle for a fresh streak.");
}

function showCelebration(text, sub) {
  els.celebrationText.textContent = text;
  els.celebrationSub.textContent = sub;
  els.celebration.classList.add("show");
}

els.celebrationClose.addEventListener("click", () => {
  els.celebration.classList.remove("show");
});

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.35);
    });
  } catch {
    // audio not available, ignore
  }
}

els.guessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submitGuess(els.guessInput.value);
});

els.hintBtn.addEventListener("click", useHint);
els.giveUpBtn.addEventListener("click", giveUp);
els.newPuzzleBtn.addEventListener("click", startPractice);

initDaily();
renderAll();
