import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.eval.ts"],
    testTimeout: 30000,
    server: {
      deps: {
        inline: ["libsodium-wrappers", "libsodium-wrappers-sumo", "client-only"],
      },
    },
  },
  ssr: {
    noExternal: ["libsodium-wrappers"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "libsodium-wrappers": path.resolve(
        __dirname,
        "node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js"
      ),
      "libsodium-wrappers-sumo": path.resolve(
        __dirname,
        "node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js"
      ),
    },
  },
});