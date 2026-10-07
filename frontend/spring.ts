// A minimal 1D spring in Apple's terms: damping ratio + response (seconds).
// It always continues from the current value *and velocity*, so retargeting
// mid-flight (a tap during a settle, a drag release) never has a seam.

export type SpringConfig = { damping: number; response: number };

export class Spring {
  value: number;
  velocity = 0; // units per second
  private target: number;
  private frame = 0;
  private last = 0;

  constructor(value: number, private config: SpringConfig, private onUpdate: (value: number) => void) {
    this.value = value;
    this.target = value;
  }

  /** Animate to `target`, carrying the current velocity (or a handed-off one). */
  to(target: number, velocity = this.velocity): void {
    this.target = target;
    this.velocity = velocity;
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.step);
    }
  }

  /** Jump without animating (e.g. while the finger drives the value, or on resize). */
  set(value: number, velocity = 0): void {
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = velocity;
    this.onUpdate(value);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private step = (now: number): void => {
    // Clamp long frames (background tab, jank) so the integration stays stable
    let dt = Math.min((now - this.last) / 1000, 1 / 30);
    this.last = now;

    const { damping, response } = this.config;
    const stiffness = (2 * Math.PI / response) ** 2;
    const friction = (4 * Math.PI * damping) / response;

    // Semi-implicit Euler in small sub-steps
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      const force = -stiffness * (this.value - this.target) - friction * this.velocity;
      this.velocity += force * h;
      this.value += this.velocity * h;
      dt -= h;
    }

    if (Math.abs(this.value - this.target) < 0.01 && Math.abs(this.velocity) < 1) {
      this.value = this.target;
      this.velocity = 0;
      this.frame = 0;
      this.onUpdate(this.value);
      return;
    }
    this.onUpdate(this.value);
    this.frame = requestAnimationFrame(this.step);
  };
}

/** Where a flick would come to rest (Apple's deceleration projection). */
export function project(velocity: number, decelerationRate: number): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Progressive resistance past a boundary: the further out, the less it follows. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
