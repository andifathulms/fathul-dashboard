/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for a slim production Docker image.
  output: 'standalone',
  async rewrites() {
    return [] // No rewrites, frontend calls :8000 directly
  },
  // HTML cache-control is handled in middleware.ts (no-store) so rebuilds are
  // always picked up on refresh — headers() can't override prerendered pages.
}

module.exports = nextConfig
