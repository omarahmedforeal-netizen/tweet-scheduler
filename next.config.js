/** @type {import('next').NextConfig} */
const TerserPlugin = require('terser-webpack-plugin')

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['twitter-api-v2']
  },
  swcMinify: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output = config.output || {}
      config.output.charset = true

      config.optimization = config.optimization || {}
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            output: {
              ascii_only: false,
              utf8: true,
            },
          },
        }),
      ]
    }
    return config
  }
}

module.exports = nextConfig
