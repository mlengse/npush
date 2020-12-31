if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {

  try{
    await app.init()

    app.dataBBTB = []
    app.cekPstSudah =[]

    let kunjIni = (await app.getPendaftaranProvider({
      tanggal: '20-12-2020'
    }))
    .filter(({
      kunjSakit,
      status
    }) => kunjSakit && status )
    .map(({
      noUrut, 
      tgldaftar, 
      peserta: { 
        noKartu 
      },
      poli: {
        kdPoli
      }
    }) => ({
      noUrut,
      noKartu,
      tgldaftar,
      kdPoli
    }))

    console.log(kunjIni.length)

    for( let kunj of kunjIni){
      console.log(kunj)
      let re = await app.deletePendaftaran({
        ...kunj
      })

      console.log(re)
    }


    await app.close(isPM2)

    console.log(`process done: ${new Date()}`)
  }catch(e){
    console.error(JSON.stringify(e))
    console.error(`process error: ${new Date()}`)
  }
}