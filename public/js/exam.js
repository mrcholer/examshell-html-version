/**
 * Poolers Exam Shell — 42-style levels, files, terminal only
 */
const PoolersExam = (() => {
  let session = null;
  let exams = [];
  let difficulty = "normal";
  let onChange = null;

  const $ = (s) => document.querySelector(s);

  async function loadCatalog() {
    const res = await fetch("/api/exams");
    const data = await res.json();
    exams = data.exams || [];
    return exams;
  }

  function getSession() {
    return session;
  }

  function getDifficulty() {
    return difficulty;
  }

  function setDifficulty(d) {
    const key = String(d || "normal").toLowerCase();
    difficulty = key === "hard" || key === "extreme" ? key : "normal";
    updateDiffUi();
    return difficulty;
  }

  function updateDiffUi() {
    document.querySelectorAll(".exam-diff-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.difficulty === difficulty);
    });
    const hint = $("#exam-diff-hint");
    if (hint) {
      if (difficulty === "extreme") {
        hint.textContent = "Extreme — densest pools, hard exercises from early levels.";
      } else if (difficulty === "hard") {
        hint.textContent = "Hard — tougher exercises earlier, same 10 levels / 2 per level.";
      } else {
        hint.textContent = "Normal — classic exam pacing across 10 levels.";
      }
    }
  }

  function isActive() {
    return !!(session && session.status === "active");
  }

  function setOnChange(fn) {
    onChange = fn;
  }

  function emit() {
    if (typeof onChange === "function") onChange(session);
  }

  async function start(examId, diff) {
    if (diff) setDifficulty(diff);
    const res = await fetch("/api/exam/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examId, difficulty }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    session = data;
    try { localStorage.setItem("poolers.examSession", data.id); } catch (_) { }
    emit();
    return session;
  }

  async function resume(id) {
    const res = await fetch(`/api/exam/${id}`);
    if (!res.ok) {
      try { localStorage.removeItem("poolers.examSession"); } catch (_) { }
      return null;
    }
    session = await res.json();
    emit();
    return session;
  }

  async function tryResume() {
    let id = null;
    try { id = localStorage.getItem("poolers.examSession"); } catch (_) { }
    if (!id) return null;
    const s = await resume(id);
    if (s && s.status === "active") return s;
    if (s && s.status === "expired") {
      try { localStorage.removeItem("poolers.examSession"); } catch (_) { }
      return s;
    }
    try { localStorage.removeItem("poolers.examSession"); } catch (_) { }
    session = null;
    return null;
  }

  async function abandon() {
    if (!session) return;
    await fetch(`/api/exam/${session.id}/abandon`, { method: "POST" });
    try { localStorage.removeItem("poolers.examSession"); } catch (_) { }
    session = null;
    emit();
  }

  async function fetchCurrentFile() {
    if (!session?.current) return null;
    const name = session.current.filename;
    const res = await fetch(`/api/exam/${session.id}/file?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function saveFile(name, content) {
    if (!session) return;
    await fetch(`/api/exam/${session.id}/file`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });
  }

  async function grade(name, content, cheat) {
    if (!session) throw new Error("No exam session");
    const res = await fetch(`/api/exam/${session.id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content, cheat: cheat || null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.session) {
      session = data.session;
      if (session.status !== "active") {
        try { localStorage.removeItem("poolers.examSession"); } catch (_) { }
      }
      emit();
    }
    return data;
  }

  async function fetchTraces() {
    if (!session) return { disabled: true, traces: [] };
    const res = await fetch(`/api/exam/${session.id}/traces`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function fetchTrace(traceId) {
    if (!session) throw new Error("No exam session");
    const res = await fetch(`/api/exam/${session.id}/traces/${encodeURIComponent(traceId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function fetchPassed() {
    if (!session) return [];
    const res = await fetch(`/api/exam/${session.id}/passed`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data.items || [];
  }

  async function fetchPassedFile(exerciseId) {
    if (!session) throw new Error("No exam session");
    const res = await fetch(`/api/exam/${session.id}/passed/${encodeURIComponent(exerciseId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function renderLevels(container) {
    if (!container) return;
    container.innerHTML = "";
    if (!session) {
      container.innerHTML = `<p class="empty-state">Choose an exam and press <kbd>Start Exam</kbd>.</p>`;
      return;
    }

    const head = document.createElement("div");
    head.className = "exam-session-head";
    head.innerHTML = `
      <div class="exam-title">${escapeHtml(session.title)}</div>
      <div class="exam-status ${session.status}">${escapeHtml(session.status)} · ${escapeHtml(session.difficultyTitle || session.difficulty || "Normal")} · L${session.level}/${(session.levelCount || 10) - 1}</div>
      <p class="exam-msg">${escapeHtml(session.message || "")}</p>
    `;
    container.appendChild(head);

    for (const lv of session.levels || []) {
      const el = document.createElement("div");
      const active = lv.level === session.level && session.status === "active";
      el.className = `exam-level${active ? " active" : ""}${lv.locked ? " locked" : ""}${lv.complete ? " complete" : ""}`;
      const badges = (lv.assigned || []).map((id) => {
        const done = (lv.passed || []).includes(id);
        const cur = active && lv.assigned[lv.currentIndex] === id;
        return `<span class="exam-ex-badge${done ? " done" : ""}${cur ? " current" : ""}">${escapeHtml(id)}</span>`;
      }).join("");
      el.innerHTML = `
        <div class="exam-level-title">
          <strong>Level ${lv.level}</strong>
          <span>${lv.passed.length}/${lv.assigned.length}</span>
          ${lv.poolSize ? `<span class="pill" title="Random from a pool of ${lv.poolSize}">pool ${lv.poolSize}</span>` : ""}
          ${lv.locked ? "<span class=\"pill\">locked</span>" : ""}
          ${lv.complete ? "<span class=\"pill pill-success\">cleared</span>" : ""}
        </div>
        <div class="exam-ex-list">${badges}</div>
      `;
      container.appendChild(el);
    }
  }

  function renderFiles(container) {
    if (!container) return;
    container.innerHTML = "";
    if (!session?.current) {
      container.innerHTML = `<p class="empty-state">No assignment yet.</p>`;
      return;
    }
    const code = document.createElement("button");
    code.className = "exam-file-row active";
    code.innerHTML = `
      <span class="file-type-icon c">●</span>
      <span>${escapeHtml(session.current.filename)}</span>
      <span class="exam-file-side">left</span>
    `;
    code.dataset.file = session.current.filename;
    container.appendChild(code);

    const sub = document.createElement("button");
    sub.className = "exam-file-row";
    sub.innerHTML = `
      <span class="file-type-icon lesson">◆</span>
      <span>subject.md</span>
      <span class="exam-file-side">right</span>
    `;
    sub.dataset.file = "subject.md";
    container.appendChild(sub);
  }

  function renderStartModal(listEl) {
    if (!listEl) return;
    updateDiffUi();
    listEl.innerHTML = "";
    for (const e of exams) {
      const card = document.createElement("button");
      card.className = "exam-pick-card";
      card.dataset.id = e.id;
      card.innerHTML = `
        <strong>${escapeHtml(e.title)}</strong>
        <span>10 levels · multi pool · 2 random / level · ${difficulty === "extreme" ? "Extreme" : difficulty === "hard" ? "Hard" : "Normal"
        }</span>
      `;
      listEl.appendChild(card);
    }
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  return {
    loadCatalog,
    getSession,
    getDifficulty,
    setDifficulty,
    isActive,
    setOnChange,
    start,
    resume,
    tryResume,
    abandon,
    fetchCurrentFile,
    saveFile,
    grade,
    fetchTraces,
    fetchTrace,
    fetchPassed,
    fetchPassedFile,
    renderLevels,
    renderFiles,
    renderStartModal,
  };
})();

if (typeof module !== "undefined") module.exports = PoolersExam;
