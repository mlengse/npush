let obj = require("fs").readdirSync(require("path").join(__dirname, "lib")).reduce(( obj, file ) => Object.assign({}, obj, require("./lib/" + file)), {})

module.exports = class Core {
  constructor(config) {
    this.config = config
    this.kunjBlnIni = []
    for( let func in obj) {
      if(func.includes('_')) {
        this[func.split('_').join('')] = async (...args) => await obj[func](Object.assign({}, ...args, {that: this }))
      } else {
        this[func] = obj[func]
      }
    }
  }

  async close(isPM2){
    this.spinner.succeed('close apps')
    this.spinner.stop()
    // if(!isPM2){
    //   await this.browser.close()
    // } else {
    //   if(this.browser.isConnected()) {
    //     await this.browser.disconnect()
    //   }
    // } 
  }

  

  async init() {
    this.spinner.start('init apps')

    // this.getTgl()
    // this.getUser()
    // this.getPlan()

    // await this.browserInit()
    // await this.syncTglLibur()
  }
}