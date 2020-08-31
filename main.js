if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {
  try{
    await app.init()
    let tgl = app.tgl()
    while(tgl){
      let tglHariIni = `${tgl}-${app.blnThn()}`
      let kunjHariIni = await app.getPendaftaranProvider({
        tanggal: tglHariIni
      })
      // console.log(kunjHariIni)
      app.kunjBlnIni = [ ...app.kunjBlnIni, ...kunjHariIni]
      app.spinner.start(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)
      tgl--
    }

    const kartuList = app.kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu)
    const uniqKartu = app.uniqEs6(kartuList)
    app.spinner.succeed(`jml kunj unik: ${uniqKartu.length} atau ${100 * uniqKartu.length/app.config.JML}%` )

    if (uniqKartu.length/app.config.JML < 0.15) {
      const kekurangan = (app.config.JML*0.15) - uniqKartu.length
      app.spinner.succeed(`kekurangan contact rate: ${kekurangan}`);
      app.spinner.start(`tgl ${app.now} s.d. ${app.end}`)
      const sisaHari = Number(app.end) - Number(app.now)
      //const sisaHari = moment().to(moment().endOf("month"));
      app.spinner.succeed(`sisa hari: ${sisaHari}`);
      const pembagi = sisaHari - 2
      /*
      const pembagi = sisaHari
        .replace("in", "")
        .replace("days", "")
        .trim();
        */

        // console.log(pembagi, kekurangan)

      if(pembagi > 0 || kekurangan > 0 ) {
        let akanDiinput = Math.floor((kekurangan / pembagi) * 0.6);
        if(pembagi < 1){
          akanDiinput = Math.floor(kekurangan)
        }
        app.spinner.succeed(`akan diinput: ${akanDiinput}`)


        // cek mulai dari sini ya...

        const listAll = await app.getPeserta()
        // const listAll = db()

        if(listAll && listAll.length) {
          app.spinner.succeed(`jml pst di database: ${listAll.length}`);
        
          const listReady = listAll.filter( no  => uniqKartu.indexOf(no) == -1)
          app.spinner.succeed(`jml pst blm diinput: ${listReady.length}`);

          const randomList = app.getRandomSubarray(listReady, akanDiinput)

          app.spinner.succeed(`random list ready: ${randomList.length}`)

          
          const detailList = randomList.map( no => ({
            "kdProviderPeserta": app.config.PCAREUSR,
            "tglDaftar": app.tglDaftar(),
            "noKartu": no,
            "kdPoli": '021',
            "keluhan": null,
            "kunjSakit": false,
            "sistole": 0,
            "diastole": 0,
            "beratBadan": 0,
            "tinggiBadan": 0,
            "respRate": 0,
            "heartRate": 0,
            "rujukBalik": 0,
            "kdTkp": '10'
          }))

          for(let pendaftaran of detailList) {
            // console.log(kunj)
            app.spinner.start(`add pendaftaran: ${pendaftaran.noKartu}`)
            let response = await app.addPendaftaran({
              pendaftaran
            })
            if(response) app.spinner.succeed(JSON.stringify(response))
          }
  
        } else {
          app.spinner.fail('excell error')
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