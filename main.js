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
    // app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)

    app.kunjSakitBlnIni = app.kunjBlnIni.filter( kunj => kunj.kunjSakit)
    // app.spinner.succeed(`kunj sakit total bln ${app.blnThn()}: ${app.kunjSakitBlnIni.length}`)
    //get rasio rujukan
    let kunjSakitUnique = []
    let rujukan = 0
    let htAll = 0
    let kunjHT = []
    let dmAll = 0
    let kunjDM = []

    for( let {peserta} of app.kunjSakitBlnIni ) {
      let isHT = false
      let isHTControlled = false
      let isDM = false
      let isDMControlled = false
      //hitung jml rujukan
      if(kunjSakitUnique.indexOf(peserta.noKartu) === -1){
        let res = await app.getRiwayatKunjungan({ 
          peserta
        })
        kunjSakitUnique.push(peserta.noKartu)

        if(res && res.length) for(let re of res){
          let blnThn = re.tglKunjungan.split('-')
          blnThn.shift()
          blnThn = blnThn.join('-')
          if(blnThn === app.blnThn()) {
            if((re.diagnosa1.kdDiag === 'I10' || re.diagnosa2.kdDiag === 'I10' || re.diagnosa3.kdDiag === 'I10' || re.sistole > 129 || re.diastole > 89) ){
              isHT = true
              if(re.sistole < 130 && re.sistole > 109 && re.diastole < 90) {
                let peserta =  await app.getPesertaByNoka({
                  noka: re.peserta.noKartu
                })
                if(peserta.pstProl.includes('HT')){
                  isHTControlled = true
                }
              }
            }

            if((re.diagnosa1.kdDiag === 'E11.9' || re.diagnosa2.kdDiag === 'E11.9' || re.diagnosa3.kdDiag === 'E11.9'
            || re.diagnosa1.kdDiag === 'E11' || re.diagnosa2.kdDiag === 'E11' || re.diagnosa3.kdDiag === 'E11'
            ) ){
              isDM = true
              let mcu = await app.getMCU({
                noKunjungan: re.noKunjungan
              })
              // console.log(mcu)
              if(mcu && mcu.list && mcu.list.length ) for( let mc of mcu.list) {
                if(mc.gulaDarahPuasa < 130 ) {
                  let peserta =  await app.getPesertaByNoka({
                    noka: re.peserta.noKartu
                  })
                  if(peserta.pstProl.includes('DM')){
                    isDMControlled = true
                  }
                }
              }
            }

            if(re.statusPulang && re.statusPulang.kdStatusPulang === '4'){
              rujukan++
            }
          }
        }
      }
      if(isHTControlled) {
        if(kunjHT.indexOf(peserta.noKartu) === -1){
          kunjHT.push(peserta.noKartu)
        }
      }
      if(isHT) {
        htAll++
      }
      if(isDMControlled) {
        if(kunjDM.indexOf(peserta.noKartu) === -1){
          kunjDM.push(peserta.noKartu)
        }
      }
      if(isDM) {
        dmAll++
      }
    }

    let inputHT = 0
    app.spinner.succeed(`HT Prolanis terkendali: ${kunjHT.length} dari kunj HT: ${htAll} atau: ${Math.floor(100*kunjHT.length/htAll)} %`)
    if(htAll < 2000) {
      htAll = 2000
    }
    if(100*kunjHT.length/htAll < 5){
      let htNum = kunjHT.length
      while (100*htNum/htAll < 5 ){
        inputHT++
        htNum++
      }
      app.spinner.succeed(`kunj HT yg harus diinput: ${inputHT}`)
    }

    let inputDM = 0
    app.spinner.succeed(`DM Prolanis terkendali: ${kunjDM.length} dari kunj DM: ${dmAll} atau: ${Math.floor(100*kunjDM.length/dmAll)} %`)
    if(dmAll < 500) {
      dmAll = 500
    }
    if(100*kunjDM.length/dmAll < 5){
      let dmNum = kunjDM.length
      while (100*dmNum/dmAll < 5 ){
        inputDM++
        dmNum++
      }
      app.spinner.succeed(`kunj DM yg harus diinput: ${inputDM}`)
    }

    let inputSakit = inputHT + inputDM
    app.spinner.succeed(`rujukan: ${rujukan} dari kunj sakit: ${app.kunjSakitBlnIni.length} atau: ${Math.floor(100*rujukan/app.kunjSakitBlnIni.length)} %`)
    if( 100*rujukan/app.kunjSakitBlnIni.length > 15 ){
      let kunjSakit = app.kunjSakitBlnIni.length + inputSakit
      while (100*rujukan/kunjSakit > 15){
        kunjSakit++
        inputSakit++
      }
      app.spinner.succeed(`Kunj sakit yg harus diinput: ${inputSakit}`)
    }

    let kekurangan = 0
    app.spinner.succeed(`contact rate: ${Math.floor(100 * uniqKartu.length/app.config.JML)} %` )
    if (uniqKartu.length/app.config.JML < 0.15) {
      //handle angka kontak
      kekurangan = Math.floor((app.config.JML*0.15) - uniqKartu.length)
      app.spinner.succeed(`kekurangan contact rate: ${kekurangan}`);
    }

    if(inputSakit || kekurangan || inputHT ){

      //get peserta yg akan diinput
      app.spinner.start(`tgl ${app.now} s.d. ${app.end}`)
      const sisaHari = Number(app.end) - Number(app.now)
      //const sisaHari = moment().to(moment().endOf("month"));
      app.spinner.succeed(`sisa hari: ${sisaHari}`);
      const pembagi = sisaHari - 2

      if(pembagi > 0 || kekurangan > 0 || inputSakit || inputHT) {
        let akanDiinput = Math.floor((kekurangan / pembagi) * 0.6) || inputSakit || inputHT;
        if(pembagi < 1){
          akanDiinput = Math.floor(kekurangan)
        }
        app.spinner.succeed(`akan diinput: ${akanDiinput}`)

        // cek mulai dari sini ya...

        // const listAll = await app.getPeserta()
        await app.getPesertaInput({
          akanDiinput,
          uniqKartu: [...uniqKartu, ...kunjIni],
          inputSakit,
          inputHT,
          inputDM
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

      let noT = 0
      for(let pendaftaran of detailList) {
        noT++
        app.spinner.succeed(`${noT}: ${pendaftaran.det.noKartu}`)
        // app.spinner.succeed(`${kunjIni.indexOf(pendaftaran.det.noKartu)}, ${pendaftaran.det.noKartu}`)

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

              let response = await app.sendMCU({
                daft: pendaftaran,
                noKunjungan:kunjResponse.response.message 
              })
              if(response) app.spinner.succeed(JSON.stringify(response))
      
        //-------------------------------------------------------------------------
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