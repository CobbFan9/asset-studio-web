import { SerializedFile } from "../Files/Serialized/SerializedFile.js"
import { AssetsManager } from "./AssetsManager.js";
import { UnityObject } from "../Classes/Object.js";

export class AssetsManagerRaw {
    public loadedAssetsFileNames: string[] = [];
    public loadedAssetsFiles: SerializedFile[] = [];
    public unityObjs: Map<BigInt, UnityObject> = new Map<BigInt, UnityObject>();

    private client: AssetsManager;

    constructor() {
        this.client = new AssetsManager();
    }

    public LoadFile(data: ArrayBuffer, name: string) {
        this.client.LoadFile(data, name);

        this.Refresh();
    }

    private Refresh() {
        const state = this.client.GetState();

        this.loadedAssetsFileNames = state.loadedAssetsFileNames;
        this.loadedAssetsFiles = state.loadedAssetsFiles;
        this.unityObjs = state.unityObjs;
    }

    public Dispose() {}
}