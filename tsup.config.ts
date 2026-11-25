import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "index.default": "src/index.default.ts",
    "index.web": "src/index.web.ts",
    "index.node": "src/index.node.ts",

    "web/worker": "src/Managers/web/worker.ts",
    "node/worker": "src/Managers/node/worker.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2023",
});