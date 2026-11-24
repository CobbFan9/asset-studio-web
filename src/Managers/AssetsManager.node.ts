import { Worker } from "node:worker_threads";
import { WorkerClient } from "./node/workerClient.js";
import { CreateRemoteObject } from "./node/remoteObject.js";

import type { SerializedFile } from "../Files/Serialized/SerializedFile.js";
import type { UnityObject } from "../Classes/Object.js";

export class AssetsManagerNode {
    private client: WorkerClient;

    public loadedAssetsFileNames: string[] = [];
    public loadedAssetsFiles: SerializedFile[] = [];
    public unityObjs: Map<bigint, UnityObject> = new Map();

    constructor() {
        const worker = new Worker(
            new URL("./node/worker.js", import.meta.url)
        );

        this.client = new WorkerClient(worker);
    }

    public async LoadFile(data: ArrayBuffer, name: string): Promise<void> {
        await this.client.call("LoadFile", data, name);

        await this.Refresh();
    }

    private async Refresh(): Promise<void> {
        const state = await this.client.call<any>("GetState", true);

        this.loadedAssetsFileNames = state.loadedAssetsFileNames;
        this.loadedAssetsFiles = state.loadedAssetsFiles;

        this.unityObjs = new Map<bigint, UnityObject>();

        for (const info of state.unityObjs) {
            this.unityObjs.set(info.id, CreateRemoteObject<UnityObject>(this.client, info));
        }
    }

    public Dispose(): void {
        this.client.terminate();
    }
}