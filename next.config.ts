import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Imágenes: el backend en Railway servirá uploads desde su dominio (TBD).
  // Cloudflare R2 servirá las imágenes públicas/PDFs — DevOps proveerá el host.
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Reservado para flags futuros (typedRoutes, optimizePackageImports, …).
  },
};

export default nextConfig;
