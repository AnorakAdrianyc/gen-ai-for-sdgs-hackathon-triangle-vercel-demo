import { mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const dist = dirname(
  fileURLToPath(import.meta.resolve("@loaders.gl/textures")),
);
await mkdir("public/codecs", { recursive: true });
await copyFile(
  resolve(dist, "basis-worker.js"),
  "public/codecs/basis-worker.js",
);
for (const file of [
  "basis_encoder.js",
  "basis_encoder.wasm",
  "basis_transcoder.js",
  "basis_transcoder.wasm",
]) {
  await copyFile(resolve(dist, "libs", file), resolve("public/codecs", file));
}
await copyFile(resolve(dist, "../LICENSE"), "public/codecs/LICENSE").catch(
  () => {},
);
