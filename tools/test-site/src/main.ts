import { AssetsManagerWeb, Texture2D, logger } from "@cobbfan9/asset-studio-web";

const ASSET_NAME = "shared_uicontainer";
const ASSET_VERSION = "1100059"

let assetsManager: AssetsManagerWeb | null = null
const log = logger.child("test-site")

async function main() {
    let resp = await fetch(`https://swgoh-assets.lego-fan9.workers.dev/assets?version=${ASSET_VERSION}&item=${ASSET_NAME}`);
    if (!resp.ok) {
        log.error(`HTTP error! status: ${resp.status}`);
        return;
    }

    const buffer = await resp.arrayBuffer();

    assetsManager = new AssetsManagerWeb();
    await assetsManager.LoadFile(buffer, ASSET_NAME);

    log.trace(assetsManager);

    for (const obj of assetsManager.unityObjs.values()) {
        if (obj.classID === 28) {
            const texture = obj as Texture2D;

            const img = await texture.Export()
            if (img === null) continue;

            populateImages([img]);
        }
    }
}

function populateImages(images: string[]) {
    const app = document.getElementById("app");
    if (!app) {
        throw new Error("#app not found");
    }

    let ul = app.querySelector("ul");

    if (!ul) {
        ul = document.createElement("ul");
        app.appendChild(ul);
    }

    for (const url of images) {
        const li = document.createElement("li");

        const img = document.createElement("img");
        img.src = url;
        img.alt = "";

        li.appendChild(img);
        ul.appendChild(li);
    }
}

main();