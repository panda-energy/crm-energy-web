import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Images: backend on Railway will serve uploads from its domain (TBD).
  // Cloudflare R2 will serve public images/PDFs -- DevOps will provide the host.
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Optimize imports for heavy libraries to avoid bundling unused modules.
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "react-markdown",
      "date-fns",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
