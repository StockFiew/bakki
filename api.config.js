module.exports = {
  apps : [{
    name: 'stockfiew-backend',
    script: 'app.js',
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "development",
      PORT: 3000
    }
  }]
}
