module.exports = {
    apps: [
      {
        name: "backend",
        script: "src/app.js", // Path to your backend entry point
        env: {
          NODE_ENV: "production",
          PORT: 3001, // Backend port
        },
      },
      {
        name: "frontend",
        script: "frontend-standalone/server.js", // Path to your frontend build
        env: {
          NODE_ENV: "production",
          PORT: 3000, // Frontend port
        },
      },
    ],
  };