import { EndianBinaryReader } from "../Util/EndianBinaryReader.js";
import { FileReader } from "../Util/FileReader.js";
import { FileType } from "../Enums/FileType.js";
import { ClassIDType } from "../Enums/ClassIDType.js"
import { BundleFile } from "../Files/Bundle/BundleFile.js";
import { UnityVersion } from "../Util/UnityVersions.js"
import { SerializedFile } from "../Files/Serialized/SerializedFile.js"
import { SerializedFileFormatVersion } from "../Files/Serialized/Models/SerializedFileFormatVersion.js"
import { ObjectReader } from "../Util/ObjectReader.js";
import { UnityObject } from "../Classes/Object.js";
import { NamedObject } from "../Classes/NamedObject.js";
import { Texture2D } from "../Classes/Texture2D.js";
import path from "../Util/path/index.js";
import type { RemoteObjectInfo } from "./web/remoteObject.js";

export class AssetsManager {
    public loadedAssetsFileNames: string[] = [];
    public loadedAssetsFiles: SerializedFile[] = [];
    public resourceReaders = new Map<string, FileReader>()
    public unityObjs: Map<BigInt, UnityObject> = new Map<BigInt, UnityObject>();

    public LoadFile(data: ArrayBuffer, name: string) {
        const endianReader = new EndianBinaryReader(data)
        const fileReader = new FileReader(name, endianReader);

        this.LoadFileByType(fileReader);
    }

    public GetState(remote: true): {
        loadedAssetsFileNames: string[];
        loadedAssetsFiles: SerializedFile[];
        unityObjs: RemoteObjectInfo[];
    };

    public GetState(remote?: false): {
        loadedAssetsFileNames: string[];
        loadedAssetsFiles: SerializedFile[];
        unityObjs: Map<bigint, UnityObject>;
    };

    public GetState(remote = false) {
        return {
            loadedAssetsFileNames: this.loadedAssetsFileNames,
            loadedAssetsFiles: this.loadedAssetsFiles,

            unityObjs: remote
                ? Array.from(this.unityObjs.entries()).map(([id, obj]) => ({
                    id,
                    type: obj.constructor.name,
                    ...(obj instanceof NamedObject ? { name: obj.m_Name } : {}),
                    classID: obj.classID,
                    methods: this.GetMethods(obj)
                }))
                : this.unityObjs
        };
    }

    private GetMethods(obj: UnityObject): string[] {
        const methods = new Set<string>();

        let prototype = Object.getPrototypeOf(obj);

        while (prototype && prototype !== Object.prototype) {
            for (const name of Object.getOwnPropertyNames(prototype)) {
                if (
                    name !== "constructor" &&
                    typeof (obj as any)[name] === "function"
                ) {
                    methods.add(name);
                }
            }

            prototype = Object.getPrototypeOf(prototype);
        }

        return [...methods];
    }

    public async CallObject(id: BigInt, method: string, args: any[]) {
        const obj = this.unityObjs.get(id);

        if (!obj) {
            throw new Error(`Object ${id} not found`);
        }

        const fn = (obj as any)[method];

        if (typeof fn !== "function" || method === "constructor") {
            throw new Error(`Method ${method} not found`);
        }

        return await fn.apply(obj, args);
    }

    private LoadFileByType(reader: FileReader) {
        switch (reader.FileType) {
            case FileType.BundleFile:
                this.LoadBundleFile(reader);
        }

        this.ReadAssets();
    }

    private LoadBundleFile(reader: FileReader) {
        const bundleFile = new BundleFile(reader, false);
        console.log(bundleFile);

        let isLoaded = this.LoadBundleFiles(reader, bundleFile)

        if (bundleFile.IsDataAfterBundle) {
            throw new Error("Data after bundle not supported") //TODO
        }

        return isLoaded
    }

    private LoadBundleFiles(reader: FileReader, bundle: BundleFile): boolean {
        for (const file of bundle.fileList) {
            if (file.stream.isAllZero()) {
                continue;
            }

            file.stream.offset = 0;

            const dummyPath = path.join(path.dirname(reader.FullPath), file.fileName);
            const subReader = new FileReader(dummyPath, file.stream)
            if (subReader.FileType == FileType.AssetsFile) {
                if (!this.LoadAssetsFromMemory(subReader, reader.FullPath, bundle.m_Header.unityRevision)) {
                    return false;
                }
            } else {
                console.log(`Setting resS with len: ${subReader.view.byteLength}`);
                this.resourceReaders.set(file.fileName, subReader);
            }
        }

        return true;
    }

    private LoadAssetsFromMemory(reader: FileReader, originalPath: string, assetBundleUnityVersion?: UnityVersion): boolean {
        if (reader.FileName in this.loadedAssetsFileNames) {
            console.info(`Skipping ${reader.FileName} as it is loaded already`);

            return true;
        }

        try {
            const assetsFile = new SerializedFile(reader, this);
            assetsFile.originalPath = originalPath;

            if (assetBundleUnityVersion !== undefined && assetsFile.header.m_Version < SerializedFileFormatVersion.Unknown_7) {
                assetsFile.version = assetBundleUnityVersion;
            }

            if (assetsFile.version.isStripped) {
                if (assetBundleUnityVersion === undefined) {
                    throw new Error("AssetsFile UnityVersion was stripped and could not be found");
                }

                console.warn(`AssetsFile UnityVersion was stripped. Assumed version is ${assetBundleUnityVersion.toString()}`);
                assetsFile.version = assetBundleUnityVersion;
            }

            this.loadedAssetsFiles.push(assetsFile);
            this.loadedAssetsFileNames.push(reader.FileName);

        } catch (err) {
            console.warn(`Failed to load AssetsFile: ${reader.FileName} It may be a resS ${err}`);

            this.resourceReaders.set(reader.FileName, reader);

            return false;
        }

        return true;
    }

    private ReadAssets() {
        for (let assetsFile of this.loadedAssetsFiles) {
            for (let objectInfo of assetsFile.m_Objects) {
                let objectReader = new ObjectReader(assetsFile.reader, assetsFile, objectInfo);
                //try {
                let obj: UnityObject | null = null;

                if (objectReader.type == ClassIDType.Texture2D) {
                    obj = new Texture2D(objectReader);
                } else {
                    obj = new UnityObject(objectReader);
                }

                if (obj !== null) {
                    assetsFile.AddObject(obj);
                }

                //} catch (err) {
                //    console.error(`Failed to load object ${assetsFile.originalPath} error: ${err}`);
                //}
            }
        }
    }
}