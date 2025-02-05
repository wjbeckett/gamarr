const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
});

module.exports = withPWA({
  output: 'standalone', // Enable standalone mode for Docker compatibility
});