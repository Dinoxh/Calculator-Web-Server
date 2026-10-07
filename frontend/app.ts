import { evaluate, resetVariables, type Endpoint } from "./api.js";
import { formatRaw } from "./format.js";
import { mountVariables } from "./variables.js";
import { mountKeypad } from "./keypad.js";

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

const app = document.querySelector<HTMLElement>(".app")!;
const top = $<HTMLElement>("top");
const composer = $<HTMLFormElement>("composer");
const field = $<HTMLElement>("field");
const input = $<HTMLInputElement>("input");
const entries = $<HTMLOListElement>("entries");
const modeHint = $<HTMLElement>("mode-hint");
const resetButton = $<HTMLButtonElement>("reset");
const varsList = $<HTMLUListElement>("vars");
const keys = $<HTMLElement>("keys");

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

// ---------- Endpoint picker ----------

const hints: Record<Endpoint, string> = {
  statement: "Evaluates the line, saves variables and sets <code>ans</code>.",
  assignment: "Evaluates and saves variables, but leaves <code>ans</code> alone.",
  expression: "Sums and differences. Assign only inside parentheses.",
  term: "Products, quotients and <code>%</code>. A top-level <code>+</code> is rejected.",
  factor: "A single number, variable, function call or <code>( … )</code>.",
};

const MODE_KEY = "calculator.mode";

function currentMode(): Endpoint {
  const checked = composer.querySelector<HTMLInputElement>('input[name="mode"]:checked');
  return (checked?.value ?? "statement") as Endpoint;
}

function showHint(): void {
  modeHint.innerHTML = hints[currentMode()];
}

composer.addEventListener("change", (e) => {
  const target = e.target as HTMLInputElement;
  if (target.name !== "mode") return;
  showHint();
  try { localStorage.setItem(MODE_KEY, target.value); } catch { /* storage unavailable */ }
  input.focus({ preventScroll: true });
});

try {
  const saved = localStorage.getItem(MODE_KEY);
  const radio = saved && composer.querySelector<HTMLInputElement>(`input[name="mode"][value="${CSS.escape(saved)}"]`);
  if (radio) radio.checked = true;
} catch { /* storage unavailable */ }
showHint();

// ---------- Tape ----------

function addEntry(mode: Endpoint, line: string, text: string, isError: boolean): void {
  const li = document.createElement("li");
  li.className = isError ? "entry error" : "entry";

  // The whole entry is a button: tapping it puts the calculation back in the field
  const button = document.createElement("button");
  button.type = "button";
  button.className = "entry-button";

  const lineEl = document.createElement("span");
  lineEl.className = "entry-line";
  if (mode !== "statement") {
    const tag = document.createElement("span");
    tag.className = "entry-mode";
    tag.dataset.mode = mode;
    tag.textContent = mode;
    lineEl.append(tag);
  }
  lineEl.append(line);

  const resultEl = document.createElement("span");
  resultEl.className = "entry-result";
  resultEl.textContent = text;
  // Like Calculator, long numbers shrink rather than wrap mid-number
  if (!isError && text.length > 14) resultEl.classList.add(text.length > 28 ? "longer" : "long");

  button.append(lineEl, resultEl);
  button.addEventListener("click", () => {
    input.value = line;
    input.focus();
    input.setSelectionRange(line.length, line.length);
  });

  li.append(button);
  entries.append(li);
  app.classList.add("has-entries");

  scrollTo({ top: document.documentElement.scrollHeight, behavior: reducedMotion.matches ? "auto" : "smooth" });
}

function shake(): void {
  field.classList.remove("shake");
  void field.offsetWidth; // restart the animation if it's already running
  field.classList.add("shake");
}
field.addEventListener("animationend", () => field.classList.remove("shake"));

// ---------- Evaluate ----------

const history: string[] = [];
let historyIndex = 0;

// Requests run one at a time: each response updates the session cookie,
// so overlapping requests would race on the variables.
let queue: Promise<void> = Promise.resolve();

composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const line = input.value.trim();
  if (!line) {
    shake();
    return;
  }

  const mode = currentMode();
  history.push(line);
  historyIndex = history.length;

  queue = queue.then(async () => {
    const result = await evaluate(mode, line);
    if (result.ok) {
      addEntry(mode, line, formatRaw(result.raw), false);
      if (input.value.trim() === line) input.value = "";
      document.dispatchEvent(new CustomEvent("variables-changed"));
    } else {
      addEntry(mode, line, result.error, true);
      shake();
    }
  });
});

// Up/Down recall earlier input, like a shell
input.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
  if (history.length === 0) return;
  e.preventDefault();
  historyIndex = Math.max(0, Math.min(history.length, historyIndex + (e.key === "ArrowUp" ? -1 : 1)));
  input.value = history[historyIndex] ?? "";
  input.setSelectionRange(input.value.length, input.value.length);
});

// ---------- Reset ----------

resetButton.addEventListener("click", () => {
  queue = queue.then(async () => {
    try {
      await resetVariables();
    } catch {
      addEntry(currentMode(), "reset", "Couldn't reset variables.", true);
      return;
    }
    entries.replaceChildren();
    app.classList.remove("has-entries");
    history.length = 0;
    historyIndex = 0;
    input.value = "";
    updateEdges();
    document.dispatchEvent(new CustomEvent("variables-changed"));
  });
});

// ---------- Variables ----------

mountVariables(varsList, input);
mountKeypad(keys, input);

// ---------- Scroll edges ----------

// Hairlines under/over the bars only when content is actually behind them
function updateEdges(): void {
  const root = document.documentElement;
  top.classList.toggle("edge", root.scrollTop > 0);
  composer.classList.toggle("edge", root.scrollTop + innerHeight < root.scrollHeight - 1);
}
addEventListener("scroll", updateEdges, { passive: true });
addEventListener("resize", updateEdges);
new ResizeObserver(updateEdges).observe(entries);
updateEdges();

input.focus();
