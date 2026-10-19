import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    // Some browsers and link-preview crawlers always ask for /favicon.ico; point them at the generated icon.
    return [{ source: "/favicon.ico", destination: "/icon", permanent: false }];
  },
};

export default nextConfig;
