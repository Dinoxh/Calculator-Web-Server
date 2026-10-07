// FLIP for the tape: measure, mutate the DOM, then animate each entry from where it
// visually was to where layout put it, so nothing teleports when a result lands.

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const DURATION = 250;
// Only the tail can be on screen; don't measure the whole history
const MAX_ITEMS = 20;
const ID = "flip";

function docTop(el: Element): number {
  return el.getBoundingClientRect().top + scrollY;
}

export function flipTape(list: HTMLElement, mutate: () => void, reduced: boolean): void {
  const items = [...list.children].slice(-MAX_ITEMS) as HTMLElement[];
  const hero = list.lastElementChild?.querySelector<HTMLElement>(".entry-result") ?? null;

  // "First": the on-screen (presentation) position, including any FLIP still in flight,
  // so an interrupted reflow continues from where it visibly is instead of jumping
  const before = new Map(items.map((li) => [li, docTop(li)]));
  const heroBefore = hero?.getBoundingClientRect().height ?? 0;

  for (const el of [...items, hero]) {
    el?.getAnimations().forEach((a) => a.id === ID && a.cancel());
  }

  mutate();
  if (reduced) return;

  // "Last" + "Invert/Play"
  for (const li of items) {
    const dy = before.get(li)! - docTop(li);
    if (Math.abs(dy) < 0.5) continue;
    li.animate({ transform: [`translateY(${dy}px)`, "none"] }, { duration: DURATION, easing: EASE_OUT, id: ID });
  }

  // The previous hero result steps down in size; scale it from its old size, anchored top-right
  if (hero && heroBefore) {
    const ratio = heroBefore / hero.getBoundingClientRect().height;
    if (Math.abs(ratio - 1) > 0.01) {
      hero.animate(
        { transform: [`scale(${ratio})`, "none"], transformOrigin: ["100% 0", "100% 0"] },
        { duration: DURATION, easing: EASE_OUT, id: ID },
      );
    }
  }
}
