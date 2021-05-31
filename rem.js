console.log(`process test start: ${new Date()}`)

if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const Core = require('./core')
const config = require('./config')

const app = new Core(config)

;(async (isPM2) => {

  try{
    await app.init()

    app.dataBBTB = []
    app.cekPstSudah =[]

    //get kunj bln ini
    let tgl = app.tgl()
    while(tgl){
      let tglHariIni = `${tgl}-${app.blnThn()}`
      let kunjHariIni = await app.getPendaftaranProvider({
        tanggal: tglHariIni
      })
      app.kunjBlnIni = [ ...app.kunjBlnIni, ...kunjHariIni]
      tgl--
    }

    // app.daftUnik = app.uniqEs6(app.kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu))
    // app.spinner.succeed(`${JSON.stringify(app.daftUnik)}`)

    // app.kunjBlnIni = app.kunjBlnIni.filter( e => !e.kunjSakit || (e.kunjSakit && e.status.includes('dilayani')))

    app.kunjTWjr = app.kunjBlnIni.filter( e => !e.kunjSakit || (e.kunjSakit && !e.status.includes('dilayani')))

    for (let kunj of app.kunjTWjr ) {
      console.log(kunj)
    }

    // app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)

    // const kartuList = app.kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu)
    // const uniqKartu = app.uniqEs6(kartuList)
    // app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)

    // app.kunjSakitBlnIni = app.kunjBlnIni.filter( kunj => kunj.kunjSakit)
    // app.spinner.succeed(`kunj sakit total bln ${app.blnThn()}: ${app.kunjSakitBlnIni.length}`    //get rasio rujukan

    await app.close(isPM2)

    console.log(`process done: ${new Date()}`)
  }catch(e){
    console.error(`process error: ${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)

  }
})()