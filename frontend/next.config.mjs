/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker optimization
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Disable telemetry in production
  telemetry: false,

  // Optimize for production
  swcMinify: true,

  // Enable experimental features for better performance
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
