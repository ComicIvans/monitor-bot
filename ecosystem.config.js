module.exports = {
  apps: [
    {
      name: "monitor-bot",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "100M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
