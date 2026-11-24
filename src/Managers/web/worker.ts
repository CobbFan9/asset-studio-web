import { AssetsManager } from "../AssetsManager.js";
import { logger } from "../../global.js";

const manager = new AssetsManager();

self.onmessage = async (event) => {
    const { id, method, args } = event.data;

    try {
        let result;

        switch (method) {
            case "CallObject":
                logger.debug(`CallObject called ${event.data}`);
                result = await manager.CallObject(args[0], args[1], args[2]);
                break;

            default:
                result = await (manager as any)[method](...args);
                break;
        }

        self.postMessage({ id, success: true, result });

    } catch (error) {
        self.postMessage({ id, success: false, error: error instanceof Error ? error.message : String(error) });
    }
};