import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/get",
        destination: "https://extension.typepilot.org",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
