import type { WorkerClient } from "./workerClient.js";
import type { UnityObject } from "../../Classes/Object.js";

export interface RemoteObjectInfo {
    id: bigint;
    type: string;
    name?: string;
    classID: number;
    methods: string[];
}

export function CreateRemoteObject<T extends UnityObject>(
    client: WorkerClient,
    info: RemoteObjectInfo
): T {
    const methodSet = new Set(info.methods);

    const target = {
        id: info.id,
        name: info.name,
        type: info.type,
        classID: info.classID
    };

    return new Proxy(target, {
        get(target, property) {
            if (property === "then") return undefined;

            if (property in target) {
                return target[property as keyof typeof target];
            }

            if (
                typeof property === "string" &&
                methodSet.has(property)
            ) {
                return (...args: any[]) =>
                    client.call(
                        "CallObject",
                        info.id,
                        property,
                        args
                    );
            }

            return undefined;
        }
    }) as unknown as T;
}