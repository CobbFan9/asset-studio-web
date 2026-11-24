import { AssetsManagerNode, Texture2D } from "@cobbfan9/asset-studio-web";
import fs from 'node:fs';
import path from 'node:path';

const ASSET_NAME = "shared_resourcecontainer";
const ASSET_VERSION = "1100059"

let assetsManager: AssetsManagerNode | null = null

async function main() {
    let resp = await fetch(`https://swgoh-assets.lego-fan9.workers.dev/assets?version=${ASSET_VERSION}&item=${ASSET_NAME}`);
    if (!resp.ok) {
        console.error(`HTTP error! status: ${resp.status}`);
        return;
    }

    const buffer = await resp.arrayBuffer();

    assetsManager = new AssetsManagerNode();
    await assetsManager.LoadFile(buffer, ASSET_NAME);

    for (const obj of assetsManager.unityObjs.values()) {
        if (obj.classID === 28) {
            const texture = obj as Texture2D;

            const img = await texture.Export();
            if (img === null) continue;

            saveImg(await texture.GetName(), img);
        }
    }

    assetsManager.Dispose();
}

function saveImg(name: string, data: string) {
    const base64 = data.replace(/^data:image\/png;base64,/, '');
    const outPath = `test_out/${name}.png`;
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
}

main();