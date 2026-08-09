/**
 * Plain 42-piscine-style exam subject text (no markdown) — matches the
 * classic "Assignment name / Expected files / Allowed functions" header
 * block used by real moulinette subjects.
 */

const SEP = "-".repeat(80);
const LABEL_WIDTH = 17;

function pad(label) {
  return label.length >= LABEL_WIDTH ? label : label + " ".repeat(LABEL_WIDTH - label.length);
}

function formatAllowed(allowed) {
  if (!allowed || allowed === "None" || allowed === "none") return "None";
  if (Array.isArray(allowed)) return allowed.join(", ");
  return String(allowed)
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * cat -e style rendering: each newline becomes a trailing `$`. Callers pass
 * output that always ends with exactly one trailing "\n".
 */
function formatCatE(output) {
  const body = String(output ?? "").endsWith("\n") ? String(output).slice(0, -1) : String(output ?? "");
  if (body === "") return "$";
  return body.split("\n").join("$\n") + "$";
}

/**
 * Builds the "$> ./cmd args | cat -e" example block straight from the same
 * test cases used for grading, so the subject text can never drift out of
 * sync with what's actually checked.
 */
function formatExamples(cmd, testCases) {
  const blocks = (testCases || []).map((tc) => {
    const argsStr = (tc.args || []).map((a) => `"${a}"`).join(" ");
    const cmdLine = `$> ./${cmd}${argsStr ? " " + argsStr : ""}${tc.stdin ? "" : ""} | cat -e`;
    return `${cmdLine}\n${formatCatE(tc.expected)}`;
  });
  return blocks.join("\n") + "\n$>";
}

/**
 * @param {object} opts
 */
function renderSubject(opts) {
  const name = opts.name || "exercise";
  const filename = opts.filename || `${name}.c`;
  const allowed = formatAllowed(opts.allowed);

  const header = [
    `${pad("Assignment name")}: ${name}`,
    `${pad("Expected files")}: ${filename}`,
    `${pad("Allowed functions")}: ${allowed}`,
  ].join("\n");

  const parts = [header, SEP, (opts.description || "").trim()];

  if (opts.prototype) {
    parts.push("", "Prototype:", "", opts.prototype.trim());
  }

  if (opts.notes && opts.notes.length) {
    parts.push("", "Notes:", ...opts.notes.map((n) => `- ${n}`));
  }

  if (opts.hint) {
    parts.push("", `Tip: ${opts.hint}`);
  }

  if (opts.examples) {
    parts.push("Examples:", String(opts.examples).trim());
  }

  return parts.join("\n") + "\n";
}

/**
 * Structured subject data — same information as renderSubject(), but as
 * fields the client can lay out as real HTML instead of a fixed-width
 * monospace block (which wraps badly in a narrow pane).
 */
function buildSubjectData(opts) {
  return {
    name: opts.name || "exercise",
    filename: opts.filename || `${opts.name || "exercise"}.c`,
    allowed: formatAllowed(opts.allowed),
    description: (opts.description || "").trim(),
    prototype: opts.prototype ? opts.prototype.trim() : null,
    notes: opts.notes && opts.notes.length ? opts.notes : null,
    hint: opts.hint || null,
    examples: opts.examples ? String(opts.examples).trim() : null,
  };
}

module.exports = { renderSubject, buildSubjectData, formatExamples, formatCatE };
