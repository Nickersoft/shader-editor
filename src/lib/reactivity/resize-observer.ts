import { createSubscriber } from "svelte/reactivity";

export class SvelteResizeObserver {
  #subscribe: () => void = () => {};
  #entry: ResizeObserverEntry | null = null;

  constructor(target: Element | null, options?: ResizeObserverOptions) {
    if (!target) return;

    this.#subscribe = createSubscriber((update) => {
      const observer = new ResizeObserver((entries) => {
        this.#entry = entries[0] ?? null;
        update();
      });

      observer.observe(target, options);

      return () => observer.disconnect();
    });
  }

  get current(): ResizeObserverEntry | null {
    this.#subscribe();
    return this.#entry;
  }

  get contentRect(): DOMRectReadOnly | null {
    return this.current?.contentRect ?? null;
  }

  get width(): number {
    return this.contentRect?.width ?? 0;
  }

  get height(): number {
    return this.contentRect?.height ?? 0;
  }
}
