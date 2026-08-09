/**
 * Poolers Exam Shell — /exam interactive terminal (42-style)
 */
(() => {
  // desktop-only.js has already turned this device away — don't boot Monaco,
  // terminals or timers behind the gate
  if (window.__EXAM_BLOCKED) return;

  const $ = (s) => document.querySelector(s);
  const shellMain = $("#shell-main");
  const workspace = $("#workspace");
  const subjectView = $("#subject-view");
  const tracesView = $("#traces-view");
  const passedView = $("#passed-view");
  const levelRail = $("#level-rail");
  const subjectTabsEl = $("#subject-tabs");
  const codeFilename = $("#code-filename");
  const levelPill = $("#level-pill");
  const dayPill = $("#day-pill");
  const shellStatus = $("#shell-status");
  const btnGrade = $("#btn-grade");
  const btnLeave = $("#btn-leave");
  const termResize = $("#term-resize");
  const splitHandle = $("#split-handle");
  const timerChip = $("#timer-chip");
  const scoreChip = $("#score-chip");
  const dropOverlay = $("#drop-overlay");
  const editorWrap = $("#exam-editor-wrap");
  const termTabsEl = $("#term-tabs");
  const termPanelsEl = $("#term-panels");
  const tracesBadge = $("#traces-badge");

  let editor = null;
  let monacoReady = null;
  let wizard = null;
  let autosaveTimer = null;
  let tabState = { stamp: 0, prefix: "" };
  let timerInterval = null;
  let expiredNotified = false;
  let gradeWait = null;
  let loadingCode = false;
  let cheatFlags = { paste: false, drop: false };
  let tracesSeenCount = 0;

  const HIST_KEY_LEGACY = "poolers.examHist";
  const HIST_STORE_KEY = "poolers.termHist";
  const HIST_MAX = 200;
  let histStore = { examshell: [], test: [] };

  const terminals = new Map();
  let activeTermId = null;
  let splitPair = null;
  let termSeq = 1;
  let shellTermId = null;
  let sashDragging = false;
  let sashListenersBound = false;

  function activeTerm() {
    return terminals.get(activeTermId) || null;
  }

  function shellTerm() {
    return terminals.get(shellTermId) || activeTerm();
  }

  function isSplitOn() {
    return (
      Array.isArray(splitPair) &&
      splitPair.length === 2 &&
      terminals.has(splitPair[0]) &&
      terminals.has(splitPair[1]) &&
      splitPair[0] !== splitPair[1]
    );
  }

  function focusInputEl(input) {
    if (!input) return;
    requestAnimationFrame(() => {
      try {
        input.focus({ preventScroll: true });
      } catch (_) {
        input.focus();
      }
    });
  }

  function markFocused(id) {
    for (const t of terminals.values()) {
      t.panel.classList.toggle("focused", t.id === id);
    }
  }

  function createTerminal(kind, title, opts = {}) {
    const id = `t${termSeq++}`;
    const panel = document.createElement("div");
    panel.className = "term-panel";
    panel.dataset.id = id;
    panel.innerHTML = `
      <div class="term-out" data-out></div>
      <form class="term-form" autocomplete="off">
        <label class="term-prompt"><span class="term-cwd">$</span></label>
        <input class="term-in" type="text" spellcheck="false" autocomplete="off" />
      </form>
    `;
    const out = panel.querySelector("[data-out]");
    const form = panel.querySelector(".term-form");
    const input = panel.querySelector(".term-in");
    const cwd = panel.querySelector(".term-cwd");
    termPanelsEl.appendChild(panel);

    const hist = histForKind(kind);
    const term = {
      id,
      kind, // examshell | test
      title: title || (kind === "examshell" ? "examshell" : `Test ${id}`),
      panel,
      out,
      form,
      input,
      cwd,
      history: hist,
      histIdx: hist.length,
      histDraft: "",
    };
    terminals.set(id, term);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      focusTerminal(id);
      const v = input.value;
      input.value = "";
      if (term.kind === "examshell") {
        if (gradeWait) {
          await dispatch(v);
          return;
        }
        pushHistory(term, v);
        await dispatch(v);
      } else if (term.kind === "man") {
        pushHistory(term, v);
        await dispatchMan(term, v);
      } else {
        pushHistory(term, v);
        await dispatchTest(term, v);
      }
      focusInputEl(input);
    });

    input.addEventListener("keydown", (e) => onTermKeydown(term, e));
    input.addEventListener("focus", () => {
      if (activeTermId !== id) {
        activeTermId = id;
        markFocused(id);
        renderTermTabs();
        promptLabel();
      }
    });

    panel.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, a, .term-tab-close, .term-icon-btn, .term-split-sash")) return;
      if (e.target.closest(".term-in")) {
        activeTermId = id;
        markFocused(id);
        renderTermTabs();
        promptLabel();
        return;
      }
      e.preventDefault();
      focusTerminal(id);
    });

    if (kind === "examshell") shellTermId = id;
    if (opts.activate !== false) focusTerminal(id);
    else {
      layoutPanels();
      renderTermTabs();
    }
    return term;
  }

  function renderTermTabs() {
    if (!termTabsEl) return;
    termTabsEl.innerHTML = "";
    for (const t of terminals.values()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `term-tab${t.id === activeTermId ? " active" : ""}`;
      btn.dataset.id = t.id;
      btn.innerHTML = `
        <span class="term-tab-title">${escapeHtml(t.title)}</span>
        <span class="term-tab-close" data-close="${t.id}" title="Kill Terminal">×</span>
      `;
      btn.addEventListener("click", (e) => {
        if (e.target.closest("[data-close]")) {
          e.stopPropagation();
          killTerminal(t.id);
          return;
        }
        focusTerminal(t.id);
      });
      termTabsEl.appendChild(btn);
    }
    $("#btn-term-split")?.classList.toggle("active", isSplitOn());
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Light inline formatting only (no block-level markdown): `code` and
  // **bold** — enough for subject descriptions without pulling in a full
  // markdown parser.
  function renderInlineMd(s) {
    return escapeHtml(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function renderSubjectHtml(subject) {
    if (!subject) return `<p class="subject-empty">No subject.</p>`;
    if (typeof subject === "string") {
      // Legacy plain-text fallback.
      return `<pre class="subject-plain">${escapeHtml(subject)}</pre>`;
    }
    const parts = [];
    parts.push(`<h1 class="subject-title">${escapeHtml(subject.name)}</h1>`);
    parts.push(`
      <dl class="subject-meta">
        <dt>Expected files</dt><dd>${escapeHtml(subject.filename)}</dd>
        <dt>Allowed functions</dt><dd>${escapeHtml(subject.allowed)}</dd>
      </dl>
    `);
    if (subject.description) {
      parts.push(`<p class="subject-desc">${renderInlineMd(subject.description)}</p>`);
    }
    if (subject.prototype) {
      parts.push(`<h2>Prototype</h2><pre class="subject-code"><code>${escapeHtml(subject.prototype)}</code></pre>`);
    }
    if (subject.notes && subject.notes.length) {
      parts.push(`<h2>Notes</h2><ul class="subject-notes">${subject.notes.map((n) => `<li>${renderInlineMd(n)}</li>`).join("")}</ul>`);
    }
    if (subject.hint) {
      parts.push(`<blockquote class="subject-hint"><strong>Tip:</strong> ${renderInlineMd(subject.hint)}</blockquote>`);
    }
    if (subject.examples) {
      parts.push(`<h2>Examples</h2><pre class="subject-examples">${escapeHtml(subject.examples)}</pre>`);
    }
    return parts.join("\n");
  }

  function ensureSashListeners() {
    if (sashListenersBound) return;
    sashListenersBound = true;
    document.addEventListener("mouseup", () => {
      sashDragging = false;
    });
    document.addEventListener("mousemove", (e) => {
      if (!sashDragging || !termPanelsEl?.classList.contains("split")) return;
      const rect = termPanelsEl.getBoundingClientRect();
      const mobile = window.matchMedia("(max-width: 900px)").matches;
      if (mobile) {
        const pct = Math.max(25, Math.min(75, ((e.clientY - rect.top) / rect.height) * 100));
        termPanelsEl.style.gridTemplateColumns = "1fr";
        termPanelsEl.style.gridTemplateRows = `${pct}% 4px ${100 - pct}%`;
      } else {
        const pct = Math.max(25, Math.min(75, ((e.clientX - rect.left) / rect.width) * 100));
        termPanelsEl.style.gridTemplateColumns = `${pct}% 4px ${100 - pct}%`;
        termPanelsEl.style.gridTemplateRows = "1fr";
      }
    });
  }

  function layoutPanels() {
    if (!termPanelsEl) return;
    if (!terminals.size) return;

    if (splitPair) {
      splitPair = splitPair.filter((id) => terminals.has(id));
      if (splitPair.length === 1) {
        activeTermId = splitPair[0];
        splitPair = null;
      } else if (splitPair.length !== 2 || splitPair[0] === splitPair[1]) {
        splitPair = null;
      }
    }

    const splitOn = isSplitOn();
    termPanelsEl.classList.toggle("split", splitOn);
    termPanelsEl.querySelectorAll(".term-split-sash").forEach((n) => n.remove());

    for (const t of terminals.values()) {
      t.panel.classList.remove("visible", "focused");
    }

    if (!activeTermId || !terminals.has(activeTermId)) {
      activeTermId = shellTermId || [...terminals.keys()][0];
    }

    if (splitOn) {
      if (!splitPair.includes(activeTermId)) activeTermId = splitPair[0];
      const left = terminals.get(splitPair[0]);
      const right = terminals.get(splitPair[1]);
      left.panel.classList.add("visible");
      right.panel.classList.add("visible");
      markFocused(activeTermId);

      ensureSashListeners();
      const sash = document.createElement("div");
      sash.className = "term-split-sash";
      sash.addEventListener("mousedown", (e) => {
        sashDragging = true;
        e.preventDefault();
      });
      // Keep pane order stable (left | sash | right)
      termPanelsEl.appendChild(left.panel);
      termPanelsEl.appendChild(sash);
      termPanelsEl.appendChild(right.panel);
    } else {
      const primary = terminals.get(activeTermId) || shellTerm();
      if (!primary) return;
      primary.panel.classList.add("visible", "focused");
      termPanelsEl.style.gridTemplateColumns = "";
      termPanelsEl.style.gridTemplateRows = "";
    }

    renderTermTabs();
  }

  function focusTerminal(id) {
    if (!terminals.has(id)) return;
    let needLayout = false;

    if (isSplitOn()) {
      if (!splitPair.includes(id)) {
        const side = splitPair.indexOf(activeTermId);
        splitPair[side >= 0 ? side : 0] = id;
        needLayout = true;
      }
    } else if (activeTermId !== id) {
      needLayout = true;
    } else {
      const t = terminals.get(id);
      if (!t.panel.classList.contains("visible")) needLayout = true;
    }

    activeTermId = id;
    if (needLayout) layoutPanels();
    else {
      markFocused(id);
      renderTermTabs();
    }
    promptLabel();
    focusInputEl(terminals.get(id)?.input);
  }

  function killTerminal(id) {
    const t = terminals.get(id);
    if (!t) return;
    if (t.kind === "examshell" && terminals.size === 1) {
      tprint(t, "Cannot kill the last examshell terminal.", "warn");
      return;
    }
    if (t.kind === "examshell" && [...terminals.values()].filter((x) => x.kind === "examshell").length <= 1) {
      tprint(t, "Keep at least one examshell terminal.", "warn");
      return;
    }
    t.panel.remove();
    terminals.delete(id);
    if (splitPair?.includes(id)) {
      const other = splitPair.find((x) => x !== id);
      splitPair = null;
      if (activeTermId === id) activeTermId = other || shellTermId || [...terminals.keys()][0];
    } else if (activeTermId === id) {
      activeTermId = shellTermId || [...terminals.keys()][0];
    }
    layoutPanels();
    focusInputEl(activeTerm()?.input);
  }

  function newTestTerminal(opts = {}) {
    const n = [...terminals.values()].filter((t) => t.kind === "test").length + 1;
    const t = createTerminal("test", `Test-${n}`, { activate: opts.activate !== false });
    tprint(t, "Test terminal — compile & run your editor code (with main) before grademe.", "info");
    tprint(t, "Commands: run · clear · help", "dim");
    tprint(t, "Tip: add a temporary main in the editor to test, remove it before grademe.", "dim");
    t.cwd.textContent = "test>";
    return t;
  }

  /* ── man pages: quick reference, opens in its own terminal tab ── */
  const MAN_PAGES = {
    write: `WRITE(2)                     Poolers manual                     WRITE(2)

NAME
    write - write to a file descriptor

SYNOPSIS
    #include <unistd.h>
    ssize_t write(int fd, const void *buf, size_t count);

DESCRIPTION
    Writes up to count bytes from buf to the file descriptor fd.
    fd 1 is standard output (stdout), fd 2 is standard error (stderr).

RETURN VALUE
    On success, the number of bytes actually written (may be less
    than count). On error, -1.

EXAMPLE
    write(1, "Hi\\n", 3);`,
    malloc: `MALLOC(3)                    Poolers manual                    MALLOC(3)

NAME
    malloc - allocate memory

SYNOPSIS
    #include <stdlib.h>
    void *malloc(size_t size);

DESCRIPTION
    Allocates size bytes of uninitialized memory on the heap.

RETURN VALUE
    A pointer to the allocated memory, or NULL if allocation failed.
    Always check for NULL before use. Free with free() when done.`,
    free: `FREE(3)                      Poolers manual                      FREE(3)

NAME
    free - deallocate memory

SYNOPSIS
    #include <stdlib.h>
    void free(void *ptr);

DESCRIPTION
    Frees the memory allocated by malloc/calloc/realloc at ptr.
    Freeing NULL is a no-op. Freeing the same pointer twice, or using
    memory after it's freed, is undefined behavior.`,
    gcc: `GCC(1)                       Poolers manual                       GCC(1)

NAME
    gcc - GNU C compiler (as used by grademe)

SYNOPSIS
    gcc -Wall -Wextra -Werror -o program file.c

DESCRIPTION
    -Wall -Wextra   enable common + extra warnings
    -Werror         treat every warning as a hard error
    This is the 1337/42 norm baseline — the same flags grademe
    compiles your submission with.`,
    examshell: `EXAMSHELL(1)                 Poolers manual                 EXAMSHELL(1)

NAME
    examshell - Poolers 42-style timed exam shell

SEE ALSO
    Type 'help' in the exam terminal for the full command list.`,
  };

  function asciiManText() {
    const ctrlNames = {
      0: "NUL", 1: "SOH", 2: "STX", 3: "ETX", 4: "EOT", 5: "ENQ", 6: "ACK", 7: "BEL",
      8: "BS", 9: "TAB", 10: "LF", 11: "VT", 12: "FF", 13: "CR", 14: "SO", 15: "SI",
      16: "DLE", 17: "DC1", 18: "DC2", 19: "DC3", 20: "DC4", 21: "NAK", 22: "SYN", 23: "ETB",
      24: "CAN", 25: "EM", 26: "SUB", 27: "ESC", 28: "FS", 29: "GS", 30: "RS", 31: "US",
      127: "DEL",
    };
    const label = (i) => (i === 32 ? "SPACE" : ctrlNames[i] || `'${String.fromCharCode(i)}'`);
    const cell = (i) => `${String(i).padStart(3)}  0x${i.toString(16).padStart(2, "0")}  ${label(i).padEnd(7)}`;
    const rows = [];
    for (let r = 0; r < 32; r++) {
      const cols = [];
      for (let c = 0; c < 4; c++) {
        const i = r + c * 32;
        if (i <= 127) cols.push(cell(i));
      }
      rows.push(cols.join("  "));
    }
    return [
      "ASCII(7)                     Poolers manual                     ASCII(7)",
      "",
      "NAME",
      "    ascii - table of ASCII characters (0-127)",
      "",
      "DEC  HEX  CHAR    DEC  HEX  CHAR    DEC  HEX  CHAR    DEC  HEX  CHAR",
      ...rows,
    ].join("\n");
  }

  function manTopics() {
    return Object.keys(MAN_PAGES).concat("ascii").sort();
  }

  function manPageText(topic) {
    if (topic === "ascii") return asciiManText();
    return MAN_PAGES[topic] || null;
  }

  function renderManPage(term, topic) {
    term.out.innerHTML = "";
    if (!topic) {
      tprintBlock(term, `What manual page do you want?\nAvailable: ${manTopics().join(", ")}`, "dim");
      return;
    }
    const text = manPageText(topic);
    if (!text) {
      tprintBlock(term, `No manual entry for ${topic}\nAvailable: ${manTopics().join(", ")}`, "err");
      return;
    }
    tprintBlock(term, text, "banner");
  }

  function openManTerminal(topic) {
    const t = createTerminal("man", `man:${topic || "?"}`, { activate: true });
    t.cwd.textContent = "man>";
    renderManPage(t, topic);
    return t;
  }

  async function dispatchMan(term, raw) {
    const v = (raw || "").trim();
    if (!v) return;
    const parts = v.split(/\s+/);
    if (parts[0] === "clear") {
      term.out.innerHTML = "";
      return;
    }
    if (parts[0] === "man") {
      renderManPage(term, parts.slice(1).join(" ").toLowerCase());
      return;
    }
    tprint(term, `man: try 'man <topic>' or 'clear'. Available: ${manTopics().join(", ")}`, "dim");
  }

  function toggleSplit() {
    if (isSplitOn()) {
      splitPair = null;
      if (termPanelsEl) {
        termPanelsEl.style.gridTemplateColumns = "";
        termPanelsEl.style.gridTemplateRows = "";
      }
      layoutPanels();
      focusInputEl(activeTerm()?.input);
      return;
    }
    const keepId = activeTermId || shellTermId;
    let other = [...terminals.values()].find((t) => t.id !== keepId);
    if (!other) other = newTestTerminal({ activate: false });
    activeTermId = keepId;
    splitPair = [keepId, other.id];
    layoutPanels();
    focusInputEl(terminals.get(keepId)?.input);
  }

  function tprint(term, text, cls) {
    if (!term?.out) return;
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = text;
    term.out.appendChild(line);
    term.out.scrollTop = term.out.scrollHeight;
  }

  function tprintBlock(term, text, cls) {
    String(text).split("\n").forEach((l) => tprint(term, l || " ", cls));
  }

  async function dispatchTest(term, raw) {
    const line = String(raw || "").trim();
    tprint(term, `${term.cwd.textContent} ${line || ""}`, "dim");
    if (!line) return;
    const [cmd, ...rest] = line.split(/\s+/);
    const c = cmd.toLowerCase();
    if (c === "help" || c === "?") {
      tprintBlock(
        term,
        [
          "Test terminal (local gcc — not grademe)",
          "  run [args…]     compile editor code & run",
          "  clear           clear this terminal",
          "  help            this help",
          "",
          "Write a temporary int main in the editor to try your function,",
          "then remove main before grademe.",
        ].join("\n"),
        "dim"
      );
      return;
    }
    if (c === "clear" || c === "cls") {
      term.out.innerHTML = "";
      return;
    }
    if (c === "run" || c === "./a.out" || c === "gcc") {
      await runEditorTest(term, rest);
      return;
    }
    tprint(term, `command not found: ${cmd}  (try help | run)`, "err");
  }

  async function runEditorTest(term, args) {
    if (!editor) {
      tprint(term, "Open an exam assignment first (examshell).", "err");
      return;
    }
    const code = editor.getValue();
    if (!code.trim()) {
      tprint(term, "Editor is empty.", "err");
      return;
    }
    tprint(term, "$ gcc -Wall -Wextra -Werror -o program … && ./program", "dim");
    try {
      const res = await fetch("/api/compile-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, args: args || [], stdin: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const compile = (data.steps || []).find((s) => s.phase === "compile");
      if (compile && !compile.success) {
        tprintBlock(term, compile.stderr || data.compileError || compile.stdout || "compile failed", "err");
        return;
      }
      if (compile?.success) tprint(term, "✓ compile OK", "ok");
      const runStep = (data.steps || []).find((s) => s.phase === "run");
      if (runStep?.stderr) tprintBlock(term, runStep.stderr, "err");
      const out = data.stdout || "";
      if (out) tprintBlock(term, out, "banner");
      else if (!runStep?.stderr) tprint(term, "(no output)", "dim");
      if (data.exitCode != null) tprint(term, `[exit ${data.exitCode}]`, data.exitCode === 0 ? "ok" : "warn");
      if (runStep?.signal === "TIMEOUT") tprint(term, "[timeout]", "err");
    } catch (e) {
      tprint(term, `run error: ${e.message}`, "err");
    }
  }

  function onTermKeydown(term, e) {
    if (term.kind === "examshell") {
      if (e.key === "Tab") {
        e.preventDefault();
        handleTabComplete();
        return;
      }
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
        tabState = { stamp: 0, prefix: "" };
      }
    }
    const hist = term.history;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hist.length) return;
      if (term.histIdx === hist.length) term.histDraft = term.input.value;
      term.histIdx = Math.max(0, term.histIdx - 1);
      term.input.value = hist[term.histIdx] || "";
      const len = term.input.value.length;
      term.input.setSelectionRange(len, len);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!hist.length) return;
      term.histIdx = Math.min(hist.length, term.histIdx + 1);
      term.input.value = term.histIdx >= hist.length ? term.histDraft : hist[term.histIdx] || "";
      const len = term.input.value.length;
      term.input.setSelectionRange(len, len);
    }
  }

  // accessors used by rest of shell (examshell terminal)
  const getTermIn = () => shellTerm()?.input;
  const getTermCwd = () => shellTerm()?.cwd;

  // legacy aliases removed — use getTermIn / shellTerm


  const COMMANDS = [
    "examshell",
    "help",
    "rules",
    "status",
    "time",
    "timer",
    "date",
    "levels",
    "ls",
    "files",
    "man",
    "subject",
    "traces",
    "grade",
    "grademe",
    "clear",
    "leave",
    "abort",
    "playground",
    "start",
    "whoami",
    "pwd",
    "echo",
    "banner",
  ];
  const EXAM_IDS = ["exam00", "exam01", "exam02", "final", "1", "2", "3", "4"];
  const DIFFS = ["normal", "hard", "extreme", "1", "2", "3"];
  const YESNO = ["yes", "no", "y", "n"];

  const BANNER = `
╔══════════════════════════════════════════════════════════╗
║             P O O L E R S   E X A M   S H E L L          ║
║                    practice mode · local                 ║
╚══════════════════════════════════════════════════════════╝`.trim();

  const RULES = `
Exam rules (practice shell — inspired by 42 examshell)
─────────────────────────────────────────────────────
1. Start with: examshell
2. Choose an exam (exam00 / exam01 / exam02 / final)
3. Choose difficulty (normal / hard / extreme)
4. Timer: exam00–02 = 4h · final = 8h
5. Each level has a multi-exercise pool → you get 2 random
6. From level 5+: harder exercises (scaled by difficulty)
7. Clear both assignments to unlock the next level (10 levels)
8. Work only in the empty .c file — type by hand (no paste / drop)
9. Type grade (or Ctrl+Enter) to submit the current exercise

Commands
────────
  examshell / start   launch exam (or: start exam00 hard)
  help / rules        help & rules
  status              session overview
  time / timer        remaining time
  date                local date/time
  levels / files      progress / current files
  ls                  list current files (like a real ls)
  man <topic>         open a manual page (man ascii, man write, …)
  subject             focus subject pane
  traces              focus traces pane (past grademe attempts)
  grade / grademe     compile + grade
  whoami / pwd / echo shell extras
  clear / leave       clear terminal / abandon
`.trim();

  function sanitizeHist(arr) {
    return Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string" && x.trim()).slice(-HIST_MAX)
      : [];
  }

  function loadHistStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(HIST_STORE_KEY) || "null");
      if (raw && typeof raw === "object") {
        return {
          examshell: sanitizeHist(raw.examshell),
          test: sanitizeHist(raw.test),
        };
      }
    } catch (_) { }
    // migrate legacy single examshell list
    try {
      const legacy = JSON.parse(localStorage.getItem(HIST_KEY_LEGACY) || "[]");
      return { examshell: sanitizeHist(legacy), test: [] };
    } catch (_) {
      return { examshell: [], test: [] };
    }
  }

  function histForKind(kind) {
    return kind === "test" ? histStore.test : histStore.examshell;
  }

  function saveHistStore() {
    try {
      localStorage.setItem(
        HIST_STORE_KEY,
        JSON.stringify({
          examshell: histStore.examshell.slice(-HIST_MAX),
          test: histStore.test.slice(-HIST_MAX),
        })
      );
      // keep legacy key in sync for older tooling / bookmarks
      localStorage.setItem(HIST_KEY_LEGACY, JSON.stringify(histStore.examshell.slice(-HIST_MAX)));
    } catch (_) { }
  }

  function pushHistory(term, line) {
    const v = String(line || "").trim();
    if (!v || !term) return;
    const hist = term.history;
    if (hist.length && hist[hist.length - 1] === v) {
      for (const t of terminals.values()) {
        if (t.kind === term.kind) {
          t.histIdx = hist.length;
          t.histDraft = "";
        }
      }
      return;
    }
    hist.push(v);
    while (hist.length > HIST_MAX) hist.shift();
    for (const t of terminals.values()) {
      if (t.kind === term.kind) {
        t.history = hist;
        t.histIdx = hist.length;
        t.histDraft = "";
      }
    }
    saveHistStore();
  }

  function formatDuration(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function print(text, cls) {
    tprint(shellTerm(), text, cls);
  }

  function printHtml(html) {
    const term = shellTerm();
    if (!term?.out) return;
    const line = document.createElement("div");
    line.innerHTML = html;
    term.out.appendChild(line);
    term.out.scrollTop = term.out.scrollHeight;
  }

  function printBlock(text, cls) {
    String(text).split("\n").forEach((l) => print(l || " ", cls));
  }

  function promptLabel() {
    const cwd = getTermCwd();
    if (!cwd) return;
    if (gradeWait) {
      cwd.textContent = "...>";
      return;
    }
    const s = PoolersExam.getSession();
    if (s && s.status === "active") {
      cwd.textContent = `exam/${s.examId}>`;
    } else if (wizard) {
      cwd.textContent = "?>";
    } else {
      cwd.textContent = "$";
    }
  }

  function waitForEnter(hint) {
    return new Promise((resolve) => {
      gradeWait = { resolve };
      // ensure examshell is focused for the prompt
      if (shellTermId) focusTerminal(shellTermId);
      print("");
      print(hint || "Press enter to continue...", "warn");
      promptLabel();
      getTermIn()?.focus();
    });
  }

  async function finishGradeWait() {
    if (!gradeWait) return;
    const { resolve } = gradeWait;
    gradeWait = null;
    promptLabel();
    resolve();
  }

  function setUiActive(on) {
    shellMain.classList.toggle("exam-on", on);
    workspace.classList.toggle("hidden", !on);
    termResize?.classList.toggle("hidden", !on);
    btnGrade.classList.toggle("hidden", !on);
    btnLeave?.classList.toggle("hidden", !on);
    $("#btn-toggle-subject")?.classList.toggle("hidden", !on);
    $("#btn-toggle-terminal")?.classList.toggle("hidden", !on);
    if (!on) {
      // leaving an exam must not strand the shell in a collapsed state
      $("#shell")?.classList.remove("subject-hidden", "terminal-hidden");
      $("#passed-viewer")?.classList.add("hidden");
    }
    renderLevelRail();
    const s = PoolersExam.getSession();
    shellStatus.classList.remove("idle", "active", "passed");
    if (on && s) {
      shellStatus.textContent = `${s.title || "exam"} · ${s.difficultyTitle || s.difficulty || ""} · L${s.level}`;
      shellStatus.classList.add(s.status === "passed" ? "passed" : "active");
    } else if (s?.status === "passed") {
      shellStatus.textContent = "passed";
      shellStatus.classList.add("passed");
    } else if (s?.status === "expired") {
      shellStatus.textContent = "expired";
      shellStatus.classList.add("idle");
    } else {
      shellStatus.textContent = "idle";
      shellStatus.classList.add("idle");
    }
    promptLabel();
    syncTimerUi();
    syncScoreUi();
    updateTracesBadge();
  }

  /* Level rail — the exam's shape at a glance in the top bar: one segment per
     level, filled as levels are cleared, amber on the one you're sitting in. */
  function renderLevelRail() {
    if (!levelRail) return;
    const s = PoolersExam.getSession();
    const levels = s?.levels;
    const show = !!(s && levels?.length && ["active", "passed", "cheated"].includes(s.status));
    levelRail.classList.toggle("hidden", !show);
    if (!show) return;

    const track = $("#rail-track");
    if (track && track.childElementCount !== levels.length) {
      track.innerHTML = levels.map(() => `<span class="rail-step"></span>`).join("");
    }
    track?.querySelectorAll(".rail-step").forEach((el, i) => {
      const lv = levels[i];
      el.classList.toggle("done", !!lv?.complete);
      el.classList.toggle("current", i === s.level && !lv?.complete);
      el.title = `L${i}${lv?.complete ? " · cleared" : i === s.level ? " · current" : ""}`;
    });

    const cap = $("#rail-cap");
    if (cap) cap.textContent = `L${s.level}`;
    const total = $("#rail-total");
    if (total) total.textContent = `/ ${levels.length}`;
  }

  function syncScoreUi() {
    const s = PoolersExam.getSession();
    if (!scoreChip) return;
    const show = !!(s && ["active", "passed", "cheated"].includes(s.status) && s.maxScore != null);
    scoreChip.classList.toggle("hidden", !show);
    scoreChip.classList.toggle("danger", s?.status === "cheated");
    if (show) scoreChip.textContent = `${s.score ?? 0}/${s.maxScore} pts`;
  }

  function updateTracesBadge() {
    if (!tracesBadge) return;
    const s = PoolersExam.getSession();
    const total = s?.tracesCount ?? 0;
    const unseen = Math.max(0, total - tracesSeenCount);
    tracesBadge.textContent = unseen > 9 ? "9+" : String(unseen);
    tracesBadge.classList.toggle("hidden", unseen <= 0);
  }

  function syncTimerUi() {
    const s = PoolersExam.getSession();
    if (!timerChip) return;
    const active = !!(s && s.status === "active" && s.deadline);
    timerChip.classList.toggle("hidden", !active);
    if (!active) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      return;
    }
    const tick = () => {
      const sess = PoolersExam.getSession();
      if (!sess || sess.status !== "active" || !sess.deadline) {
        timerChip.classList.add("hidden");
        return;
      }
      const left = Math.max(0, Date.parse(sess.deadline) - Date.now());
      // keep client remainingMs fresh for `time` command
      sess.remainingMs = left;
      timerChip.textContent = formatDuration(left);
      timerChip.classList.toggle("warn", left <= 30 * 60 * 1000 && left > 10 * 60 * 1000);
      timerChip.classList.toggle("danger", left <= 10 * 60 * 1000);
      if (left <= 0 && !expiredNotified) {
        expiredNotified = true;
        sess.status = "expired";
        print("Time is up — exam expired. Type examshell to start again.", "err");
        setUiActive(false);
        shellStatus.textContent = "expired";
      }
    };
    tick();
    if (!timerInterval) timerInterval = setInterval(tick, 1000);
  }

  function flagCheat(kind, detail) {
    if (kind === "paste") cheatFlags.paste = true;
    if (kind === "drop") cheatFlags.drop = true;
    print(`CHEAT blocked: ${detail || kind}. Write the code yourself.`, "err");
  }

  function resetCheatFlags() {
    cheatFlags = { paste: false, drop: false };
  }

  function bindEditorAntiCheat() {
    const wrap = editorWrap || $("#exam-editor");
    if (!wrap || !editor || wrap.dataset.antiCheatBound) return;
    wrap.dataset.antiCheatBound = "1";

    const block = (e, kind, msg) => {
      e.preventDefault();
      e.stopPropagation();
      flagCheat(kind, msg);
    };

    // Block native paste / drop on the editor host
    wrap.addEventListener("paste", (e) => block(e, "paste", "paste is not allowed"), true);
    wrap.addEventListener("drop", (e) => block(e, "drop", "drop is not allowed"), true);
    wrap.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "none";
      dropOverlay?.classList.remove("hidden");
      dropOverlay && (dropOverlay.textContent = "Drop not allowed — type your code");
    });
    wrap.addEventListener("dragleave", (e) => {
      if (!wrap.contains(e.relatedTarget)) dropOverlay?.classList.add("hidden");
    });
    wrap.addEventListener("dragend", () => dropOverlay?.classList.add("hidden"));

    // Block Ctrl/Cmd+V and Shift+Insert
    editor.onKeyDown((e) => {
      const v = e.keyCode === monaco.KeyCode.KeyV;
      const insert = e.keyCode === monaco.KeyCode.Insert;
      if ((e.ctrlKey || e.metaKey) && v) {
        e.preventDefault();
        e.stopPropagation();
        flagCheat("paste", "Ctrl/Cmd+V paste blocked");
      }
      if (e.shiftKey && insert) {
        e.preventDefault();
        e.stopPropagation();
        flagCheat("paste", "Shift+Insert paste blocked");
      }
    });

    // Catch large multi-line inserts (paste that slipped through)
    editor.onDidChangeModelContent((ev) => {
      if (loadingCode) return;
      for (const ch of ev.changes || []) {
        const text = ch.text || "";
        if (text.length >= 32 && /\n/.test(text)) {
          flagCheat("paste", "bulk insert looks like paste");
          // undo the insert
          try {
            editor.trigger("anti-cheat", "undo", null);
          } catch (_) { }
          break;
        }
      }
    });

    dropOverlay?.classList.add("hidden");
  }

  function ensureMonaco() {
    if (editor) return Promise.resolve(editor);
    if (monacoReady) return monacoReady;
    monacoReady = new Promise((resolve) => {
      require.config({
        paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
      });
      require(["vs/editor/editor.main"], () => {
        if (window.AtomOneDark) AtomOneDark.define(monaco, { background: "#0b0d10" });
        else {
          monaco.editor.defineTheme("atom-one-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: { "editor.background": "#0b0d10", "editor.foreground": "#abb2bf" },
          });
        }
        editor = monaco.editor.create($("#exam-editor"), {
          value: "",
          language: "c",
          theme: "atom-one-dark",
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', Consolas, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "all",
          wordWrap: "off",
          dragAndDrop: false,
          contextmenu: true,
        });
        editor.onDidChangeModelContent(() => {
          clearTimeout(autosaveTimer);
          autosaveTimer = setTimeout(saveCurrent, 500);
        });
        bindEditorAntiCheat();
        resolve(editor);
      });
    });
    return monacoReady;
  }

  async function saveCurrent() {
    const s = PoolersExam.getSession();
    if (!s?.current || !editor) return;
    try {
      await PoolersExam.saveFile(s.current.filename, editor.getValue());
    } catch (_) { }
  }

  function showSubjectTab(tab) {
    if (!subjectTabsEl) return;
    subjectTabsEl.querySelectorAll(".subject-tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    subjectView.classList.toggle("hidden", tab !== "subject");
    tracesView?.classList.toggle("hidden", tab !== "traces");
    passedView?.classList.toggle("hidden", tab !== "files");
    if (tab === "traces") {
      renderTracesList();
      tracesSeenCount = PoolersExam.getSession()?.tracesCount ?? tracesSeenCount;
      updateTracesBadge();
    } else if (tab === "files") {
      renderPassedList();
    }
  }

  async function renderTracesList() {
    if (!tracesView) return;
    tracesView.innerHTML = `<p class="traces-empty">Loading traces…</p>`;
    try {
      const data = await PoolersExam.fetchTraces();
      if (data.disabled) {
        tracesView.innerHTML = `<p class="traces-empty">${escapeHtml(data.message || "No traces for this exam.")}</p>`;
        return;
      }
      if (!data.traces || !data.traces.length) {
        tracesView.innerHTML = `<p class="traces-empty">No traces yet — run grademe to record one.</p>`;
        return;
      }
      const items = data.traces
        .slice()
        .reverse()
        .map((t) => {
          const badge = t.passed ? `<span class="trace-badge ok">OK</span>` : `<span class="trace-badge ko">KO</span>`;
          const time = new Date(t.at).toLocaleTimeString();
          return `
            <button type="button" class="trace-item" data-trace-id="${escapeHtml(t.id)}">
              <span class="trace-name">${escapeHtml(t.filename)}</span>
              <span class="trace-meta">${escapeHtml(t.exercise)} · ${escapeHtml(time)}</span>
              ${badge}
            </button>`;
        })
        .join("");
      tracesView.innerHTML = `<div class="trace-list">${items}</div>`;
      tracesView.querySelectorAll("[data-trace-id]").forEach((btn) => {
        btn.addEventListener("click", () => renderTraceDetail(btn.dataset.traceId));
      });
    } catch (e) {
      tracesView.innerHTML = `<p class="traces-empty">Failed to load traces: ${escapeHtml(e.message)}</p>`;
    }
  }

  async function renderTraceDetail(traceId) {
    if (!tracesView) return;
    tracesView.innerHTML = `<p class="traces-empty">Loading…</p>`;
    try {
      const t = await PoolersExam.fetchTrace(traceId);
      const badge = t.passed ? `<span class="trace-badge ok">OK</span>` : `<span class="trace-badge ko">KO</span>`;
      const testBody = t.passed
        ? `<pre class="trace-output">${escapeHtml(t.got)}</pre>`
        : `
          <div class="trace-diff">
            <div class="trace-diff-row expected">
              <span class="trace-diff-marker">++</span>
              <pre>${escapeHtml(t.expected)}</pre>
            </div>
            <div class="trace-diff-row got">
              <span class="trace-diff-marker">--</span>
              <pre>${escapeHtml(t.got)}</pre>
            </div>
          </div>`;
      tracesView.innerHTML = `
        <button type="button" class="trace-back" id="trace-back-btn">← traces</button>
        <div class="trace-detail">
          <dl>
            <dt>file</dt><dd>${escapeHtml(t.filename)}</dd>
            <dt>exercise</dt><dd>${escapeHtml(t.exercise)}</dd>
            <dt>tested</dt><dd>${escapeHtml(t.tested)}</dd>
          </dl>
          <div class="trace-test">
            <div class="trace-test-head">
              <span class="trace-test-label">Test 0</span>
              ${badge}
            </div>
            ${testBody}
          </div>
        </div>`;
      $("#trace-back-btn")?.addEventListener("click", () => renderTracesList());
    } catch (e) {
      tracesView.innerHTML = `<p class="traces-empty">Failed to load trace: ${escapeHtml(e.message)}</p>`;
    }
  }

  subjectTabsEl?.addEventListener("click", (e) => {
    const btn = e.target.closest(".subject-tab");
    if (!btn) return;
    showSubjectTab(btn.dataset.tab);
  });

  async function loadAssignment() {
    const s = PoolersExam.getSession();
    if (!s?.current) return;
    await ensureMonaco();
    resetCheatFlags();
    loadingCode = true;
    try {
      const file = await PoolersExam.fetchCurrentFile();
      editor.setValue(file.content || "");
    } finally {
      loadingCode = false;
    }
    codeFilename.textContent = s.current.filename;
    levelPill.textContent = `L${s.level} · ${s.currentProgress.passed + 1}/${s.currentProgress.total}`;
    dayPill.textContent = s.current.day || s.current.origin || "exam";
    subjectView.innerHTML = renderSubjectHtml(s.current.subject);
    showSubjectTab("subject");
    setUiActive(true);
    const allowed = (s.current.allowedFuncs && s.current.allowedFuncs.length)
      ? s.current.allowedFuncs.join(", ")
      : "None";
    printBlock(
      [
        "",
        `======= Assignment =======`,
        `Exam      : ${s.title} (${s.difficultyTitle})`,
        `Level     : ${s.level} / ${(s.levelCount || 10) - 1}`,
        `Score     : ${s.score ?? 0} / ${s.maxScore ?? "?"} pts`,
        `Exercise  : ${s.current.name}`,
        `File      : ${s.current.filename}`,
        `Allowed   : ${allowed}`,
        `Progress  : ${s.currentProgress.passed}/${s.currentProgress.total} cleared this level`,
        `Time left : ${s.remainingMs != null ? formatDuration(s.remainingMs) : formatDuration(Math.max(0, Date.parse(s.deadline) - Date.now()))}`,
        `==========================`,
        `Type your code by hand (paste/drop = cheat → KO).`,
        `When ready: grademe`,
        "",
      ].join("\n"),
      "info"
    );
  }

  async function startExam(examId, difficulty) {
    print(`Starting ${examId} [${difficulty}]…`, "dim");
    expiredNotified = false;
    tracesSeenCount = 0;
    const s = await PoolersExam.start(examId, difficulty);
    printBlock(
      [
        "",
        ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
        `  EXAM STARTED — ${s.title} · ${s.difficultyTitle}`,
        `  Duration     — ${s.durationHours || (s.examId === "final" ? 8 : 4)}h`,
        `  Deadline     — ${s.deadline ? new Date(s.deadline).toLocaleString() : "n/a"}`,
        `  Scoring      — ${s.scorePerLevel} pts/level · ${s.maxScore} pts total`,
        "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
        s.message || "",
        "",
      ].join("\n"),
      "ok"
    );
    await loadAssignment();
  }

  function beginWizard() {
    wizard = { step: "exam", examId: null, difficulty: null };
    printBlock(
      [
        "",
        "examshell",
        "---------",
        "Available exams:",
        "  1) exam00   — C00 display / basics     (4h)",
        "  2) exam01   — pointers & strings       (4h)",
        "  3) exam02   — atoi / recursion / primes (4h)",
        "  4) final    — mixed review             (8h)",
        "",
        "Select exam (1-4 or name):",
      ].join("\n"),
      "banner"
    );
    promptLabel();
  }

  async function handleWizard(input) {
    const v = input.trim().toLowerCase();
    if (!v) return;

    if (wizard.step === "exam") {
      const map = {
        "1": "exam00", exam00: "exam00",
        "2": "exam01", exam01: "exam01",
        "3": "exam02", exam02: "exam02",
        "4": "final", final: "final",
      };
      const id = map[v];
      if (!id) {
        print("Invalid choice. Enter 1-4 or exam00/exam01/exam02/final.", "err");
        return;
      }
      wizard.examId = id;
      wizard.step = "diff";
      printBlock(
        [
          "",
          `Selected: ${id}`,
          "Difficulty:",
          "  1) normal   — classic pacing",
          "  2) hard     — tougher earlier",
          "  3) extreme  — densest pools",
          "",
          "Select difficulty (1-3 or name):",
        ].join("\n"),
        "banner"
      );
      promptLabel();
      return;
    }

    if (wizard.step === "diff") {
      const map = {
        "1": "normal", normal: "normal",
        "2": "hard", hard: "hard",
        "3": "extreme", extreme: "extreme",
      };
      const d = map[v];
      if (!d) {
        print("Invalid difficulty. Enter 1-3 or normal/hard/extreme.", "err");
        return;
      }
      wizard.difficulty = d;
      wizard.step = "confirm";
      printBlock(
        [
          "",
          `You are about to start ${wizard.examId} (${d}).`,
          "Type yes to begin, or no to cancel.",
        ].join("\n"),
        "warn"
      );
      promptLabel();
      return;
    }

    if (wizard.step === "confirm") {
      if (v === "yes" || v === "y") {
        const { examId, difficulty } = wizard;
        wizard = null;
        promptLabel();
        try {
          await startExam(examId, difficulty);
        } catch (e) {
          print(`Failed: ${e.message}`, "err");
          setUiActive(false);
        }
      } else {
        print("Cancelled.", "dim");
        wizard = null;
        promptLabel();
      }
    }
  }

  function printExamStatus(s, opts) {
    const sess = s || PoolersExam.getSession();
    if (!sess) {
      print("No exam session.", "dim");
      return;
    }
    const left =
      sess.remainingMs != null
        ? sess.remainingMs
        : sess.deadline
          ? Math.max(0, Date.parse(sess.deadline) - Date.now())
          : null;
    const prog = sess.currentProgress;
    const header = (opts && opts.header) || "status";

    printBlock(
      [
        "",
        `============= ${header} =============`,
        `  exam          : ${sess.title || sess.examId}`,
        `  difficulty    : ${sess.difficultyTitle || sess.difficulty || "normal"}`,
        `  status        : ${sess.status}`,
        `  level         : ${sess.level} / ${(sess.levelCount || 10) - 1}`,
        `  score         : ${sess.score ?? 0} / ${sess.maxScore ?? "?"} pts (${sess.scorePerLevel ?? "?"} pts/level)`,
        `  assignment    : ${sess.current ? sess.current.name : "(none)"}`,
        `  file          : ${sess.current ? sess.current.filename : "(none)"}`,
        `  level prog    : ${prog ? `${prog.passed}/${prog.total}` : "n/a"}`,
        `  time left     : ${left != null ? formatDuration(left) : "n/a"}`,
        `  end at        : ${sess.deadline ? new Date(sess.deadline).toLocaleString() : "n/a"}`,
        sess.message ? `  note          : ${sess.message}` : null,
        `====================================`,
        "",
      ]
        .filter((l) => l != null)
        .join("\n"),
      "info"
    );
  }

  async function cmdGrade() {
    const s = PoolersExam.getSession();
    if (!s || s.status !== "active" || !s.current) {
      print("No active assignment. Run examshell first.", "err");
      return;
    }
    if (gradeWait) {
      print("Finish the current grade prompt first (press enter).", "warn");
      return;
    }

    await ensureMonaco();
    await saveCurrent();

    const exercise = s.current.name;
    const filename = s.current.filename;

    printBlock(
      [
        "",
        "========================================",
        "              g r a d e m e",
        "========================================",
        `exercise : ${exercise}`,
        `file     : ${filename}`,
        "",
      ].join("\n"),
      "banner"
    );
    print("moulinette is grading…", "dim");

    try {
      const result = await PoolersExam.grade(filename, editor.getValue(), {
        paste: !!cheatFlags.paste,
        drop: !!cheatFlags.drop,
      });
      const next = PoolersExam.getSession();
      const out = String(result.output || "").trim();

      resetCheatFlags();
      updateTracesBadge();

      if (result.cheated || next?.status === "cheated") {
        print("");
        if (out) printBlock(out, "err");
        print("");
        printBlock(
          [
            "  #####    #      #####  ",
            "  #    #  # #     #    # ",
            "     #   #   #        #  ",
            "    #   #######       #  ",
            "   #    #     #      #   ",
            "  ##### #     # #####    ",
          ].join("\n"),
          "err"
        );
        print("");
        print("This exam session has been ended for cheating and cannot be resumed.", "err");
        setUiActive(false);
        shellStatus.textContent = "-42 cheated";
        shellStatus.classList.remove("idle", "active", "passed");
        shellStatus.classList.add("cheated");
        return;
      }

      print("");
      if (out) printBlock(out, result.passed ? "ok" : "err");
      print("");

      if (result.passed) {
        printBlock(
          [
            ">>>>>>>>>>>>>>>>>>>>>>>>> SUCCESS <<<<<<<<<<<<<<<<<<<<<<<<<",
            "                         GRADE : OK",
            ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
          ].join("\n"),
          "ok"
        );
      } else {
        printBlock(
          [
            ">>>>>>>>>>>>>>>>>>>>>>>>> FAILURE <<<<<<<<<<<<<<<<<<<<<<<<<",
            "                         GRADE : KO",
            ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
          ].join("\n"),
          "err"
        );
      }

      if (next?.message) {
        print("");
        print(next.message, result.passed ? "info" : "warn");
      }

      await waitForEnter("Press enter to continue...");

      // Like real examshell: after Enter, show status
      printExamStatus(next, {
        header: result.passed ? "status (after OK)" : "status (after KO)",
      });

      if (result.stage === "cheat") {
        print("Remove forbidden calls / write code by hand, then grademe again.", "dim");
        promptLabel();
        return;
      }

      if (next?.status === "passed") {
        printBlock(
          [
            "",
            "******************************************",
            "*     SUCCESS — you cleared the exam     *",
            "******************************************",
            "",
          ].join("\n"),
          "ok"
        );
        setUiActive(false);
        shellStatus.textContent = "passed";
        shellStatus.classList.remove("idle", "active");
        shellStatus.classList.add("passed");
        return;
      }

      if (result.passed && next?.current) {
        await loadAssignment();
      } else if (next) {
        shellStatus.textContent = `${next.title} · ${next.difficultyTitle} · L${next.level}`;
        shellStatus.classList.remove("idle", "passed");
        shellStatus.classList.add("active");
        print("Fix your code and type grademe again.", "dim");
        promptLabel();
      }
    } catch (e) {
      print("");
      printBlock(
        [
          ">>>>>>>>>>>>>>>>>>>>>>>>> FAILURE <<<<<<<<<<<<<<<<<<<<<<<<<",
          "                         GRADE : KO",
          ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
        ].join("\n"),
        "err"
      );
      print(e.message, "err");
      await waitForEnter("Press enter to continue...");
      printExamStatus(PoolersExam.getSession(), { header: "status (after KO)" });
      if (/expired|time is up/i.test(e.message)) {
        expiredNotified = true;
        setUiActive(false);
        shellStatus.textContent = "expired";
      } else {
        promptLabel();
      }
    }
  }

  function cmdStatus() {
    printExamStatus(PoolersExam.getSession(), { header: "status" });
  }

  function cmdTime() {
    const s = PoolersExam.getSession();
    if (!s || s.status !== "active" || !s.deadline) {
      print("No active timed exam. Start with examshell.", "dim");
      return;
    }
    const left = Math.max(0, Date.parse(s.deadline) - Date.now());
    s.remainingMs = left;
    printBlock(
      [
        `now       : ${new Date().toLocaleString()}`,
        `started   : ${s.startedAt ? new Date(s.startedAt).toLocaleString() : "n/a"}`,
        `deadline  : ${new Date(s.deadline).toLocaleString()}`,
        `duration  : ${s.durationHours || "?"}h`,
        `remaining : ${formatDuration(left)}`,
      ].join("\n"),
      left <= 10 * 60 * 1000 ? "warn" : "info"
    );
  }

  function cmdLevels() {
    const s = PoolersExam.getSession();
    if (!s?.levels?.length) {
      print("No exam session.", "dim");
      return;
    }
    print("levels:", "dim");
    for (const lv of s.levels) {
      const mark = lv.complete ? "✓" : lv.locked ? "·" : lv.level === s.level ? ">" : " ";
      const ids = (lv.assigned || []).join(", ");
      print(`  ${mark} L${lv.level}  ${lv.passed.length}/${lv.assigned.length}  ${ids}`, lv.level === s.level ? "info" : "dim");
    }
  }

  function cmdFiles() {
    const s = PoolersExam.getSession();
    if (!s?.current) {
      print("No assignment.", "dim");
      return;
    }
    printBlock(
      [
        `rendu     : ${s.current.filename}  (left editor)`,
        `subject   : subject.md             (right pane)`,
        `day       : ${s.current.day || s.current.origin || "exam"}`,
      ].join("\n"),
      "info"
    );
  }

  function cmdLs() {
    const s = PoolersExam.getSession();
    if (!s?.current) {
      print("ls: not in an exam.", "err");
      return;
    }
    print(`${s.current.filename}  subject.md`, "info");
  }

  async function cmdLeave() {
    if (!PoolersExam.getSession()) {
      print("Nothing to leave.", "dim");
      return;
    }
    await PoolersExam.abandon();
    expiredNotified = false;
    setUiActive(false);
    if (editor) editor.setValue("");
    subjectView.innerHTML = "";
    print("Exam abandoned.", "warn");
  }

  async function dispatch(raw) {
    // After grademe: any Enter continues (ignore typed text)
    if (gradeWait) {
      await finishGradeWait();
      return;
    }

    const line = String(raw || "").trim();
    if (!line) return;

    print(`${getTermCwd()?.textContent || "$"} ${line}`, "dim");

    if (wizard) {
      await handleWizard(line);
      return;
    }

    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(" ").trim().toLowerCase();

    switch (cmd.toLowerCase()) {
      case "help":
      case "?":
        printBlock(RULES, "dim");
        break;
      case "rules":
        printBlock(RULES, "warn");
        break;
      case "examshell":
      case "exam":
        if (PoolersExam.isActive()) {
          print("Exam already active. Type leave first, or grade to continue.", "warn");
        } else {
          beginWizard();
        }
        break;
      case "start": {
        // shortcut: start exam00 hard
        const parts = arg.split(/\s+/).filter(Boolean);
        const examId = parts[0] || "exam00";
        const diff = parts[1] || "normal";
        try {
          await startExam(examId, diff);
        } catch (e) {
          print(e.message, "err");
        }
        break;
      }
      case "status":
      case "st":
        cmdStatus();
        break;
      case "time":
      case "timer":
      case "clock":
        cmdTime();
        break;
      case "date":
        print(new Date().toString(), "info");
        break;
      case "levels":
        cmdLevels();
        break;
      case "ls":
        cmdLs();
        break;
      case "files":
        cmdFiles();
        break;
      case "man": {
        const topic = rest.join(" ").trim().toLowerCase();
        openManTerminal(topic);
        break;
      }
      case "whoami":
        print("student", "ok");
        break;
      case "pwd":
        print(
          PoolersExam.isActive()
            ? `/exam/${PoolersExam.getSession().examId}/level_${PoolersExam.getSession().level}`
            : "/exam",
          "info"
        );
        break;
      case "echo":
        print(rest.join(" ") || "", "banner");
        break;
      case "subject":
        if (PoolersExam.getSession()?.current) {
          print(`Subject loaded for ${PoolersExam.getSession().current.name} (see right pane).`, "info");
          showSubjectTab("subject");
          subjectView.scrollTop = 0;
        } else print("No assignment.", "err");
        break;
      case "traces":
        if (PoolersExam.getSession()?.current) {
          print("Traces tab opened (see right pane).", "info");
          showSubjectTab("traces");
        } else print("No assignment.", "err");
        break;
      case "grade":
      case "grademe":
        await cmdGrade();
        break;
      case "clear":
      case "cls": {
        const out = shellTerm()?.out;
        if (out) out.innerHTML = "";
        break;
      }
      case "leave":
      case "abort":
      case "exit":
        await cmdLeave();
        break;
      case "playground":
      case "home":
        print("This is a standalone examshell build — no playground here.", "dim");
        break;
      case "banner":
        printBlock(BANNER, "banner");
        break;
      default:
        print(`command not found: ${cmd}  (try help)`, "err");
    }
  }

  function bootTerminal() {
    printBlock(BANNER, "banner");
    print("");
    print("Welcome, pooler.", "ok");
    print("This is a local practice examshell.", "dim");
    print("Type examshell to begin, or help for commands.", "info");
    print("");
    promptLabel();
    getTermIn()?.focus();
  }

  function longestCommonPrefix(items) {
    if (!items.length) return "";
    let p = items[0];
    for (let i = 1; i < items.length; i++) {
      while (!items[i].startsWith(p)) {
        p = p.slice(0, -1);
        if (!p) return "";
      }
    }
    return p;
  }

  /** Candidates for the token currently being typed (zsh-style). */
  function completionCandidates(value) {
    const raw = value;
    // wizard prompts: complete answers, not shell cmds
    if (wizard) {
      const token = raw.trim().toLowerCase();
      let pool = [];
      if (wizard.step === "exam") pool = EXAM_IDS;
      else if (wizard.step === "diff") pool = DIFFS;
      else if (wizard.step === "confirm") pool = YESNO;
      return {
        kind: "wizard",
        lead: "",
        before: "",
        token,
        matches: pool.filter((x) => x.startsWith(token)),
      };
    }

    const m = raw.match(/^(\s*)(.*)$/);
    const lead = m[1] || "";
    const rest = m[2] || "";
    const parts = rest.length ? rest.split(/\s+/) : [""];
    const completingFirst = parts.length === 1 && !/\s$/.test(raw);

    if (completingFirst) {
      const token = parts[0].toLowerCase();
      return {
        kind: "cmd",
        lead,
        before: "",
        token,
        matches: COMMANDS.filter((c) => c.startsWith(token)),
      };
    }

    // e.g. "start exam0" → complete exam id; "start exam00 n" → difficulty
    const cmd = parts[0].toLowerCase();
    const trailingSpace = /\s$/.test(raw);
    const token = trailingSpace ? "" : (parts[parts.length - 1] || "").toLowerCase();
    const beforeParts = trailingSpace ? parts : parts.slice(0, -1);
    const before = beforeParts.join(" ") + (beforeParts.length ? " " : "");

    let pool = [];
    if (cmd === "start") {
      if (beforeParts.length === 1) pool = EXAM_IDS;
      else if (beforeParts.length === 2) pool = DIFFS;
    }

    return {
      kind: "arg",
      lead,
      before,
      token,
      matches: pool.filter((x) => x.startsWith(token)),
    };
  }

  function applyCompletion(info, match, addSpace) {
    const input = getTermIn();
    if (!input) return;
    input.value = info.lead + info.before + match + (addSpace ? " " : "");
  }

  function listMatches(matches) {
    print(`  ${matches.join("  ")}`, "dim");
  }

  function handleTabComplete() {
    if (gradeWait) return;
    const input = getTermIn();
    if (!input) return;
    const info = completionCandidates(input.value);
    const { matches, token } = info;

    if (!matches.length) {
      tabState = { stamp: 0, prefix: "" };
      return;
    }

    if (matches.length === 1) {
      applyCompletion(info, matches[0], true);
      tabState = { stamp: 0, prefix: "" };
      return;
    }

    const lcp = longestCommonPrefix(matches);
    const now = Date.now();
    const sameCtx = tabState.prefix === token && now - tabState.stamp < 900;

    if (lcp.length > token.length) {
      applyCompletion(info, lcp, false);
      tabState = { stamp: now, prefix: lcp };
      return;
    }

    if (sameCtx || lcp === token || token === "") {
      listMatches(matches);
      tabState = { stamp: now, prefix: token };
      return;
    }

    tabState = { stamp: now, prefix: token };
  }

  btnGrade?.addEventListener("click", () => {
    if (gradeWait) {
      finishGradeWait();
      return;
    }
    if (shellTermId) focusTerminal(shellTermId);
    dispatch("grademe");
  });
  btnLeave?.addEventListener("click", () => {
    if (!PoolersExam.getSession()) return;
    if (!confirm("Leave the current exam?")) return;
    if (shellTermId) focusTerminal(shellTermId);
    dispatch("leave");
  });
  // Click empty terminal chrome → focus active input
  $("#term-wrap")?.addEventListener("click", (e) => {
    if (e.target.closest(".term-tabbar, .term-split-sash, button, a")) return;
    const panel = e.target.closest(".term-panel");
    if (panel?.dataset?.id && terminals.has(panel.dataset.id)) {
      focusTerminal(panel.dataset.id);
      return;
    }
    focusInputEl(activeTerm()?.input || shellTerm()?.input);
  });

  $("#btn-term-new")?.addEventListener("click", () => newTestTerminal());
  $("#btn-term-split")?.addEventListener("click", () => toggleSplit());
  $("#btn-term-kill")?.addEventListener("click", () => {
    if (activeTermId) killTerminal(activeTermId);
  });

  /* ── Pane visibility. These controls live on the panes themselves now, so
        the chevron always sits next to the thing it collapses. The arrow
        direction is flipped in CSS off the shell's state class. ── */
  function setSubjectHidden(hidden) {
    $("#shell")?.classList.toggle("subject-hidden", hidden);
    const btn = $("#btn-toggle-subject");
    if (btn) btn.title = hidden ? "Show subject pane" : "Collapse subject pane";
  }

  $("#btn-toggle-subject")?.addEventListener("click", () => {
    setSubjectHidden(!$("#shell")?.classList.contains("subject-hidden"));
  });
  $("#btn-restore-subject")?.addEventListener("click", () => setSubjectHidden(false));

  function setTerminalHidden(hidden) {
    $("#shell")?.classList.toggle("terminal-hidden", hidden);
    const btn = $("#btn-toggle-terminal");
    if (btn) btn.title = hidden ? "Expand terminal" : "Collapse terminal";
    if (!hidden) focusInputEl(activeTerm()?.input || shellTerm()?.input);
  }

  $("#btn-toggle-terminal")?.addEventListener("click", () => {
    setTerminalHidden(!$("#shell")?.classList.contains("terminal-hidden"));
  });

  // while collapsed, the leftover tab bar is itself the handle to reopen
  $("#term-tabbar")?.addEventListener("click", (e) => {
    if (!$("#shell")?.classList.contains("terminal-hidden")) return;
    if (e.target.closest("button")) return;
    setTerminalHidden(false);
  });

  /* ── Passed files (review past submissions) — rendered into the subject
        pane's "files" tab rather than a floating sidebar ── */
  async function renderPassedList() {
    const list = passedView;
    if (!list) return;
    list.innerHTML = `<p class="traces-empty">Loading…</p>`;
    try {
      const items = await PoolersExam.fetchPassed();
      if (!items.length) {
        list.innerHTML = `<p class="traces-empty">No passed exercises yet.</p>`;
        return;
      }
      list.innerHTML = items
        .map(
          (it) => `
            <button type="button" class="passed-item" data-id="${escapeHtml(it.id)}">
              <span class="passed-item-name">${escapeHtml(it.name)}</span>
              <span class="passed-item-level">L${it.level}</span>
            </button>`
        )
        .join("");
      list.querySelectorAll("[data-id]").forEach((btn) => {
        btn.addEventListener("click", () => openPassedViewer(btn.dataset.id));
      });
    } catch (e) {
      list.innerHTML = `<p class="traces-empty">Failed to load: ${escapeHtml(e.message)}</p>`;
    }
  }

  async function openPassedViewer(exerciseId) {
    const viewer = $("#passed-viewer");
    const title = $("#passed-viewer-title");
    const code = $("#passed-viewer-code");
    if (!viewer || !title || !code) return;
    viewer.classList.remove("hidden");
    title.textContent = "Loading…";
    code.textContent = "";
    try {
      const data = await PoolersExam.fetchPassedFile(exerciseId);
      title.textContent = data.filename;
      code.textContent = data.content;
    } catch (e) {
      title.textContent = "Error";
      code.textContent = e.message;
    }
  }

  $("#btn-close-viewer")?.addEventListener("click", () => {
    $("#passed-viewer")?.classList.add("hidden");
  });

  // code / subject split — always a vertical divider now that the shell is
  // desktop-only, so there is no row-split branch to pick between
  (() => {
    const handle = splitHandle;
    if (!handle || !workspace) return;
    let drag = false;
    handle.addEventListener("mousedown", (e) => {
      drag = true;
      e.preventDefault();
      document.body.style.cursor = "col-resize";
    });
    document.addEventListener("mouseup", () => {
      drag = false;
      document.body.style.cursor = "";
    });
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      const rect = workspace.getBoundingClientRect();
      const pct = Math.max(30, Math.min(72, ((e.clientX - rect.left) / rect.width) * 100));
      workspace.style.setProperty("--split", `${pct}%`);
    });
  })();

  // terminal height resize
  (() => {
    const handle = termResize;
    if (!handle || !shellMain) return;
    let drag = false;
    handle.addEventListener("mousedown", (e) => {
      drag = true;
      e.preventDefault();
      document.body.style.cursor = "row-resize";
    });
    document.addEventListener("mouseup", () => {
      drag = false;
      document.body.style.cursor = "";
    });
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      const rect = shellMain.getBoundingClientRect();
      const fromBottom = rect.bottom - e.clientY;
      const px = Math.max(140, Math.min(rect.height * 0.65, fromBottom));
      shellMain.style.setProperty("--term-h", `${Math.round(px)}px`);
    });
  })();

  // boot
  histStore = loadHistStore();
  createTerminal("examshell", "examshell");
  layoutPanels();

  PoolersExam.setOnChange(() => {
    promptLabel();
    syncTimerUi();
  });
  PoolersExam.loadCatalog().then(async () => {
    bootTerminal();
    const resumed = await PoolersExam.tryResume();
    if (resumed && resumed.status === "active") {
      expiredNotified = false;
      tracesSeenCount = resumed.tracesCount ?? 0;
      print("Resuming previous exam session…", "warn");
      if (resumed.remainingMs != null) {
        print(`Time remaining: ${formatDuration(resumed.remainingMs)}`, "info");
      }
      await loadAssignment();
    } else if (resumed && resumed.status === "expired") {
      print("Previous exam expired (time up).", "err");
    }
  }).catch((e) => {
    bootTerminal();
    print(`Catalog load warning: ${e.message}`, "err");
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && PoolersExam.isActive()) {
      if (gradeWait) return;
      e.preventDefault();
      if (shellTermId) focusTerminal(shellTermId);
      dispatch("grademe");
    }
  });
})();
