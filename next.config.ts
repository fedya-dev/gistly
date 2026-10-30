import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Make sure the Prisma engines end up in the standalone bundle
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@prisma/engines/**", "./node_modules/.prisma/client/**"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
