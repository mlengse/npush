require('dotenv').config()

let obj = require("fs").readdirSync(require("path").join(__dirname, "lib")).reduce(( obj, file ) => Object.assign({}, obj, require("./lib/" + file)), {})

module.exports = class Core {
  constructor(config) {
    if(!config){
      config = Object.assign({}, process.env)
    }
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
    this.poolClose && await this.poolClose()
    if(this.browser){
      !isPM2 && await this.browser.close()
      isPM2 && this.browser.isConnected() && await this.browser.disconnect()
    } 
    this.spinner.stop()
    this.spinner.succeed(`closed apps: ${new Date()}`)
  }

  

  async init() {
    this.spinner.start('init apps')

    let settings = await this.getSettings()
    let dokter = await this.getDokters()

    // console.log(settings)
    // console.log(dokter)

    if(settings.length){
      this.config = Object.assign({}, this.config, {
        CONSPWD: settings[0].cons_pass,
        XCONSID: settings[0].cons_user,
        PCAREUSR: settings[0].pcare_user,
        PCAREPWD: settings[0].pcare_pass,
        KDDOKTER: this.config.KDDOKTER || dokter[0].kdDokter
      })
  
      if(this.config.PCAREUSR.includes('-')){
        this.config.PROVIDER = this.config.PCAREUSR.split('-')[1]
      } else {
        this.config.PROVIDER = this.config.PCAREUSR
      }
  
    }


    // this.getTgl()
    // this.getUser()
    // this.getPlan()

    // await this.browserInit()
    // await this.syncTglLibur()
  }
}