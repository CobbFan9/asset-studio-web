import { WorkerClient } from "./web/workerClient.js";
import { CreateRemoteObject } from "./web/remoteObject.js";
import type { SerializedFile } from "../Files/Serialized/SerializedFile.js";
import { UnityObject } from "../Classes/Object.js";

export class AssetsManagerWeb {
    private client: WorkerClient;

    public loadedAssetsFileNames: string[] = [];
    public loadedAssetsFiles: SerializedFile[] = [];
    public unityObjs: Map<BigInt, UnityObject> = new Map<BigInt, UnityObject>();

    constructor() {
        const worker = new Worker(
            new URL("./web/worker.js", import.meta.url),
            { type: "module" }
        );

        this.client = new WorkerClient(worker);
    }

    public async LoadFile(data: ArrayBuffer, name: string) {
        await this.client.call("LoadFile", data, name);

        await this.Refresh();
    }

    private async Refresh() {
        const state = await this.client.call<any>("GetState", true);

        this.loadedAssetsFileNames = state.loadedAssetsFileNames;
        this.loadedAssetsFiles = state.loadedAssetsFiles;

        this.unityObjs = new Map<BigInt, UnityObject>();

        for (const info of state.unityObjs) {
            this.unityObjs.set(
                info.id,
                CreateRemoteObject<UnityObject>(this.client, info)
            );
        }
    }

    public Dispose() {
        this.client.terminate();
    }
}