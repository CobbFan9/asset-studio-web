export class WorkerClient {
    private worker: Worker;
    private callbacks = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void; }>();

    private nextId = 0;

    constructor(worker: Worker) {
        this.worker = worker;

        this.worker.onmessage = (event) => {
            const { id, success, result, error } = event.data;

            const callback = this.callbacks.get(id);
            if (!callback) return;

            this.callbacks.delete(id);

            if (success) {
                callback.resolve(result);
            } else {
                callback.reject(new Error(error));
            }
        };
    }

    call<T>(method: string, ...args: any[]): Promise<T> {
        const id = this.nextId++;

        return new Promise<T>((resolve, reject) => {
            this.callbacks.set(id, { resolve, reject });

            this.worker.postMessage({ id, method, args });
        });
    }

    terminate() {
        this.worker.terminate();
    }
}