import { insertAtCaret, keepFocus } from "./insert.js";

type Key = { label: string; insert: string; caretBack?: number; aria?: string };

const parens: Key[] = [
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
];

const operators: Key[] = [
  { label: "+", insert: "+" },
  { label: "−", insert: "-", aria: "minus" },
  { label: "×", insert: "*", aria: "times" },
  { label: "÷", insert: "/", aria: "divided by" },
  { label: "%", insert: "%", aria: "modulo" },
  { label: "=", insert: " = ", aria: "assign to" },
];

// The functions Calculator.factor() knows; the caret lands between the parentheses
const functions: Key[] = ["sin", "cos", "exp", "log", "fac", "fib"].map((name) => ({
  label: name,
  insert: `${name}()`,
  caretBack: 1,
}));

export function mountKeypad(row: HTMLElement, input: HTMLInputElement): void {
  const make = (key: Key, kind: string): HTMLButtonElement => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `key ${kind}`;
    button.textContent = key.label;
    if (key.aria) button.setAttribute("aria-label", key.aria);
    keepFocus(button);
    button.addEventListener("click", () => insertAtCaret(input, key.insert, key.caretBack));
    return button;
  };

  const divider = document.createElement("span");
  divider.className = "key-divider";
  divider.setAttribute("aria-hidden", "true");

  row.replaceChildren(
    ...parens.map((k) => make(k, "paren")),
    ...operators.map((k) => make(k, "operator")),
    divider,
    ...functions.map((k) => make(k, "function")),
  );
}
