import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from external domains used in the original site
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
