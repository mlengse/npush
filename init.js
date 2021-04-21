const start = require('./start')
const main = require('./main.js')
const npmls = async () => await new Promise((resolve, reject) => require('child_process').exec('npm ls --json', (err, stdout, stderr) => {
  if (err) reject(err)
  let result = JSON.parse(stdout)
  resolve(result.dependencies)
}))

const isPuppeteer = async () => !!(await npmls()).puppeteer

module.exports = async (isPM2) => {
  let puppet = await isPuppeteer()
  // console.log(puppeteer)
  if(process.platform !== 'win32' && puppet) {
    start('runner')
  } else {
    await main(isPM2)
  }
}