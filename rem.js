if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {

  try{
    await app.init()

    let kontaks = (await app.listKontak()).filter(({ Tanggal }) => app.checkDateA( Tanggal ))

    let listDaft = (await app.getPendaftaranProvider()).map(({ peserta: {noKartu}}) => noKartu)

    for (kontak of kontaks){
      //check if kontak exist
      if( !listDaft.filter( e => e === kontak.No_JKN ).length ){
        let peserta = await app.getPesertaByNoka({
          noka: kontak.No_JKN
        })
  
        if(peserta){
          kontak = Object.assign({}, kontak, peserta)
  
          //check if kontak not registered yet
          let historyCheck = (await app.getRiwayatKunjungan({ peserta })).filter( ({ tglKunjungan }) => app.checkDate( tglKunjungan, kontak.Tanggal))
  
          if(!historyCheck.length){
  
            let message = await app.sendToWS({kontak})

            if(!JSON.stringify(message.daftResponse).includes('sudah di-entri')) {

              await app.sendToWA({
                message
              })

            }
  
          }
    
        }
  
      }

    }

    await app.close(isPM2)

    console.log(`process done: ${new Date()}`)
  }catch(e){
    console.error(e)
    console.error(`process error: ${new Date()}`)
  }
}