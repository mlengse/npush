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
    // let tgl = app.tgl()
    let tgl = 31
    while(tgl){
      let tglHariIni = `${tgl}-${'05-2021'}`
      // let tglHariIni = `${tgl}-${app.blnThn()}`
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
      if(['2', '26'].indexOf(kunj.tgldaftar.split('-')[0]) > -1
      || (kunj.kunjSakit && !kunj.status.includes('dilayani'))
      ){
        let res = await app.deletePendaftaran({
          noKartu: kunj.peserta.noKartu,
          tgldaftar: kunj.tgldaftar,
          noUrut: kunj.noUrut,
          kdPoli: kunj.poli.kdPoli
        })
        app.spinner.succeed(`tgl ${kunj.tgldaftar}, no urut ${kunj.noUrut}, nama ${kunj.peserta.nama}, ${kunj.kunjSakit? `kunj sakit ${kunj.Status} ` : 'kunj sehat '}${kunj.poli.nmPoli}`)
        app.spinner.succeed(`${JSON.stringify(res)}`)
      }
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