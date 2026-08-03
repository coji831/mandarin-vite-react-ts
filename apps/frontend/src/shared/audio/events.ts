/**
 * @file shared/audio/events.ts
 * @description Typed event union + minimal typed event emitter for AudioManager.
 *
 * Events drive the UI snapshot. There is deliberately NO `timeupdate` event —
 * progress ticks stay out of the store (no surface needs them).
 */

/**
 * Map of event type → event payload. Keyed so listeners get per-type narrowing.
 */
export interface AudioEventMap {
  playing: { type: "playing"; index: number };
  paused: { type: "paused"; index: number | null };
  stopped: { type: "stopped" };
  indexchange: { type: "indexchange"; index: number | null };
  completed: { type: "completed" };
  ratechange: { type: "ratechange"; rate: number };
  error: { type: "error"; message: string; index?: number | null };
  blocked: { type: "blocked" };
  skipped: { type: "skipped"; index: number };
}

export type AudioEventType = keyof AudioEventMap;

/** Discriminated union of every audio event. */
export type AudioEvent = AudioEventMap[AudioEventType];

type Listener<K extends AudioEventType> = (event: AudioEventMap[K]) => void;

/**
 * Minimal typed event emitter (on/off/emit). `on` returns an unsubscribe
 * function. Listeners for a specific type are narrowed to that event's shape.
 */
export class TypedEventEmitter {
  private listeners = new Map<AudioEventType, Set<Listener<AudioEventType>>>();

  on<K extends AudioEventType>(type: K, callback: Listener<K>): () => void {
    const set = this.listeners.get(type) ?? new Set<Listener<AudioEventType>>();
    set.add(callback as Listener<AudioEventType>);
    this.listeners.set(type, set);
    return () => this.off(type, callback);
  }

  off<K extends AudioEventType>(type: K, callback: Listener<K>): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(callback as Listener<AudioEventType>);
    }
  }

  emit<K extends AudioEventType>(event: AudioEventMap[K]): void {
    const set = this.listeners.get(event.type);
    if (!set) return;
    // Copy so listeners can unsubscribe during emit without mutating the set.
    for (const callback of [...set]) {
      callback(event as AudioEvent);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
