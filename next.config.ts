import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
    resolveAlias: {
      "libsodium-wrappers":
        "./node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js",
      "libsodium-wrappers-sumo":
        "./node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js",
    },
  },
};

export default nextConfig;