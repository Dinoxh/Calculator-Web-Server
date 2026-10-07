/** Insert text at the caret (replacing any selection), then place the caret `caretBack` chars before its end. */
export function insertAtCaret(input: HTMLInputElement, text: string, caretBack = 0): void {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  input.setRangeText(text, start, end, "end");
  const caret = start + text.length - caretBack;
  input.setSelectionRange(caret, caret);
  input.focus();
}

/** Keep the field focused (and the on-screen keyboard up) when a key-like button is pressed. */
export function keepFocus(el: HTMLElement): void {
  el.addEventListener("mousedown", (e) => e.preventDefault());
}
