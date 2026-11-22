export interface LoadingSnapshot {
    readonly pendingCount: number;
    readonly message?: string;
}

const idleSnapshot: LoadingSnapshot = { pendingCount: 0 };

/** One completion token per task prevents parallel requests from hiding each other. */
export function createLoadingStore() {
    const tasks = new Map<symbol, string | undefined>();
    const listeners = new Set<() => void>();
    let snapshot = idleSnapshot;

    function publish() {
        snapshot = tasks.size ? { pendingCount: tasks.size, message: [...tasks.values()].findLast((message) => Boolean(message)) } : idleSnapshot;
        for (const listener of listeners) listener();
    }

    function start(message?: string): () => void {
        const token = Symbol('loading-task');
        tasks.set(token, message);
        publish();
        return () => {
            // Cleanup can safely run from both finally and an effect cleanup.
            if (tasks.delete(token)) publish();
        };
    }

    async function run<T>(task: () => Promise<T>, message?: string): Promise<T> {
        const finish = start(message);
        try {
            return await task();
        } finally {
            finish();
        }
    }

    return {
        start,
        run,
        getSnapshot: () => snapshot,
        getServerSnapshot: () => idleSnapshot,
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}

// Consumed by browser hooks and the browser API client; never started during SSR.
export const globalLoading = createLoadingStore();
