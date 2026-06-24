/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for a slim production Docker image.
  output: 'standalone',
  async rewrites() {
    return [] // No rewrites, frontend calls :8000 directly
  },
}

module.exports = nextConfig
