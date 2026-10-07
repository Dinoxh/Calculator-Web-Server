import { Spring, project, rubberband } from "./spring.js";

// iOS-style segmented control: tap a segment, or grab the selected one and drag the
// thumb. The thumb tracks the finger 1:1, rubber-bands past the ends, and on release
// settles on the segment its momentum points at, inheriting the release velocity.

const PADDING = 2; // matches .segmented padding
const HYSTERESIS = 10; // px before a press becomes a drag
const DECELERATION = 0.99; // a small control: snappier than scroll's 0.998

export function mountSegmented(root: HTMLFieldSetElement, reducedMotion: MediaQueryList): void {
  const thumb = root.querySelector<HTMLElement>(".thumb")!;
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  const labels = radios.map((r) => r.closest("label")!);
  const count = radios.length;

  const segment = (): number => (root.clientWidth - PADDING * 2) / count;
  const selected = (): number => Math.max(0, radios.findIndex((r) => r.checked));
  const nearest = (x: number): number => Math.max(0, Math.min(count - 1, Math.round(x / segment())));

  const spring = new Spring(selected() * segment(), { damping: 1, response: 0.35 }, (x) => {
    thumb.style.transform = `translateX(${x}px)`;
  });
  root.classList.add("js"); // JS now owns the thumb's position (CSS positions it until then)
  spring.set(selected() * segment());

  const settle = (index: number): void => {
    const target = index * segment();
    if (reducedMotion.matches) spring.set(target);
    else spring.to(target);
  };

  // Any selection change (tap, keyboard arrows, restored preference) settles from wherever
  // the thumb is right now, at whatever speed it's moving
  root.addEventListener("change", () => settle(selected()));

  // ---------- Drag ----------

  let pointerId: number | null = null;
  let dragging = false;
  let startX = 0;
  let grabOffset = 0;
  let samples: { x: number; t: number }[] = [];
  let suppressClickUntil = 0;

  const thumbXFor = (clientX: number): number => {
    const max = (count - 1) * segment();
    const raw = clientX - root.getBoundingClientRect().left - PADDING - grabOffset;
    if (raw < 0) return -rubberband(-raw, segment());
    if (raw > max) return max + rubberband(raw - max, segment());
    return raw;
  };

  const highlight = (index: number | null): void => {
    labels.forEach((label, i) => label.classList.toggle("under", i === index));
  };

  root.addEventListener("pointerdown", (e) => {
    if (pointerId !== null || e.button !== 0) return; // ignore extra fingers
    const local = e.clientX - root.getBoundingClientRect().left - PADDING;
    if (Math.floor(local / segment()) !== selected()) return; // only the selected segment is grabbable
    pointerId = e.pointerId;
    startX = e.clientX;
    // Respect where the thumb was grabbed, using its on-screen (presentation) position
    grabOffset = local - spring.value;
    samples = [{ x: e.clientX, t: e.timeStamp }];
    root.classList.add("pressed"); // instant feedback on touch-down
  });

  root.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < HYSTERESIS) return;
      dragging = true;
      try { root.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      root.classList.add("dragging");
      spring.stop();
    }
    samples.push({ x: e.clientX, t: e.timeStamp });
    samples = samples.filter((s) => e.timeStamp - s.t < 100);
    const x = thumbXFor(e.clientX);
    spring.set(x);
    highlight(nearest(x));
  });

  const release = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    root.classList.remove("pressed");
    if (!dragging) return; // a plain tap: the label's own click selects it
    dragging = false;
    root.classList.remove("dragging");
    highlight(null);
    // Only the click that this release itself produces; it may not come at all (pointer capture)
    suppressClickUntil = performance.now() + 50;

    const first = samples[0]!;
    const last = samples[samples.length - 1]!;
    const elapsed = (last.t - first.t) / 1000;
    const velocity = elapsed > 0 ? (last.x - first.x) / elapsed : 0;

    // Land where the gesture is going, not where it was let go
    const index = e.type === "pointercancel" ? selected() : nearest(spring.value + project(velocity, DECELERATION));
    spring.velocity = velocity; // hand the finger's speed to the spring
    if (index !== selected()) {
      radios[index]!.checked = true;
      radios[index]!.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      settle(index);
    }
  };
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);

  // A drag ends with a click on whatever is under the pointer; it isn't a tap
  root.addEventListener("click", (e) => {
    if (performance.now() > suppressClickUntil) return;
    suppressClickUntil = 0;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  new ResizeObserver(() => spring.set(selected() * segment())).observe(root);
}
