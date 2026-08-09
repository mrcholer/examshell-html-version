/**
 * Poolers Exam Shell — standalone server
 * 42-style timed exam shell: levels, terminal, anti-cheat editor, sandboxed grading.
 * All C code (test terminal + exam grading) runs in a free online sandbox
 * (Wandbox) — this server never executes untrusted code locally.
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const WEB = __dirname;
const PORT = process.env.PORT || 3900;

const MAX_CODE_BYTES = 200 * 1024; // 200 KB per file
const MAX_STDIN_BYTES = 64 * 1024;
const MAX_ARGS = 16;
const MAX_ARG_LEN = 256;
const MAX_OUTPUT_BYTES = 256 * 1024;

const app = express();
app.use(express.json({ limit: "2mb" }));

// "/" is the landing page (served automatically by express.static below, since
// it's public/index.html). The exam shell itself lives at /examshell.
app.get(["/examshell", "/examshell/", "/exam", "/exam/"], (_req, res) => {
  res.sendFile(path.join(WEB, "public", "examshell.html"));
});

app.use(express.static(path.join(WEB, "public")));

/* ── Sandbox (Wandbox) — compile & run untrusted C code off-server ── */

const WANDBOX_API = "https://wandbox.org/api/compile.json";
const WANDBOX_COMPILER = "gcc-13.2.0-c";
const WANDBOX_TIMEOUT_MS = 20000;

