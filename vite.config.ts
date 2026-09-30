import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createLandsMiddleware } from "./server/lands.mjs";
export default defineConfig(({ mode }) => {
  const api = createLandsMiddleware({
    ...process.env,
    ...loadEnv(mode, process.cwd(), ""),
  });
  return {
    plugins: [
      react(),
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
