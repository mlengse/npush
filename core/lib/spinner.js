const ora = require('ora')
exports.spinner =(process.platform === 'win32' && !process.env.NODE_APP_INSTANCE) ? ora({
  stream: process.stdout
}): {
  start: text => console.log(`start: ${text}`),
  stop: _ => '',
  succeed: text => console.log(`done: ${text}`),
  warn: text => console.info(`warn: ${text}`),
  info: text => console.info(`info: ${text}`),
  fail: text => console.error(`error: ${text}`)
}