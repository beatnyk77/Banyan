import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
    resolveAlias: {
      "libsodium-wrappers":
        "./node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js",
    },
  },
};

export default nextConfig;