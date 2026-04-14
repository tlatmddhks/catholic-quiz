module.exports = {
  apps: [{
    name: 'catholic-quiz',
    cwd: 'D:\\catholic-quiz',
    script: 'node_modules\\next\\dist\\bin\\next',
    args: 'start -p 3003',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
