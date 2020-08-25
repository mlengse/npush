const {
  CHROME_PATH,
  USER_DATA_PATH,
} = process.env
let pptrOpt = {}
// console.log(process.platform)
if(process.platform === 'win32' || CHROME_PATH ) {
  pptrOpt = {
    headless: true,
    // headless: false,
    executablePath: `${CHROME_PATH}`, 
    userDataDir: `${USER_DATA_PATH}`,
    args: [
      // '--content-shell-hide-toolbar',
      // '--hide',
      // '--hide-scrollbars',
      // '--window-position=0,0',
      // '--window-size=0,0'
    ]
  }
} else {
  pptrOpt = {
    headless: true,
    userDataDir: `${USER_DATA_PATH}`,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
    ]
  }
}

module.exports = Object.assign({}, 
  process.env, 
  {
    pptrOpt,
    waitOpt: {
      waitUntil: 'networkidle2',
      timeout: 0
    }
  })