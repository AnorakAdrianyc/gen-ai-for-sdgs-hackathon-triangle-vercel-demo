import test from "node:test";
import assert from "node:assert/strict";
import { simplifyModelMaterials } from "../src/map/modelMaterials.ts";
import { bridgeDeckCamera } from "../src/map/deckCompatibility.ts";
import { TileCache } from "../server/tile-cache.mjs";

test("architectural mode removes unused textures without changing geometry", () => {
  const positions = new Float32Array([1, 2, 50]);
  const primitive = {
    attributes: { POSITION: positions },
    material: { normalTexture: { index: 0 } },
  };
  const scene = {
    meshes: [{ primitives: [primitive] }],
    textures: [{}],
    images: [{}],
  };
  simplifyModelMaterials(scene);
  assert.equal(primitive.attributes.POSITION, positions);
  assert.equal(primitive.material.normalTexture, undefined);
  assert.deepEqual(scene.textures, []);
  assert.deepEqual(scene.images, []);
});
test("camera bridge tracks the live transform and cleans up", () => {
  const map = { painter: { transform: { elevation: 12 } } };
  const remove = bridgeDeckCamera(map);
  assert.equal(map.transform.elevation, 12);
  map.painter.transform = { elevation: 30 };
  assert.equal(map.transform.elevation, 30);
  remove();
  assert.equal("transform" in map, false);
});
test("tile cache respects TTL, LRU byte budget and oversized entries", () => {
  let now = 0;
  const cache = new TileCache({
    maxBytes: 6,
    maxEntryBytes: 4,
    ttl: 10,
    now: () => now,
  });
  cache.set("a", Buffer.from("aaa"), "application/json");
  cache.set("b", Buffer.from("bbb"), "application/json");
  assert.equal(cache.get("a").body.toString(), "aaa");
  cache.set("c", Buffer.from("ccc"), "application/json");
  assert.equal(cache.get("b"), undefined);
  cache.set("large", Buffer.alloc(5), "application/json");
  assert.equal(cache.get("large"), undefined);
  assert.equal(cache.bytes, 6);
  now = 11;
  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.get("c"), undefined);
  assert.equal(cache.bytes, 0);
});
