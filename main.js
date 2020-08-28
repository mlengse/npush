if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {
  try{
    let tgl = app.tgl()
    while(tgl){
      let tglHariIni = `${tgl}-${app.blnThn()}`
      let kunjHariIni = await app.getPendaftaranProvider({
        tanggal: tglHariIni
      })
      app.kunjBlnIni = [ ...app.kunjBlnIni, ...kunjHariIni]
      app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)
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

// cek mulai dari sini ya...

      if(pembagi > 0 ) {
        const akanDiinput = Math.floor((kekurangan / pembagi) * 0.6);
        app.spinner.succeed(`akan diinput: ${akanDiinput}`)

        const listAll = await getPeserta()
        // const listAll = db()

        if(listAll && listAll.length) {
          console.log(`jml pst di database: ${listAll.length}`);
          const listReady = listAll.filter( no  => uniqKartu.indexOf(no) == -1)
          console.log(`jml pst blm diinput: ${listReady.length}`);
          const randomList = getRandomSubarray(listReady, akanDiinput)
          const detailList = randomList.map( no => ({
              "kdProviderPeserta": process.env.PCAREUSR,
              "tglDaftar": moment().add(-3, 'd').format('DD-MM-YYYY'),
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
  
          for(let kunj of detailList) {
              console.log(kunj.noKartu)
              let response = await addPendaftaran(kunj)
              if(response) console.log(response)
          }
  
        } else {
          console.error('excell error')
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