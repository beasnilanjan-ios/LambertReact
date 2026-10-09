type Handler = (...args: any[]) => void;

/**
 * Minimal port of Ionic `Events` pub/sub used by app.component.ts
 * (`attendant:loggedin`, `citizen:loggedin`, `guest:visited`).
 */
class EventBus {
  private handlers: Record<string, Handler[]> = {};

  subscribe(topic: string, handler: Handler): void {
    if (!this.handlers[topic]) {
      this.handlers[topic] = [];
    }
    this.handlers[topic].push(handler);
  }

  unsubscribe(topic: string): void {
    delete this.handlers[topic];
  }

  publish(topic: string, ...args: any[]): void {
    console.log(`event ${topic}`, ...args);
    (this.handlers[topic] ?? []).forEach(handler => handler(...args));
  }
}

export const events = new EventBus();
