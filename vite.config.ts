import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({
      publicAssets: [{ dir: "dist/client", baseURL: "/" }],
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
