import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "web/worker": "src/Managers/web/worker.ts",
    "node/worker": "src/Managers/node/worker.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2023"
});