import { parentPort } from "node:worker_threads";
import { AssetsManager } from "../AssetsManager.js";

if (!parentPort) {
    throw new Error("This module must run inside a worker thread");
}

const manager = new AssetsManager();

parentPort.on("message", async (message) => {
    const { id, method, args } = message;

    try {
        let result: any;

        switch (method) {
            case "CallObject":
                result = await manager.CallObject(
                    args[0],
                    args[1],
                    args[2]
                );
                break;

            default:
                result = await (manager as any)[method](...args);
                break;
        }

        parentPort!.postMessage({
            id,
            success: true,
            result
        });

    } catch (error) {
        parentPort!.postMessage({
            id,
            success: false,
            error: error instanceof Error
                ? error.message
                : String(error)
        });
    }
});