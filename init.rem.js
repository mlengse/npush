const start = require('./start')
const main = require('./rem.js')

module.exports = (isPM2) => {
  if(process.platform !== 'win32') {
    start('runner')
  } else {
    ;(async() => {
      await main(isPM2)
    })()
  }
}