async function wandboxCompileRun({ files, args = [], stdin = "" }) {
  const [main, ...rest] = files;
  const extraCFiles = rest.filter((f) => /\.c$/i.test(f.name)).map((f) => f.name);
  const compilerOptionRaw = ["-Wall", "-Wextra", "-Werror", ...extraCFiles].join("\n");

  const body = {
    compiler: WANDBOX_COMPILER,
    code: main.content,
    codes: rest.map((f) => ({ file: f.name, code: f.content })),
    "compiler-option-raw": compilerOptionRaw,
    "runtime-option-raw": (args || []).join("\n"),
    stdin: String(stdin || "").slice(0, MAX_STDIN_BYTES),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WANDBOX_TIMEOUT_MS);
  try {
    const res = await fetch(WANDBOX_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Sandbox HTTP ${res.status}`);
    const data = await res.json();
    const compileStderr = (data.compiler_error || "").trim();
    const compileFailed = compileStderr.length > 0;
    const exitCode = compileFailed ? null : parseInt(data.status, 10);
    return {
      compileFailed,
      compileOutput: data.compiler_output || "",
      compileStderr,
      stdout: data.program_output || "",
      stderr: data.program_error || "",
      exitCode: Number.isFinite(exitCode) ? exitCode : compileFailed ? null : 1,
      timedOut: exitCode === 137,
    };
  } catch (e) {
    const timedOut = e.name === "AbortError";
    return {
      compileFailed: false,
      compileOutput: "",
      compileStderr: "",
      stdout: "",
      stderr: timedOut ? "Sandbox request timed out." : `Sandbox error: ${e.message}`,
      exitCode: 1,
      timedOut,
    };
  } finally {
    clearTimeout(timer);
  }
}

function truncateBuf(s, max) {
  if (!s || s.length <= max) return s || "";
  return s.slice(0, max) + `\n… [truncated at ${max} bytes]`;
}

function sanitizeArgs(args) {
  if (!Array.isArray(args)) return [];
  return args
    .slice(0, MAX_ARGS)
    .map((a) => String(a).slice(0, MAX_ARG_LEN))
    .filter((a) => a.length > 0 && !/[\0\r\n]/.test(a));
}

/**
 * Standard 1337/libft helper definitions. Exercises sometimes declare a
 * prototype (e.g. `void ft_putchar(char c);`) and call the helper without
 * defining it, expecting it from libft. We auto-inject the canonical
 * definition for any helper referenced but not defined, so snippets run
 * standalone in the test terminal.
 */
const LIBFT_HELPERS = {
  ft_putchar: `void ft_putchar(char c)\n{\n\twrite(1, &c, 1);\n}\n`,
  ft_putstr: `void ft_putstr(char *s)\n{\n\twhile (s && *s)\n\t\twrite(1, s++, 1);\n}\n`,
  ft_putendl: `void ft_putendl(char *s)\n{\n\twhile (s && *s)\n\t\twrite(1, s++, 1);\n\twrite(1, "\\n", 1);\n}\n`,
  ft_putnbr: `void ft_putnbr(int n)\n{\n\tchar c;\n\tif (n == -2147483648)\n\t{\n\t\twrite(1, "-2147483648", 11);\n\t\treturn;\n\t}\n\tif (n < 0)\n\t{\n\t\twrite(1, "-", 1);\n\t\tn = -n;\n\t}\n\tif (n >= 10)\n\t\tft_putnbr(n / 10);\n\tc = (char)('0' + (n % 10));\n\twrite(1, &c, 1);\n}\n`,
  ft_strlen: `int ft_strlen(char *s)\n{\n\tint i = 0;\n\twhile (s && s[i])\n\t\ti++;\n\treturn (i);\n}\n`,
  ft_swap: `void ft_swap(int *a, int *b)\n{\n\tint tmp = *a;\n\t*a = *b;\n\t*b = tmp;\n}\n`,
};

function helperIsDefined(name, code) {
  const re = new RegExp(`\\b${name}\\s*\\([^;{]*\\)\\s*\\{`);
  return re.test(code);
}

function helperIsReferenced(name, code) {
  return new RegExp(`\\b${name}\\s*\\(`).test(code);
}

function injectMissingHelpers(code) {
  const missing = [];
  for (const name of Object.keys(LIBFT_HELPERS)) {
    if (helperIsReferenced(name, code) && !helperIsDefined(name, code)) {
      missing.push(name);
    }
  }
  if (missing.length === 0) return code;

  const prelude = missing.map((n) => LIBFT_HELPERS[n]).join("\n");
  const banner =
    "/* Auto-linked libft helpers (ft_putchar, etc.) so this snippet runs standalone. */\n";
  const includeLine = "#include <unistd.h>\n";

  return `${includeLine}${banner}${prelude}\n${code}`;
}

function explainCompileError(text) {
  const lines = [];
  if (/undefined reference/.test(text))
    lines.push("Linker error: a function is declared but not defined. Add the function body or link the right file.");
  if (/implicit declaration/.test(text))
    lines.push("Missing prototype or #include. The compiler does not know that function exists.");
  if (/expected .* before/.test(text))
    lines.push("Syntax error: check semicolons, braces, and parentheses near the line GCC mentions.");
  if (/incompatible/.test(text))
    lines.push("Type mismatch: you passed the wrong type (e.g. int instead of int *).");
  if (/unused/.test(text))
    lines.push("With -Werror, warnings become errors. Remove or use unused variables.");
  if (lines.length === 0)
    lines.push("Read the first error line GCC prints — later errors are often cascading.");
  return lines.map((text) => ({ type: "error", text }));
}

function explainOutput(code, stdout, stderr, exitCode) {
  const points = [];

  if (stdout.length === 0 && !stderr && exitCode === 0)
    points.push({
      type: "info",
      text: "Program exited successfully but printed nothing. Maybe no write()/printf() ran, or output went elsewhere.",
    });
  else if (stdout.length > 0) {
    const display = stdout.replace(/\r\n/g, "\n");
    points.push({
      type: "output",
      text: `stdout (${display.length} byte${display.length !== 1 ? "s" : ""}): characters sent to file descriptor 1 (terminal).`,
    });
    for (const ch of display.slice(0, 20)) {
      const code = ch.charCodeAt(0);
      if (code < 32 || code === 127) {
        points.push({
          type: "ascii",
          text: `Control char \\${specialCharName(ch)} = ASCII ${code} (0x${code.toString(16).toUpperCase()})`,
        });
      } else {
        points.push({
          type: "ascii",
          text: `'${ch}' = ASCII ${code} (0x${code.toString(16).toUpperCase()})`,
        });
      }
    }
    if (stdout.length > 20)
      points.push({ type: "info", text: `… and ${stdout.length - 20} more characters.` });
  }

  if (stderr) points.push({ type: "error", text: `stderr: ${stderr.trim()}` });
  if (exitCode !== 0)
    points.push({ type: "error", text: `Exit code ${exitCode} — non-zero means failure or crash.` });

  if (/write\s*\(\s*1/.test(code))
    points.push({
      type: "concept",
      text: "write(1, …) sends bytes directly to stdout — no buffering like printf.",
    });
  if (/ft_putchar/.test(code))
    points.push({ type: "concept", text: "ft_putchar wraps write(1, &c, 1) — one byte per call." });
  if (/\*\w+\s*=/.test(code))
    points.push({ type: "concept", text: "*pointer = value writes through the address — modifies caller memory." });
  if (/&\w+/.test(code))
    points.push({ type: "concept", text: "&variable passes the address so the callee can modify the original." });

  return points;
}

function specialCharName(ch) {
  const map = { "\n": "n", "\t": "t", "\0": "0", "\r": "r" };
  return map[ch] || `x${ch.charCodeAt(0).toString(16).padStart(2, "0")}`;
}

// Used by the examshell's "Test terminal" — compiles/runs the editor's
// current content standalone (single file, libft helpers auto-injected).
app.post("/api/compile-run", async (req, res) => {
  const { code, stdin = "", args = [] } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "No code provided" });
  }
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return res.status(400).json({ error: `Code too large (max ${MAX_CODE_BYTES} bytes)` });
  }

  const safeArgs = sanitizeArgs(args);
  const mainContent = injectMissingHelpers(code);

  const steps = [
    {
      phase: "compile",
      title: "Compile",
      command: "gcc -Wall -Wextra -Werror -o program main.c",
      explanation:
        "GCC translates your C source into machine code. -Wall -Wextra -Werror catch mistakes early (1337 norm). Compiled and run in an online sandbox (Wandbox), not on this server.",
    },
  ];

  const result = await wandboxCompileRun({
    files: [{ name: "main.c", content: mainContent }],
    args: safeArgs,
    stdin,
  });

  steps[0].stdout = truncateBuf(result.compileOutput, MAX_OUTPUT_BYTES);
  steps[0].stderr = truncateBuf(result.compileStderr, MAX_OUTPUT_BYTES);
  steps[0].success = !result.compileFailed;

  if (result.compileFailed) {
    return res.json({
      success: false,
      steps,
      compileError: result.compileStderr || result.compileOutput,
      output: "",
      explanation: explainCompileError(result.compileStderr || result.compileOutput),
    });
  }

  steps.push({
    phase: "run",
    title: "Execute",
    command: `./program${safeArgs.length ? " " + safeArgs.join(" ") : ""}`,
    explanation:
      "The sandbox loads the program into memory, creates a stack, calls main(), and collects stdout/stderr. Short timeout, capped output, isolated from this server.",
  });

  steps[1].stdout = result.stdout;
  steps[1].stderr = result.stderr;
  steps[1].exitCode = result.exitCode;
  steps[1].success = result.exitCode === 0;
  if (result.timedOut) {
    steps[1].explanation = "Killed by the sandbox (possible infinite loop or time limit exceeded).";
  }

  const explanation = explainOutput(code, result.stdout, result.stderr, result.exitCode);
  if (result.timedOut) {
    explanation.unshift({ type: "error", text: "Program timed out / was killed by the sandbox." });
  }

  res.json({
    success: result.exitCode === 0,
    steps,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    explanation,
  });
});

/* ── Exam shell (42-style) ── */
const examBank = require("./exam-bank");
const EXAM_SESSIONS = new Map();
const EXAM_DIR = path.join(WEB, ".exam-sessions");
if (!fs.existsSync(EXAM_DIR)) fs.mkdirSync(EXAM_DIR, { recursive: true });

// Real-exam-style scoring, graded out of 100 like the real piscine:
// exam00/01/02 award 10 pts per cleared level (10 levels x 10 = 100, exact).
// final awards 6 pts per cleared level (10 levels x 6 = 60) plus a 40 pt
// completion bonus on the final level, so a full clear also lands on 100.
const EXAM_MAX_SCORE = 100;
const POINTS_PER_LEVEL = { exam00: 10, exam01: 10, exam02: 10, final: 6 };
function pointsPerLevel(examId) {
  return POINTS_PER_LEVEL[examId] ?? 10;
}

/**
 * Anti-cheat: client-side paste/drop blocking can always be defeated from
 * devtools (delete the overlay, remove the listeners, call the grade API
 * directly). The one signal that can't be forged that way is server-observed
 * wall-clock time: the server stamps `currentExerciseStartedAt` itself the
 * moment an exercise becomes current, and at grademe compares elapsed time
 * against a generous minimum-typing-speed floor. Landing a large solution
 * a few seconds after the assignment loaded is not humanly typeable — it's
 * either pasted in, or injected straight into the grade request.
 */
const CHEAT_MIN_MS_PER_CHAR = 15; // ~67 chars/sec sustained — far above real typing speed
const CHEAT_MIN_CHARS = 20; // skip the check for trivially short solutions

function detectSpeedCheat(s, code) {
  const len = (code || "").length;
  if (len < CHEAT_MIN_CHARS) return null;
  const startedAt = Date.parse(s.currentExerciseStartedAt || s.startedAt || s.created || 0);
  if (!Number.isFinite(startedAt)) return null;
  const elapsedMs = Date.now() - startedAt;
  const minPlausibleMs = len * CHEAT_MIN_MS_PER_CHAR;
  if (elapsedMs < minPlausibleMs) {
    return `${len} characters submitted ${(elapsedMs / 1000).toFixed(1)}s after the assignment loaded — faster than humanly typeable.`;
  }
  return null;
}

function cheatBanner(reason) {
  return [
    "========================================",
    "              g r a d e m e",
    "========================================",
    "",
    `CHEAT DETECTED : ${reason}`,
    "",
    "############################################",
    "#                                          #",
    "#           EXAM ENDED — GRADE: -42        #",
    "#                                          #",
    "############################################",
    "",
  ].join("\n");
}

function endExamAsCheat(s, reason) {
  s.status = "cheated";
  s.score = -42;
  s.message = `-42 — ${reason} Exam ended.`;
  s.updated = new Date().toISOString();
  saveSession(s);
}

function sessionPublic(s) {
  const exam = examBank.getExam(s.examId);
  const levelState = s.levels[s.level];
  const currentId = levelState ? levelState.assigned[levelState.currentIndex] : null;
  const current = examBank.publicExercise(examBank.getExercise(currentId));
  const diff = examBank.normalizeDifficulty(s.difficulty);
  const startedAt = s.startedAt || s.created || null;
  const durationMs = s.durationMs || examBank.getExamDurationMs(s.examId);
  const deadline = s.deadline || (startedAt ? new Date(Date.parse(startedAt) + durationMs).toISOString() : null);
  const remainingMs = deadline && s.status === "active"
    ? Math.max(0, Date.parse(deadline) - Date.now())
    : null;
  return {
    id: s.id,
    examId: s.examId,
    title: exam ? exam.title : s.examId,
    difficulty: diff,
    difficultyTitle: examBank.DIFFICULTIES[diff].title,
    status: s.status,
    level: s.level,
    levelCount: s.levels.length,
    exercisesPerLevel: examBank.EXERCISES_PER_LEVEL,
    levels: s.levels.map((lv) => ({
      level: lv.level,
      assigned: lv.assigned,
      poolSize: lv.poolSize || (lv.pool && lv.pool.length) || lv.assigned.length,
      passed: lv.passed,
      currentIndex: lv.currentIndex,
      locked: lv.level > s.level,
      complete: lv.passed.length >= lv.assigned.length,
    })),
    current,
    currentProgress: levelState
      ? { index: levelState.currentIndex, total: levelState.assigned.length, passed: levelState.passed.length }
      : null,
    message: s.message || null,
    startedAt,
    durationMs,
    durationHours: durationMs / (60 * 60 * 1000),
    deadline,
    remainingMs,
    score: s.score || 0,
    scorePerLevel: pointsPerLevel(s.examId),
    maxScore: EXAM_MAX_SCORE,
    tracesCount: s.examId === "final" ? null : (s.traces || []).length,
  };
}

function expireIfNeeded(s) {
  if (!s || s.status !== "active") return false;
  const deadline = s.deadline || (s.startedAt || s.created
    ? new Date(Date.parse(s.startedAt || s.created) + (s.durationMs || examBank.getExamDurationMs(s.examId))).toISOString()
    : null);
  if (!deadline) return false;
  if (Date.now() <= Date.parse(deadline)) return false;
  s.status = "expired";
  s.message = "Time is up — exam expired.";
  s.updated = new Date().toISOString();
  if (!s.deadline) s.deadline = deadline;
  saveSession(s);
  return true;
}

function loadSession(id) {
  if (EXAM_SESSIONS.has(id)) return EXAM_SESSIONS.get(id);
  const file = path.join(EXAM_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const s = JSON.parse(fs.readFileSync(file, "utf8"));
    EXAM_SESSIONS.set(id, s);
    return s;
  } catch (_) {
    return null;
  }
}

function saveSession(s) {
  EXAM_SESSIONS.set(s.id, s);
  try {
    fs.writeFileSync(path.join(EXAM_DIR, `${s.id}.json`), JSON.stringify(s, null, 2), "utf8");
  } catch (_) { }
}

app.get("/api/exams", (_req, res) => {
  res.json({ exams: examBank.listExams() });
});

app.post("/api/exam/start", (req, res) => {
  const examId = req.body && req.body.examId;
  const difficulty = examBank.normalizeDifficulty(req.body && req.body.difficulty);
  const exam = examBank.getExam(examId);
  if (!exam) return res.status(400).json({ error: "Unknown exam. Use exam00, exam01, exam02, or final." });

  const levels = examBank.pickLevelAssignments(examId, difficulty);
  const id = uuidv4();
  const first = levels[0].assigned[0];
  const firstEx = examBank.getExercise(first);
  const files = {};
  if (firstEx) files[firstEx.filename] = "";
  const diffTitle = examBank.DIFFICULTIES[difficulty].title;
  const startedAt = new Date().toISOString();
  const durationMs = examBank.getExamDurationMs(examId);
  const deadline = new Date(Date.now() + durationMs).toISOString();
  const hours = durationMs / (60 * 60 * 1000);

  const perLevel = pointsPerLevel(examId);
  const session = {
    id,
    examId,
    difficulty,
    status: "active",
    level: 0,
    levels,
    files,
    score: 0,
    currentExerciseStartedAt: startedAt,
    message: `${exam.title} (${diffTitle}) started — ${hours}h timer · ${levels.length} levels (${perLevel} pts/level, ${EXAM_MAX_SCORE} pts total). Level 0 exercise 1/${levels[0].assigned.length}: ${first}. Clear ${levels[0].assigned.length} exercises per level to advance.`,
    startedAt,
    durationMs,
    deadline,
    created: startedAt,
    updated: startedAt,
  };
  saveSession(session);
  res.json(sessionPublic(session));
});

app.get("/api/exam/:id", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  if (expireIfNeeded(s)) return res.json(sessionPublic(s));
  res.json(sessionPublic(s));
});

app.get("/api/exam/:id/file", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  if (expireIfNeeded(s)) return res.status(400).json({ error: "Time is up — exam expired", session: sessionPublic(s) });
  const name = String(req.query.name || "");
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return res.status(400).json({ error: "Invalid file name" });
  }
  const levelState = s.levels[s.level];
  const currentId = levelState && levelState.assigned[levelState.currentIndex];
  const current = examBank.getExercise(currentId);
  if (!current || !current.allowedFiles.includes(name)) {
    return res.status(403).json({ error: "File not allowed for current exercise" });
  }
  if (s.files[name] === undefined) s.files[name] = "";
  res.json({ name, content: s.files[name], subject: current.subject, exercise: examBank.publicExercise(current) });
});

app.put("/api/exam/:id/file", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  if (expireIfNeeded(s)) return res.status(400).json({ error: "Time is up — exam expired", session: sessionPublic(s) });
  if (s.status !== "active") return res.status(400).json({ error: "Exam is not active" });
  const name = req.body && req.body.name;
  const content = req.body && req.body.content;
  if (!name || typeof content !== "string") return res.status(400).json({ error: "name and content required" });
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return res.status(400).json({ error: "Invalid file name" });
  }
  if (Buffer.byteLength(content, "utf8") > MAX_CODE_BYTES) {
    return res.status(400).json({ error: "File too large" });
  }
  const levelState = s.levels[s.level];
  const currentId = levelState && levelState.assigned[levelState.currentIndex];
  const current = examBank.getExercise(currentId);
  if (!current || !current.allowedFiles.includes(name)) {
    return res.status(403).json({ error: "File not allowed for current exercise" });
  }
  s.files[name] = content;
  s.updated = new Date().toISOString();
  saveSession(s);
  res.json({ ok: true });
});

app.post("/api/exam/:id/grade", async (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  if (expireIfNeeded(s)) {
    return res.status(400).json({ error: "Time is up — exam expired", session: sessionPublic(s) });
  }
  if (s.status !== "active") return res.status(400).json({ error: "Exam is not active" });

  const levelState = s.levels[s.level];
  if (!levelState) return res.status(400).json({ error: "Invalid level" });
  const currentId = levelState.assigned[levelState.currentIndex];
  const exercise = examBank.getExercise(currentId);
  if (!exercise) return res.status(400).json({ error: "Exercise missing" });

  // Accept latest editor content if provided
  if (req.body && typeof req.body.content === "string" && req.body.name) {
    if (exercise.allowedFiles.includes(req.body.name)) {
      if (Buffer.byteLength(req.body.content, "utf8") > MAX_CODE_BYTES) {
        return res.status(400).json({ error: "Code too large" });
      }
      s.files[req.body.name] = req.body.content;
    }
  }

  const studentCode = s.files[exercise.filename];
  if (typeof studentCode !== "string") {
    return res.status(400).json({ error: `Missing ${exercise.filename}` });
  }

  // Anti-cheat: client paste/drop flag. This can be defeated from devtools
  // (delete the listeners, call this endpoint directly) — the speed check
  // below is the check that still holds when this one is bypassed.
  const clientCheat = req.body && req.body.cheat;
  if (clientCheat && (clientCheat.paste || clientCheat.drop)) {
    const why = clientCheat.paste && clientCheat.drop
      ? "paste and drop detected"
      : clientCheat.paste
        ? "paste detected"
        : "file drop detected";
    endExamAsCheat(s, `${why}. Write the code yourself.`);
    return res.json({
      ok: false,
      passed: false,
      stage: "cheat",
      cheated: true,
      output: cheatBanner(why),
      session: sessionPublic(s),
    });
  }

  // Anti-cheat: server-observed typing speed (can't be forged from devtools —
  // the clock and the exercise-start timestamp are both server-side).
  const speedCheat = detectSpeedCheat(s, studentCode);
  if (speedCheat) {
    endExamAsCheat(s, speedCheat);
    return res.json({
      ok: false,
      passed: false,
      stage: "cheat",
      cheated: true,
      output: cheatBanner(speedCheat),
      session: sessionPublic(s),
    });
  }

  // Anti-cheat: forbidden functions (server-side)
  const integrity = examBank.checkCodeIntegrity(
    studentCode,
    exercise.allowedFuncs || [],
    exercise.name || exercise.id
  );
  if (!integrity.ok) {
    s.message = integrity.message;
    s.updated = new Date().toISOString();
    saveSession(s);
    return res.json({
      ok: false,
      passed: false,
      stage: "cheat",
      output: [
        "========================================",
        "              g r a d e m e",
        "========================================",
        "",
        integrity.message,
        "",
        "GRADE: KO",
      ].join("\n"),
      session: sessionPublic(s),
    });
  }

  let passed, terminal, compileFailedResult;

  if (exercise.type === "program") {
    // Standalone argv/stdin program (no separate grader) — one compile+run
    // per test case, since the sandbox bundles compile and run together.
    const testCases = exercise.testCases || [];
    const runs = [];
    for (const tc of testCases) {
      const result = await wandboxCompileRun({
        files: [{ name: exercise.filename, content: studentCode }],
        args: tc.args || [],
        stdin: tc.stdin || "",
      });
      if (result.compileFailed) {
        compileFailedResult = result;
        break;
      }
      const got = (result.stdout || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      const expected = String(tc.expected || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      runs.push({
        args: tc.args || [],
        got,
        passed: result.exitCode === 0 && got === expected,
        timedOut: !!result.timedOut,
      });
    }

    if (compileFailedResult) {
      s.message = `KO — compile error on ${exercise.name}`;
      saveSession(s);
      return res.json({
        ok: false,
        passed: false,
        stage: "compile",
        output: truncateBuf(
          compileFailedResult.compileStderr || compileFailedResult.compileOutput || "compile failed",
          MAX_OUTPUT_BYTES
        ),
        session: sessionPublic(s),
      });
    }

    passed = runs.length > 0 && runs.every((r) => r.passed);

    terminal = `$ gcc -Wall -Wextra -Werror -o ${exercise.name} ${exercise.filename} …\n✓ compile OK\n`;
    runs.forEach((r, i) => {
      const argsStr = r.args.map((a) => `"${a}"`).join(" ");
      terminal += `$ ./${exercise.name}${argsStr ? " " + argsStr : ""}\n`;
      terminal += r.got.length ? r.got : "(no output)\n";
      terminal += r.timedOut ? `[killed by sandbox — possible infinite loop]\n` : "";
      terminal += `test ${i + 1}/${runs.length}: ${r.passed ? "OK" : "KO"}\n`;
    });
    terminal += `\n---\n`;
    terminal += passed ? `GRADE: OK\n` : `GRADE: KO\n`;
  } else {
    // Legacy: student writes a function, the grader's own main() calls it.
    const extraFiles = [{ name: exercise.filename, content: studentCode }];
    (exercise.helpers || []).forEach((h, i) => {
      extraFiles.push({ name: `helper_${i}.c`, content: h });
    });
    if (exercise.headerFile) {
      extraFiles.push({ name: "t_list.h", content: exercise.headerFile });
    }

    const result = await wandboxCompileRun({
      files: [{ name: "grader_main.c", content: exercise.grader }, ...extraFiles],
      args: [],
      stdin: "",
    });

    if (result.compileFailed) {
      s.message = `KO — compile error on ${exercise.name}`;
      saveSession(s);
      return res.json({
        ok: false,
        passed: false,
        stage: "compile",
        output: truncateBuf(result.compileStderr || result.compileOutput || "compile failed", MAX_OUTPUT_BYTES),
        session: sessionPublic(s),
      });
    }

    const got = (result.stdout || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const expected = String(exercise.expected).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    passed = result.exitCode === 0 && got === expected;

    // Traces: a per-attempt record of what moulinette ran and what it got —
    // never the expected value, so grademe can't be used to fish for the
    // answer. Disabled entirely for `final`.
    const tracesEnabled = s.examId !== "final";
    if (tracesEnabled) {
      if (!s.traces) s.traces = [];
      s.traceSeq = (s.traceSeq || 0) + 1;
      const baseName = exercise.filename.replace(/\.c$/i, "");
      s.traces.push({
        id: uuidv4(),
        filename: `${baseName}_attempt${s.traceSeq}.trace`,
        exercise: exercise.name,
        exerciseId: exercise.id,
        at: new Date().toISOString(),
        passed,
        tested: `Called ${exercise.name}() via the grader's main(), then captured everything written to stdout.`,
        got: truncateBuf(got, 4000) || "(no output)",
        expected: truncateBuf(expected, 4000) || "(no output)",
      });
    }

    terminal = `$ gcc -Wall -Wextra -Werror -o program ${exercise.filename} …\n`;
    terminal += `✓ compile OK\n$ ./program\n`;
    terminal += got.length ? got : "(no output)\n";
    if (result.stderr) terminal += result.stderr;
    if (result.timedOut) {
      terminal += `\n[killed by sandbox — possible infinite loop]\n`;
    }
    terminal += `\n---\n`;
    if (passed) terminal += `GRADE: OK\n`;
    else {
      terminal += `GRADE: KO\n`;
      terminal += tracesEnabled ? `See the traces tab for this attempt.\n` : "";
    }
  }

  if (passed) {
    if (!levelState.passed.includes(currentId)) levelState.passed.push(currentId);

    if (levelState.passed.length >= levelState.assigned.length) {
      const perLevel = pointsPerLevel(s.examId);
      s.score = (s.score || 0) + perLevel;

      if (s.level >= s.levels.length - 1) {
        // Completion bonus rounds the score to an even 100, same as a real
        // piscine grade — matters for `final`, where 10 levels x 6 pts = 60.
        s.score = EXAM_MAX_SCORE;
        s.status = "passed";
        s.message = `SUCCESS — you cleared ${examBank.getExam(s.examId).title}. Final score: ${s.score}/${EXAM_MAX_SCORE} pts.`;
      } else {
        s.level += 1;
        const next = s.levels[s.level];
        next.currentIndex = 0;
        const nextEx = examBank.getExercise(next.assigned[0]);
        if (nextEx && s.files[nextEx.filename] === undefined) s.files[nextEx.filename] = "";
        s.currentExerciseStartedAt = new Date().toISOString();
        s.message = `Level ${s.level - 1} cleared (+${perLevel} pts, ${s.score}/${EXAM_MAX_SCORE}). Now Level ${s.level} — exercise 1/${next.assigned.length}: ${next.assigned[0]}`;
      }
    } else {
      levelState.currentIndex += 1;
      const nextId = levelState.assigned[levelState.currentIndex];
      const nextEx = examBank.getExercise(nextId);
      if (nextEx && s.files[nextEx.filename] === undefined) s.files[nextEx.filename] = "";
      s.currentExerciseStartedAt = new Date().toISOString();
      s.message = `OK — ${exercise.name}. Next: ${nextId} (${levelState.passed.length}/${levelState.assigned.length} in level ${s.level})`;
    }
  } else {
    s.message = `KO — ${exercise.name}. Fix and grade again.`;
  }

  s.updated = new Date().toISOString();
  saveSession(s);

  res.json({
    ok: true,
    passed,
    stage: passed ? "pass" : "run",
    output: truncateBuf(terminal, MAX_OUTPUT_BYTES),
    session: sessionPublic(s),
  });
});

