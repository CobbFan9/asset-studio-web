import type { Worker } from "node:worker_threads";

export class WorkerClient {
    private worker: Worker;
    private callbacks = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; }>();

    private nextId = 0;
    private terminated = false;

    constructor(worker: Worker) {
        this.worker = worker;

        this.worker.on("message", (message) => {
            const { id, success, result, error } = message;

            const callback = this.callbacks.get(id);
            if (!callback) return;

            this.callbacks.delete(id);

            if (success) {
                callback.resolve(result);
            } else {
                callback.reject(new Error(error));
            }
        });

        this.worker.on("error", (error) => {
            this.rejectAll(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );
        });

        this.worker.on("exit", (code) => {
            this.terminated = true;

            if (code !== 0) {
                this.rejectAll(
                    new Error(`Worker exited with code ${code}`)
                );
            } else {
                this.rejectAll(
                    new Error("Worker exited unexpectedly")
                );
            }
        });
    }

    public call<T>(method: string, ...args: any[]): Promise<T> {
        if (this.terminated) {
            return Promise.reject(
                new Error("Worker has been terminated")
            );
        }

        const id = this.nextId++;

        return new Promise<T>((resolve, reject) => {
            this.callbacks.set(id, { resolve, reject });

            try {
                this.worker.postMessage({ id, method, args });
            } catch (error) {
                this.callbacks.delete(id);

                reject(
                    error instanceof Error
                        ? error
                        : new Error(String(error))
                );
            }
        });
    }

    private rejectAll(error: Error): void {
        for (const callback of this.callbacks.values()) {
            callback.reject(error);
        }

        this.callbacks.clear();
    }

    public terminate(): Promise<number> {
        this.terminated = true;

        this.rejectAll(
            new Error("Worker has been terminated")
        );

        return this.worker.terminate();
    }
}