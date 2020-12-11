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
      tanggal: app.tglDaftar()
    })).map(({ peserta: { noKartu }}) => noKartu)

    //get kunj bln ini
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
    app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)

    app.kunjSakitBlnIni = app.kunjBlnIni.filter( kunj => kunj.kunjSakit)
    app.spinner.succeed(`kunj sakit total bln ${app.blnThn()}: ${app.kunjSakitBlnIni.length}`)

    //get rasio rujukan
    let kunjSakitUnique = []
    let rujukan = 0
    let htAll = []

    for( let {peserta} of app.kunjSakitBlnIni ) {
      let isHT = false
      let kunjHT = []
      //hitung jml rujukan
      if(kunjSakitUnique.indexOf(peserta.noKartu) === -1){
        let res = await app.getRiwayatKunjungan({ 
          peserta
        })
        kunjSakitUnique.push(peserta.noKartu)

        if(res && res.length) for(let re of res){
//--------------------------------------------------
          // if(re.diagnosa1.kdDiag === 'I10' || re.diagnosa2.kdDiag === 'I10' || re.diagnosa3.kdDiag === 'I10'){
          //   let blnThn = re.tglKunjungan.split('-')
          //   blnThn.shift()
          //   blnThn = blnThn.join('-')
          //   if(blnThn === app.blnThn()) {
          //     // console.log(re)
          //     isHT = {
          //       peserta
          //     }
          //     kunjHT.push(re)
          //   }
          // }
//---------------------------------------------
          if(re.statusPulang && re.statusPulang.kdStatusPulang === '4'){
            let blnThn = re.tglKunjungan.split('-')
            blnThn.shift()
            blnThn = blnThn.join('-')
            if(blnThn === app.blnThn()) {
              // console.log(re.tglKunjungan)
              rujukan++
            }
          }
        }
      }
//-------------------------------------------
      // if(isHT) {
      //   htAll.push(Object.assign({}, isHT, {
      //     kunjHT
      //   }))
      // }
//-----------------------------------------------
    }
//-----------------------------------
    // console.log(htAll.length)
    // console.log(htAll[htAll.length-1])
//----------------------------------------
    let inputRPPT = 0

    if( 100*rujukan/app.kunjSakitBlnIni.length > 15 ){
      //handle angka rujukan
      let kunjSakit = app.kunjSakitBlnIni.length
      app.spinner.succeed(`rujukan bln ${app.blnThn()}: ${rujukan} atau ${100*rujukan/app.kunjSakitBlnIni.length} %`)
      while (100*rujukan/kunjSakit > 15){
        kunjSakit++
        inputRPPT++
      }
      app.spinner.succeed(`RPPT yg harus diinput: ${inputRPPT}`)
    }

    //--------------------

    //hitung kekurangan kontak rate
    let kekurangan = 0

    if (uniqKartu.length/app.config.JML < 0.15) {

      //handle angka kontak
      app.spinner.succeed(`jml kunj unik: ${uniqKartu.length} atau ${100 * uniqKartu.length/app.config.JML}%` )
      kekurangan = (app.config.JML*0.15) - uniqKartu.length
      app.spinner.succeed(`kekurangan contact rate: ${kekurangan}`);

    }

    if(inputRPPT || kekurangan ){

      //get peserta yg akan diinput
      app.spinner.start(`tgl ${app.now} s.d. ${app.end}`)
      const sisaHari = Number(app.end) - Number(app.now)
      //const sisaHari = moment().to(moment().endOf("month"));
      app.spinner.succeed(`sisa hari: ${sisaHari}`);
      const pembagi = sisaHari - 2

      if(pembagi > 0 || kekurangan > 0 || inputRPPT) {
        let akanDiinput = Math.floor((kekurangan / pembagi) * 0.6) || inputRPPT;
        if(pembagi < 1){
          akanDiinput = Math.floor(kekurangan)
        }
        app.spinner.succeed(`akan diinput: ${akanDiinput}`)

        // cek mulai dari sini ya...

        // const listAll = await app.getPeserta()
        await app.getPesertaInput({
          akanDiinput,
          uniqKartu: [...uniqKartu, ...kunjIni],
          inputRPPT
        })
      }
    }

    if(app.randomList && app.randomList.length) {

      //inp kunj
      let detailList = app.randomList.map( ({no, ket}) => ({
        ket,
        det: {
          "kdProviderPeserta": app.config.PCAREUSR,
          "tglDaftar": app.tglDaftar(),
          "noKartu": no,
          "kdPoli": ket === 'sht' ? '021' : '001',
          "keluhan": null,
          "kunjSakit": ket === 'sht' ? false : true,
          "sistole": 0,
          "diastole": 0,
          "beratBadan": 0,
          "tinggiBadan": 0,
          "respRate": 0,
          "heartRate": 0,
          "rujukBalik": 0,
          "kdTkp": ket === 'sht' ? '50' : '10'
        }
      }))


      for(let pendaftaran of detailList) {
        app.spinner.succeed(`${kunjIni.indexOf(pendaftaran.det.noKartu)}, ${pendaftaran.det.noKartu}`)

        app.spinner.start(`add pendaftaran: ${pendaftaran.det.noKartu}`)
        let response = await app.addPendaftaran({
          pendaftaran: pendaftaran.det
        })
        if(response) app.spinner.succeed(JSON.stringify(response))

        if(pendaftaran.det.kunjSakit) {
          //add kunj
          let kunjResponse = await app.sendKunj({ daft: pendaftaran })
          if(kunjResponse) {
            app.spinner.succeed(JSON.stringify(kunjResponse))
            if(kunjResponse && kunjResponse.response && kunjResponse.response.message && (pendaftaran.ket === 'dm' || pendaftaran.ket === 'ht')){
              // add mcu

        //-------------------------------------------------------------------------

              // let response = await app.sendMCU({
              //   daft: pendaftaran,
              //   noKunjungan:kunjResponse.response.message 
              // })
              // if(response) app.spinner.succeed(JSON.stringify(response))
      
        //-------------------------------------------------------------------------
            }
          }

        }
      }

    }


    await app.close(isPM2)

    console.log(`process done: ${new Date()}`)
  }catch(e){
    console.error(JSON.stringify(e))
    console.error(`process error: ${new Date()}`)
  }
}