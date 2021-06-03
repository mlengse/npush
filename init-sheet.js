const start = require('./start')
const main = require('./sheet.js')
const { isPuppeteer } = require('./npmls')
module.exports = async (isPM2) => {
  let puppet = await isPuppeteer()
  // console.log(puppeteer)
  if(process.platform !== 'win32' && puppet) {
    start('runner')
  } else {
    await main(isPM2)
  }
}