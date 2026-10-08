import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
    // Vercel's free plan caps how many images it will resize per month --
    // once that's used up, every NEW image (any photo it hasn't already
    // processed) starts failing with "Payment Required" instead of
    // showing, no matter how small the photo is. That's what broke the
    // menu photos. Skipping Vercel's resizing step removes that cap
    // entirely -- the browser just loads each photo directly, which is a
    // fine trade now that admin-uploaded photos are already compressed
    // client-side before they're stored (see lib/compress-image.ts).
    unoptimized: true,
  },
};

export default nextConfig;
