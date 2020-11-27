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

    let settings = await this.getSettings()
    let dokter = await this.getDokters()

    this.config = Object.assign({}, this.config, {
      CONSPWD: settings[0].cons_pass,
      XCONSID: settings[0].cons_user,
      PCAREUSR: settings[0].pcare_user,
      PCAREPWD: settings[0].pcare_pass,
      KDDOKTER: this.config.KDDOKTER || dokter[0].kdDokter
    })

    // this.getTgl()
    // this.getUser()
    // this.getPlan()

    // await this.browserInit()
    // await this.syncTglLibur()
  }
}