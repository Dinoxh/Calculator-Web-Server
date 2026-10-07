import { getVariables, type Variables } from "./api.js";
import { formatNumber } from "./format.js";
import { insertAtCaret, keepFocus } from "./insert.js";

// User variables get a stable hue from their name; ans matches the = key, constants stay neutral
const HUES = ["blue", "green", "indigo", "pink", "purple", "teal", "mint", "cyan"] as const;
const FIXED: Record<string, string> = { ans: "orange", PI: "label", E: "label" };

function hueFor(name: string): string {
  const fixed = FIXED[name];
  if (fixed) return fixed;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[hash % HUES.length]!;
}

type Chip = { li: HTMLLIElement; chip: HTMLButtonElement; valueEl: HTMLSpanElement; value: number };

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

/** Render the session's variables as chips; tapping one inserts its name. */
export function mountVariables(list: HTMLUListElement, input: HTMLInputElement): void {
  // Chips are updated in place, so only new, changed or removed variables animate
  const chips = new Map<string, Chip>();

  function create(name: string, value: number): Chip {
    const li = document.createElement("li");
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.style.setProperty("--hue", `var(--${hueFor(name)})`);

    const nameEl = document.createElement("span");
    nameEl.className = "chip-name";
    nameEl.textContent = name;
    const valueEl = document.createElement("span");
    valueEl.className = "chip-value";

    chip.append(nameEl, valueEl);
    keepFocus(chip);
    chip.addEventListener("click", () => insertAtCaret(input, name));
    li.append(chip);
    return { li, chip, valueEl, value };
  }

  function show(entry: Chip, name: string, value: number): void {
    entry.value = value;
    entry.valueEl.textContent = formatNumber(value);
    entry.chip.title = `${name} = ${value}`;
  }

  function flash(chip: HTMLElement): void {
    chip.classList.remove("changed");
    void chip.offsetWidth; // restart if it's still flashing from the last change
    chip.classList.add("changed");
  }

  function remove(name: string, entry: Chip): void {
    chips.delete(name);
    const out = entry.li.animate(
      reducedMotion.matches
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.9)" }],
      { duration: 150, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    out.finished.then(() => entry.li.remove(), () => entry.li.remove());
  }

  async function refresh(): Promise<void> {
    let vars: Variables;
    try {
      vars = await getVariables();
    } catch {
      return; // keep showing the last known values
    }

    for (const [name, entry] of chips) {
      if (!(name in vars)) remove(name, entry);
    }
    for (const [name, value] of Object.entries(vars)) {
      const existing = chips.get(name);
      if (existing) {
        if (existing.value !== value) {
          show(existing, name, value);
          flash(existing.chip);
        }
      } else {
        // New variables are appended (the server keeps insertion order) and enter via @starting-style
        const entry = create(name, value);
        show(entry, name, value);
        chips.set(name, entry);
        list.append(entry.li);
      }
    }
  }

  document.addEventListener("variables-changed", () => void refresh());
  void refresh();
}
