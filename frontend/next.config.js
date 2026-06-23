/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [] // No rewrites, frontend calls :8000 directly
  },
}

module.exports = nextConfig
