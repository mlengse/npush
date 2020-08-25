const ora = require('ora')
exports.spinner =(process.platform === 'win32' && !process.env.NODE_APP_INSTANCE) ? ora({
  stream: process.stdout
}): {
  start: _ => '',
  stop: _ => '',
  succeed: text => console.log(text),
  warn: text => console.info(text),
  info: text => console.info(text),
  fail: text => console.error(text)
}