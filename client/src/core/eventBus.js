/**
 * EventBus — central pub/sub spine.
 * Singleton: all modules share the same instance.
 */
class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) this._listeners.delete(event);
    }
  }

  emit(event, data) {
    const handlers = this._listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[EventBus] Error in "${event}":`, err);
      }
    }
  }

  clear() {
    this._listeners.clear();
  }
}

// Singleton
const eventBus = new EventBus();
export default eventBus;
