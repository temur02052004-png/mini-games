const RING_CIRCUMFERENCE = 2 * Math.PI * 100;

const state = {
  mode: "work",
  durations: { work: 25 * 60, short: 5 * 60, long: 15 * 60 },
  remaining: 25 * 60,
  running: false,
  intervalId: null,
  tasks: load("focusSprintTasks", []),
  selectedTaskId: load("focusSprintSelectedTask", null),
  sessionsToday: load("focusSprintSessions", { date: todayKey(), count: 0 }),
};

const els = {
  timeDisplay: document.getElementById("timeDisplay"),
  ringProgress: document.getElementById("ringProgress"),
  startBtn: document.getElementById("startBtn"),
  resetBtn: document.getElementById("resetBtn"),
  streak: document.getElementById("streak"),
  currentTask: document.getElementById("currentTask"),
  taskForm: document.getElementById("taskForm"),
  taskInput: document.getElementById("taskInput"),
  taskList: document.getElementById("taskList"),
  modeTabs: document.querySelectorAll(".mode-tab"),
  workMins: document.getElementById("workMins"),
  shortMins: document.getElementById("shortMins"),
  longMins: document.getElementById("longMins"),
  celebration: document.getElementById("celebration"),
  celebrationText: document.getElementById("celebrationText"),
};

els.ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function renderTimer() {
  els.timeDisplay.textContent = formatTime(state.remaining);
  const total = state.durations[state.mode];
  const progress = 1 - state.remaining / total;
  els.ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * progress;
  const colors = { work: "#ff6b5e", short: "#5ec9ff", long: "#6effa0" };
  els.ringProgress.style.stroke = colors[state.mode];
}

function renderStreak() {
  if (state.sessionsToday.date !== todayKey()) {
    state.sessionsToday = { date: todayKey(), count: 0 };
    save("focusSprintSessions", state.sessionsToday);
  }
  els.streak.textContent = `🔥 ${state.sessionsToday.count} sessions today`;
}

function renderCurrentTask() {
  const task = state.tasks.find((t) => t.id === state.selectedTaskId);
  els.currentTask.textContent = task ? `Focusing on: ${task.label}` : "No task selected";
}

function renderTasks() {
  els.taskList.innerHTML = "";
  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "") + (task.id === state.selectedTaskId ? " selected" : "");
    li.dataset.id = task.id;

    const label = document.createElement("span");
    label.className = "task-label";
    label.textContent = task.label;

    const pomos = document.createElement("span");
    pomos.className = "task-pomos";
    pomos.textContent = task.pomodoros ? `🍅 ${task.pomodoros}` : "";

    const del = document.createElement("button");
    del.className = "task-delete";
    del.textContent = "✕";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      state.tasks = state.tasks.filter((t) => t.id !== task.id);
      if (state.selectedTaskId === task.id) state.selectedTaskId = null;
      persistTasks();
      renderTasks();
      renderCurrentTask();
    });

    li.addEventListener("click", () => {
      state.selectedTaskId = task.id;
      save("focusSprintSelectedTask", state.selectedTaskId);
      renderTasks();
      renderCurrentTask();
    });

    li.append(label, pomos, del);
    els.taskList.appendChild(li);
  });
}

function persistTasks() {
  save("focusSprintTasks", state.tasks);
}

els.taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const label = els.taskInput.value.trim();
  if (!label) return;
  const task = { id: crypto.randomUUID(), label, done: false, pomodoros: 0 };
  state.tasks.push(task);
  if (!state.selectedTaskId) {
    state.selectedTaskId = task.id;
    save("focusSprintSelectedTask", task.id);
  }
  persistTasks();
  renderTasks();
  renderCurrentTask();
  els.taskInput.value = "";
});

els.modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (state.running) stopTimer();
    els.modeTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.mode = tab.dataset.mode;
    state.remaining = state.durations[state.mode];
    renderTimer();
  });
});

[["workMins", "work"], ["shortMins", "short"], ["longMins", "long"]].forEach(([id, mode]) => {
  els[id].addEventListener("change", () => {
    const mins = Math.max(1, parseInt(els[id].value, 10) || 1);
    state.durations[mode] = mins * 60;
    if (state.mode === mode && !state.running) {
      state.remaining = state.durations[mode];
      renderTimer();
    }
  });
});

els.startBtn.addEventListener("click", () => {
  if (state.running) stopTimer();
  else startTimer();
});

els.resetBtn.addEventListener("click", () => {
  stopTimer();
  state.remaining = state.durations[state.mode];
  renderTimer();
});

function startTimer() {
  state.running = true;
  els.startBtn.textContent = "Pause";
  state.intervalId = setInterval(() => {
    state.remaining -= 1;
    renderTimer();
    if (state.remaining <= 0) {
      completeSession();
    }
  }, 1000);
}

function stopTimer() {
  state.running = false;
  els.startBtn.textContent = "Start";
  clearInterval(state.intervalId);
}

function completeSession() {
  stopTimer();
  playChime();

  if (state.mode === "work") {
    state.sessionsToday.count += 1;
    save("focusSprintSessions", state.sessionsToday);
    renderStreak();

    const task = state.tasks.find((t) => t.id === state.selectedTaskId);
    if (task) {
      task.pomodoros = (task.pomodoros || 0) + 1;
      persistTasks();
      renderTasks();
    }
    showCelebration("Sprint complete! Take a break 🎉");
  } else {
    showCelebration("Break's over. Ready to focus?");
  }

  state.remaining = state.durations[state.mode];
  renderTimer();
}

function showCelebration(text) {
  els.celebrationText.textContent = text;
  els.celebration.classList.add("show");
  setTimeout(() => els.celebration.classList.remove("show"), 1800);
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {
    // audio not available, ignore
  }
}

renderTimer();
renderStreak();
renderTasks();
renderCurrentTask();
