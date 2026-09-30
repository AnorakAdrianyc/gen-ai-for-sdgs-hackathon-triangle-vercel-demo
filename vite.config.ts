import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { workflow } from "workflow/vite";
import { createLandsMiddleware } from "./server/lands.mjs";
export default defineConfig(({ mode }) => {
  const api = createLandsMiddleware({
    ...process.env,
    ...loadEnv(mode, process.cwd(), ""),
  });
  return {
    plugins: [
      react(),
      nitro({
        serverDir: "./workflow-server",
        preset: process.env.VERCEL ? "vercel" : "node-server",
      }),
      workflow(),
      {
        name: "lands-api",
        configureServer(server) {
          server.middlewares.use(api);
        },
        configurePreviewServer(server) {
          server.middlewares.use(api);
        },
      },
    ],
  };
});
