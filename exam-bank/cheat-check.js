/**
 * Exam anti-cheat helpers — forbidden libc / paste detection support
 */

/** Common C library / cheat calls students must not use unless allowed. */
const WATCHED_FUNCS = [
  "printf", "fprintf", "sprintf", "snprintf", "scanf", "sscanf", "fscanf",
  "puts", "putchar", "getchar", "gets", "fgets", "putstr",
  "atoi", "atol", "atof", "itoa",
  "malloc", "calloc", "realloc", "free",
  "strlen", "strcpy", "strncpy", "strcat", "strncat", "strcmp", "strncmp",
  "strdup", "strndup", "strstr", "strchr", "strrchr", "strtok",
  "memcpy", "memmove", "memset", "bzero", "memcmp", "memchr",
  "write", "read", "open", "close", "lseek",
  "exit", "abort", "system", "execve", "fork", "wait", "waitpid",
  "fopen", "fclose", "fread", "fwrite", "perror",
  "isalpha", "isdigit", "isalnum", "isprint", "toupper", "tolower",
  "pow", "sqrt", "abs", "fabs",
];

function parseAllowedList(allowed) {
  if (!allowed || allowed === "None" || allowed === "none") return [];
  if (Array.isArray(allowed)) return allowed.map((a) => String(a).trim()).filter(Boolean);
  return String(allowed)
    .split(/[,/\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Strip line/block comments and rough string literals before scanning. */
function stripNoise(code) {
  return String(code || "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

/**
 * Find watched function calls not in the allowed list.
 * Exercise's own ft_* name is always permitted.
 */
function findForbiddenCalls(code, allowedFuncs, exerciseName) {
  const allowed = new Set(
    (allowedFuncs || []).map((a) => a.toLowerCase().replace(/^ft_/, "ft_"))
  );
  // allow write by either "write" or full name
  const allow = (name) => {
    const n = name.toLowerCase();
    if (exerciseName && n === String(exerciseName).toLowerCase()) return true;
    if (allowed.has(n)) return true;
    return false;
  };

  const cleaned = stripNoise(code);
  const found = new Set();
  const re = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
  let m;
  while ((m = re.exec(cleaned))) {
    const name = m[1];
    const lower = name.toLowerCase();
    // skip keywords that look like calls
    if (["if", "while", "for", "switch", "return", "sizeof"].includes(lower)) continue;
    if (!WATCHED_FUNCS.includes(lower) && !WATCHED_FUNCS.includes(name)) continue;
    if (!allow(name)) found.add(name);
  }
  return [...found];
}

function checkCodeIntegrity(code, allowedFuncs, exerciseName) {
  const list = Array.isArray(allowedFuncs)
    ? allowedFuncs
    : parseAllowedList(allowedFuncs);
  const forbidden = findForbiddenCalls(code, list, exerciseName);
  if (forbidden.length) {
    return {
      ok: false,
      reason: "forbidden_function",
      message: `KO — forbidden function(s): ${forbidden.join(", ")}. Only allowed: ${
        list.length ? list.join(", ") : "None"
      }.`,
      forbidden,
    };
  }
  return { ok: true };
}

module.exports = {
  WATCHED_FUNCS,
  parseAllowedList,
  findForbiddenCalls,
  checkCodeIntegrity,
};
