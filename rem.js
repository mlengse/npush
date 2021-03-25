if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {

  try{
    await app.init()

    let kontaks = await app.listKontak()
    let listDaft = (await app.getPendaftaranProvider()).map(({ peserta: {noKartu}}) => noKartu)

    for (kontak of kontaks){
      kontak = await app.upsertKontakJKN({ doc: kontak })
      if(app.checkDateA(kontak.Tanggal)) {
        //check if kontak exist
        if( !listDaft.filter( e => e === kontak.No_JKN ).length ){
          let peserta 
          if(kontak.aktif || kontak.ketAktif){
            peserta = kontak
          } else {
            let pstJKN = await app.getPesertaByNoka({
              noka: kontak.No_JKN
            })
            kontak = Object.assign({}, kontak, pstJKN)
            peserta = await app.upsertKontakJKN({ doc: kontak })
          }
    
          if(peserta && !peserta.daftResponse && peserta.aktif /* &&  peserta.kdProviderPst.kdProvider.trim() === app.config.PROVIDER*/ ){

            // check if kontak not registered yet
            let historyCheck = (await app.getRiwayatKunjungan({ peserta })).filter( ({ tglKunjungan }) => app.checkDate( tglKunjungan, kontak.Tanggal))

            if(!historyCheck.length){
    
              let message = await app.sendToWS({kontak: peserta})

              message = await app.upsertKontakJKN({ doc: message })

              if(!message.from && message.daftResponse && !JSON.stringify(message.daftResponse).includes('sudah di-entri')) {

                let textwa = await app.sendToWA({
                  message
                })

                await app.upsertKontakJKN({ doc: textwa })

              }
    
            }
      
          }
    
        }
      }


    }

    await app.close(isPM2)

    console.log(`process done: ${new Date()}`)
  }catch(e){
    console.error(`process error: ${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
  }
}