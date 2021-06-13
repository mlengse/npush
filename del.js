const Core = require('./core')

const app = new Core()

;(async() =>{
  try{
    await app.initBrowser()

    await app.runScript()
    await app.page.goto(`${app.config.PCARE_URL}/EntriDaftarDokkel`, app.waitOpt)

    let tgl = 31
    // for(let tgl of [1,2,9,16,23,30,13,14,26]) {
    while(tgl){

      let ts = tgl.toString()
      if(ts.length === 1){
        ts = '0' + ts
      }

      let tgldaftar = `${ts}-${'05-2021'}`
      // app.spinner.succeed(`tgl daftar: ${tgldaftar}`)
      let pendaftars = await app.getPendaftarByPpkTgl({ tgldaftar })

      let num = 0

      if(pendaftars.length > 500){
        num = app.getRandomInt(0 , pendaftars.length - 500)
      }

        for(let pendaftar of pendaftars){
          if(num){

            if(!pendaftar.kunjSakitF || (pendaftar.kunjSakitF && !pendaftar.status)){
            // if(tgl === 2 || tgl === 26) {
              app.spinner.succeed(`${num}, ${JSON.stringify(pendaftar)}`)
              // await app.daftarDelete({ pendaftar })
              // }
              // num++

              num--
      
            }
          }
        }
      // }

      tgl--

    }
    app.spinner.succeed(`process done: ${new Date()}`)


  }catch(e){
    app.spinner.fail(`process error: ${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)

  }
})()