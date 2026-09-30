import { access, cp, readFile, rm, writeFile } from "node:fs/promises";
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
