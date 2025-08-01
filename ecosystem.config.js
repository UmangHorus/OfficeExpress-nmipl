module.exports = {
  apps: [
    {
      name: "next-app",
      script: "npm",
      args: "start",
      cwd: "/var/www/html/officeexpress",
      instances: 2, // ✅ Better than 'max' for most cases
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // ✅ Added logging (critical for debugging)
      error_file: "/var/log/next-app/error.log",
      out_file: "/var/log/next-app/out.log",
      merge_logs: true,
    },
  ],
};
