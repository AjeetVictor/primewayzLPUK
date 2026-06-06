module.exports = {
  apps: [
    {
      name: 'primewayz-uk',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'scripts/start-server.ts',
      interpreter: 'node',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
