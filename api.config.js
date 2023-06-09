module.exports = {
  apps : [{
    name: 'stockfiew-backend',
    script: 'app.js',
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}
