const ora = require('ora')
let textS = ''
// console.log(process.platform === 'win32' && !process.env.NODE_APP_INSTANCE)
// console.log(process.platform === 'win32')
// console.log(!process.env.NODE_APP_INSTANCE)
exports.spinner =(!process.env.NODE_APP_INSTANCE) ? ora({
  stream: process.stdout
}): {
  start: text => {
    // if(textS !== text) {
    //   textS = text
    //   console.log(`start: ${text}`)
    // }
  },
  stop: _ => '',
  succeed: text => console.log(`done: ${text}`),
  warn: text => console.info(`warn: ${text}`),
  info: text => console.info(`info: ${text}`),
  fail: text => console.error(`error: ${text}`)
}