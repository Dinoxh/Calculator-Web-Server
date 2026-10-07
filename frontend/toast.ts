// A single transient toast with one action (e.g. "Undo"). It rises out of the composer
// and leaves the way it came. Hovering or focusing it holds it open.

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

export type Toast = { dismiss: () => void; run: () => void };

let current: Toast | null = null;

export function showToast(
  host: HTMLElement,
  message: string,
  action: { label: string; run: () => void },
  reducedMotion: MediaQueryList,
  ms = 6000,
): Toast {
  current?.dismiss();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  const text = document.createElement("span");
  text.textContent = message;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "toast-action";
  button.textContent = action.label;
  toast.append(text, button);
  host.append(toast); // enters via @starting-style

  let timer = 0;
  let gone = false;
  const arm = (): void => { clearTimeout(timer); timer = window.setTimeout(dismiss, ms); };
  const hold = (): void => clearTimeout(timer);

  function dismiss(): void {
    if (gone) return;
    gone = true;
    clearTimeout(timer);
    if (current === handle) current = null;
    // Exit along the entry path: back down into the composer
    const out = toast.animate(
      reducedMotion.matches
        ? { opacity: [1, 0] }
        : { opacity: [1, 0], transform: ["translate(-50%, 0) scale(1)", "translate(-50%, 8px) scale(0.96)"] },
      { duration: 150, easing: EASE_OUT, fill: "forwards" },
    );
    out.finished.then(() => toast.remove(), () => toast.remove());
  }

  button.addEventListener("click", () => {
    dismiss();
    action.run();
  });
  toast.addEventListener("pointerenter", hold);
  toast.addEventListener("pointerleave", arm);
  toast.addEventListener("focusin", hold);
  toast.addEventListener("focusout", arm);
  arm();

  // Once the toast has gone (timed out, dismissed or used), its action is no longer on offer
  const handle: Toast = { dismiss, run: () => { if (!gone) button.click(); } };
  current = handle;
  return handle;
}
