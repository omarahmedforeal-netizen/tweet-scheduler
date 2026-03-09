/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['twitter-api-v2']
  },
  swcMinify: true,
  compiler: {
    // Preserve UTF-8 characters during compilation
  },
  webpack: (config, { isServer }) => {
    // Ensure UTF-8 output for Arabic text
    if (!isServer) {
      config.output = config.output || {}
      config.output.charset = true
    }
    return config
  }
}

module.exports = nextConfig
