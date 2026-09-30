import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = JSON.parse(readFileSync(path.join(root, "demo/data/buildings.json"), "utf8"));
const indexHtml = readFileSync(path.join(root, "demo/index.html"), "utf8");
const infoHtml = readFileSync(path.join(root, "demo/infographic.html"), "utf8");

function bandFor(score) {
  const band = db.scoring.bands.find((item) => score >= item.min && score <= item.max);
  assert.ok(band, `no band for score ${score}`);
  return band.id;
}

const roleIds = new Set(db.network.roles.map((role) => role.id));
const factorIds = db.scoring.factors.map((factor) => factor.id);

assert.equal(db.buildings.length, 18);
assert.equal(new Set(db.buildings.map((building) => building.id)).size, 18);
assert.equal(db.buildings.some((building) => /wang fuk/i.test(building.name)), false);

for (const building of db.buildings) {
  const score = factorIds.reduce((total, id) => total + building.factorPoints[id], 0);
  assert.equal(score, building.risk.score, building.id);
  assert.equal(building.risk.level, bandFor(score), building.id);
  assert.ok(building.coordinates.lng > 113.8 && building.coordinates.lng < 114.5);
  assert.ok(building.coordinates.lat > 22.15 && building.coordinates.lat < 22.6);
  assert.ok(building.scene.floors > 0);
}

for (const [field, roles] of Object.entries(db.visibility)) {
  assert.ok(roles.length > 0, field);
  for (const role of roles) assert.ok(roleIds.has(role), `${field}:${role}`);
}

assert.equal(db.visibility.tenderQuotes.includes("resident"), false);
assert.equal(db.visibility.tenderQuotes.includes("contractor"), false);
assert.equal(db.visibility.residentContact.includes("resident"), false);

const edgeIds = new Set(["case-record", ...roleIds]);
for (const edge of db.network.edges) {
  assert.ok(edgeIds.has(edge.from), edge.from);
  assert.ok(edgeIds.has(edge.to), edge.to);
}

assert.equal(db.network.journey.length, 8);
for (const step of db.network.journey) {
  assert.ok(step.actors.every((actor) => roleIds.has(actor)), step.id);
}

assert.match(indexHtml, /data\/buildings\.json|dashboard\.js/);
assert.match(infoHtml, /infographic\.js/);
assert.doesNotMatch(indexHtml, /src="https?:/);
assert.doesNotMatch(infoHtml, /src="https?:/);
assert.match(readFileSync(path.join(root, "demo/dashboard.js"), "utf8"), /\.\/data\/buildings\.json/);
assert.match(readFileSync(path.join(root, "demo/infographic.js"), "utf8"), /\.\/data\/buildings\.json/);
