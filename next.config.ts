import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ship the seeded demo database with every server function (see src/lib/prisma.ts).
  outputFileTracingIncludes: { "/**": ["./prisma/demo.db"] },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
