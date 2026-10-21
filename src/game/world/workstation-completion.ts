export type WorkstationTaskState = Readonly<{
  owner: string;
  task: string;
  active: boolean;
  completed: boolean;
}>;

/** Publish ownership changes immediately, independent of actor mount/frame order. */
export class WorkstationTaskStates extends Map<string, WorkstationTaskState> {
  private listeners = new Map<string, Set<(state: WorkstationTaskState | undefined) => void>>();

  constructor() { super(); }

  subscribe(id: string, listener: (state: WorkstationTaskState | undefined) => void) {
    const listeners = this.listeners.get(id) ?? new Set();
    listeners.add(listener);
    this.listeners.set(id, listeners);
    listener(this.get(id));
    return () => {
      listeners.delete(listener);
      if (!listeners.size) this.listeners.delete(id);
    };
  }

  override set(id: string, state: WorkstationTaskState) {
    super.set(id, state);
    for (const listener of this.listeners.get(id) ?? []) listener(state);
    return this;
  }

  override delete(id: string) {
    const deleted = super.delete(id);
    if (deleted) for (const listener of this.listeners.get(id) ?? []) listener(undefined);
    return deleted;
  }

  override clear() {
    for (const id of this.keys()) this.delete(id);
  }
}
