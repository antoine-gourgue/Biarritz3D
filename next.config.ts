import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sortie standalone → image Docker de runtime minimale
  output: "standalone",
};

export default nextConfig;