app.get("/api/exam/:id/traces", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  if (s.examId === "final") {
    return res.json({ disabled: true, message: "No traces for this exam.", traces: [] });
  }
  const traces = (s.traces || []).map((t) => ({
    id: t.id,
    filename: t.filename,
    exercise: t.exercise,
    at: t.at,
    passed: t.passed,
  }));
  res.json({ disabled: false, traces });
});

app.get("/api/exam/:id/traces/:traceId", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  if (s.examId === "final") {
    return res.status(403).json({ error: "No traces for this exam." });
  }
  const trace = (s.traces || []).find((t) => t.id === req.params.traceId);
  if (!trace) return res.status(404).json({ error: "Trace not found" });
  res.json(trace);
});

app.get("/api/exam/:id/passed", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  const items = [];
  for (const lv of s.levels || []) {
    for (const exId of lv.passed || []) {
      const ex = examBank.getExercise(exId);
      if (ex) items.push({ id: ex.id, name: ex.name, filename: ex.filename, level: lv.level });
    }
  }
  res.json({ items });
});

app.get("/api/exam/:id/passed/:exerciseId", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  const wasPassed = (s.levels || []).some((lv) => (lv.passed || []).includes(req.params.exerciseId));
  if (!wasPassed) return res.status(403).json({ error: "Exercise not passed yet" });
  const ex = examBank.getExercise(req.params.exerciseId);
  if (!ex) return res.status(404).json({ error: "Exercise not found" });
  res.json({ id: ex.id, name: ex.name, filename: ex.filename, content: s.files[ex.filename] || "" });
});

app.post("/api/exam/:id/abandon", (req, res) => {
  const s = loadSession(req.params.id);
  if (!s) return res.status(404).json({ error: "Exam session not found" });
  s.status = "abandoned";
  s.message = "Exam abandoned.";
  s.updated = new Date().toISOString();
  saveSession(s);
  res.json(sessionPublic(s));
});

// JSON parse errors
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  next(err);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`\n  Poolers Exam Shell running at http://localhost:${PORT}\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} already in use. Kill other process or set PORT=3901\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
