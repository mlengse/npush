exports.npmls = async () => await new Promise((resolve, reject) => require('child_process').exec('npm ls --json', (err, stdout, stderr) => {
  if (err) reject(err)
  let result = JSON.parse(stdout)
  resolve(result.dependencies)
}))

exports.isPuppeteer = async () => !!(await this.npmls()).puppeteer

