import { access, cp, readFile, readdir, rm, rmdir, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const staticDir = (await exists(".vercel/output/static/assets"))
  ? ".vercel/output/static"
  : (await exists(".output/public/assets"))
    ? ".output/public"
    : null;

if (staticDir) {
  await rm("dist", { recursive: true, force: true });
  await cp(staticDir, "dist", { recursive: true });
}

await cp("demo", "dist/demo", { recursive: true });

if (await exists(".vercel/output/static")) {
  await cp("demo", ".vercel/output/static/demo", { recursive: true });
  await restoreIndex(".vercel/output/static");
}

await restoreIndex("dist");
await removeSymlinkedFunctions();

async function removeSymlinkedFunctions() {
  const functionsRoot = ".vercel/output/functions";
  const configPath = ".vercel/output/config.json";
  if (!(await exists(functionsRoot)) || !(await exists(configPath))) return;

  const symlinkedRoutes = new Set();
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = `${dir}/${entry.name}`;
      if (entry.isSymbolicLink() && entry.name.endsWith(".func")) {
        const route = path.slice(functionsRoot.length, -".func".length);
        symlinkedRoutes.add(route);
        await unlink(path);
      } else if (entry.isDirectory()) {
        await walk(path);
      }
    }
  }
  await walk(functionsRoot);
  await removeEmptyDirs(functionsRoot);

  if (symlinkedRoutes.size === 0) return;
  const config = JSON.parse(await readFile(configPath, "utf8"));
  config.routes = (config.routes ?? []).filter(
    (route) => !symlinkedRoutes.has(route.dest) && !symlinkedRoutes.has(route.src),
  );
  await writeFile(configPath, JSON.stringify(config));
}

async function removeEmptyDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      await removeEmptyDirs(`${dir}/${entry.name}`);
    }
  }
  if (dir === ".vercel/output/functions") return;
  try {
    await rmdir(dir);
  } catch {
    // The directory still holds a real function.
  }
}

async function restoreIndex(dir) {
  const indexPath = `${dir}/index.html`;
  if (await exists(indexPath)) return;
  const templatePath =
    ".vercel/output/functions/__server.func/_chunks/renderer-template.mjs";
  if (!(await exists(templatePath))) return;
  const source = await readFile(templatePath, "utf8");
  const match = source.match(/new HTTPResponse\('([\s\S]*?)', \{ headers:/);
  if (!match) return;
  const html = match[1]
    .replaceAll("\\n", "\n")
    .replaceAll("\\'", "'")
    .replaceAll("\\/", "/");
  await writeFile(indexPath, html);
}
