const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
});

module.exports = withPWA({
  output: 'standalone', // Enable standalone mode for Docker compatibility
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Proxy API requests to the backend
      },
    ];
  },
  images: {
    domains: ['images.igdb.com'], // Allow IGDB's image domain
  },
});