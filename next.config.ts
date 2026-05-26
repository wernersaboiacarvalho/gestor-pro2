import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  serverExternalPackages: ["bcryptjs", "@prisma/client", "prisma", "@prisma/adapter-pg", "pg"],
}

export default nextConfig
