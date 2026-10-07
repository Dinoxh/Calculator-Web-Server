import { getVariables, type Variables } from "./api.js";
import { formatNumber } from "./format.js";
import { insertAtCaret, keepFocus } from "./insert.js";

/** Render the session's variables as chips; tapping one inserts its name. */
export function mountVariables(list: HTMLUListElement, input: HTMLInputElement): void {
  let previous: Variables | undefined;

  async function refresh(): Promise<void> {
    let vars: Variables;
    try {
      vars = await getVariables();
    } catch {
      return; // keep showing the last known values
    }

    const items = Object.entries(vars).map(([name, value]) => {
      const li = document.createElement("li");
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.title = `${name} = ${value}`;
      if (previous && previous[name] !== value) chip.classList.add("changed");

      const nameEl = document.createElement("span");
      nameEl.className = "chip-name";
      nameEl.textContent = name;
      const valueEl = document.createElement("span");
      valueEl.className = "chip-value";
      valueEl.textContent = formatNumber(value);

      chip.append(nameEl, valueEl);
      keepFocus(chip);
      chip.addEventListener("click", () => insertAtCaret(input, name));
      li.append(chip);
      return li;
    });

    list.replaceChildren(...items);
    previous = vars;
  }

  document.addEventListener("variables-changed", () => void refresh());
  void refresh();
}
