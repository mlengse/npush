if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')
const { texttospeech_v1beta1 } = require('googleapis')

const app = new Core(config)

module.exports = async (isPM2) => {

  try{
    await app.init()

    //get kunj bln ini
    app.dataBBTB = []
    app.cekPstSudah =[]
    app.kunjBlnIni = []
    let kunjBlnIni = []
    let tgl = app.tgl()
    while(tgl){
      let tglHariIni = `${tgl}-${app.blnThn()}`
      let kunjHariIni = await app.getPendaftaranProvider({ tanggal: tglHariIni })
      kunjBlnIni = [ ...kunjBlnIni, ...kunjHariIni]
      tgl--
    }

    kunjBlnIni = kunjBlnIni.filter( e => !e.kunjSakit || (e.kunjSakit && e.status.includes('dilayani')))
    let daftUnik = app.uniqEs6(kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu).filter( noKartu => noKartu.length === 13))
    for( let noka of daftUnik) {
      let peserta = await app.getPesertaByNoka({ noka })
      if(peserta && peserta.kdProviderPst && peserta.kdProviderPst.kdProvider && peserta.kdProviderPst.kdProvider === app.config.PROVIDER){
        let findPst = kunjBlnIni.filter( e => e.peserta.noKartu === noka)
        findPst[0].peserta = peserta
        app.kunjBlnIni.push(findPst[0])
      }
    }

    app.daftUnik = app.uniqEs6(app.kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu))
    app.kunjSakitBlnIni = app.kunjBlnIni.filter( kunj => kunj.kunjSakit)
    app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)

    //get rasio rujukan
    const kartuList = app.kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu)
    const uniqKartu = app.uniqEs6(kartuList)
    let kunjSakitUnique = []
    let rujukan = 0
    let htAll = app.config.HT || 0
    let kunjHT = []
    let dmAll = app.config.DM || 0
    let kunjDM = []
    let listPstHT = []
    let listPstDM = []
    for( let {peserta} of app.kunjSakitBlnIni ) {
      //hitung jml rujukan
      let isHT = false
      let isHTControlled = false
      let isDM = false
      let isDMControlled = false
      if(kunjSakitUnique.indexOf(peserta.noKartu) === -1){
        let res = await app.getRiwayatKunjungan({ 
          peserta,
          bln: app.blnThn(),
          count: kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu).filter( noKartu => noKartu === peserta.noKartu).length
        })
        kunjSakitUnique.push(peserta.noKartu)

        if(res && res.length) for(let re of res){
          let blnThn = re.tglKunjungan.split('-')
          blnThn.shift()
          blnThn = blnThn.join('-')
          if(blnThn === app.blnThn()) {
            kunjBlnIni = kunjBlnIni.map( kunj => {
              if(re.tglKunjungan === kunj.tgldaftar && re.peserta.noKartu === kunj.peserta.noKartu){
                kunj = Object.assign({}, kunj, re)
                // console.log(kunj)
              }
              return kunj
            })
            if((re.diagnosa1.kdDiag === 'E11.9' || re.diagnosa2.kdDiag === 'E11.9' || re.diagnosa3.kdDiag === 'E11.9' || re.diagnosa1.kdDiag === 'E11' || re.diagnosa2.kdDiag === 'E11' || re.diagnosa3.kdDiag === 'E11') && 100*kunjDM.length/dmAll < 5.35 ){
              isDM = true
              if(peserta && peserta.pstProl && peserta.pstProl.includes('DM')){
                let mcu = await app.getMCU({
                  noKunjungan: re.noKunjungan
                })
                if(mcu){
                  kunjBlnIni = kunjBlnIni.map( kunj => {
                    if(kunj.noKunjungan === mcu.noKunjungan){
                      kunj = Object.assign({}, kunj, mcu)
                    }
                    return kunj
                  })
                }
                if(mcu && mcu.gulaDarahPuasa > 0 && mcu.gulaDarahPuasa < 130 ) {
                  isDMControlled = true
                  if(kunjDM.indexOf(peserta.noKartu) === -1){
                    kunjDM.push(peserta.noKartu)
                  } 
                }
              }
            }

            if((re.diagnosa1.kdDiag === 'I10' || re.diagnosa2.kdDiag === 'I10' || re.diagnosa3.kdDiag === 'I10') && 100*kunjHT.length/htAll < 5.35 ){
              isHT = true
              if(peserta && peserta.pstProl && peserta.pstProl.includes('HT')){
                if(re.sistole < 130 && re.sistole > 109 && re.diastole < 90) {
                  kunjHT.indexOf(peserta.noKartu) === -1 && kunjHT.push(peserta.noKartu)
                  isHTControlled = true
                }
              }
            }
            re.statusPulang && re.statusPulang.kdStatusPulang === '4' && rujukan++
          }
        }

        if(res && res.length && res.length < 2 && !isDMControlled && !isHTControlled && kunjHT.indexOf(peserta.noKartu) === -1 && kunjDM.indexOf(peserta.noKartu) === -1 && listPstDM.indexOf(peserta.noKartu) === -1 && listPstHT.indexOf(peserta.noKartu) === -1){
          if(isDM) {
            listPstDM.push(peserta.noKartu)
          } else if (isHT) {
            listPstHT.push(peserta.noKartu)
          }
        }
      }
      isHTControlled && kunjHT.indexOf(peserta.noKartu) === -1 && kunjHT.push(peserta.noKartu)
      isHT && htAll++
      isDMControlled && kunjDM.indexOf(peserta.noKartu) === -1 && kunjDM.push(peserta.noKartu)
      isDM && dmAll++
    }

    let inputHT = 0
    htAll = htAll < app.config.HT ? app.config.HT : htAll
    if(100*kunjHT.length/htAll < 5.35){
      let htNum = kunjHT.length
      while (100*htNum/htAll < 5.35 ){
        inputHT++
        htNum++
      }
    }

    let inputDM = 0
    dmAll = dmAll < app.config.DM ? app.config.DM : dmAll
    if(100*kunjDM.length/dmAll < 5.35){
      let dmNum = kunjDM.length
      while (100*dmNum/dmAll < 5.35 ){
        inputDM++
        dmNum++
      }
    }

    let inputSakit = inputHT + inputDM
    if( 100*rujukan/app.kunjSakitBlnIni.length > 15 ){
      let kunjSakit = app.kunjSakitBlnIni.length + inputSakit
      while (100*rujukan/kunjSakit > 15){
        inputSakit++
        kunjSakit++
      }
    }

    let kekurangan = uniqKartu.length/app.config.JML < 0.1556 ? Math.floor((app.config.JML*0.1556) - uniqKartu.length) : 0

    if(inputSakit || kekurangan || inputHT || inputDM ){

      //get peserta yg akan diinput
      const sisaHari = Number(app.end) - Number(app.now)
      //const sisaHari = moment().to(moment().endOf("month"));
      app.spinner.succeed(`tgl ${app.now} s.d. ${app.end}; sisa hari: ${sisaHari}`);
      const pembagi = sisaHari > 2 ? sisaHari - 2 : 0

      if(pembagi > 0 && (kekurangan > 0 || inputSakit || inputHT)) {
        let akanDiinput = pembagi < 1 ? Math.floor(kekurangan) : (Math.floor((kekurangan / pembagi) * 0.6) || inputSakit || (inputHT) || (inputDM))

        if(!app.config.RPPT){
          inputHT = 0
          inputDM = 0
        }
    
        inputSakit = !app.config.KUNJ_SAKIT ? 0 : inputSakit

        if( app.config.RPPT && inputHT > 0){
          app.spinner.succeed(`HT Prolanis terkendali: ${kunjHT.length} dari kunj HT: ${htAll} atau: ${Math.floor(1000*kunjHT.length/htAll)/10} %`)
          app.spinner.succeed(`kunj HT yg harus diinput: ${inputHT}`)
          inputHT = Math.ceil(inputHT/pembagi)
          app.spinner.succeed(`kunj HT yg akan diinput: ${inputHT}`)
    
        }

        if( app.config.RPPT && inputDM > 0 ){
          app.spinner.succeed(`DM Prolanis terkendali: ${kunjDM.length} dari kunj DM: ${dmAll} atau: ${Math.floor(1000*kunjDM.length/dmAll)/10} %`)
          app.spinner.succeed(`kunj DM yg harus diinput: ${inputDM}`)
          inputDM = Math.ceil(inputDM/pembagi)
          app.spinner.succeed(`kunj DM yg akan diinput: ${inputDM}`)
        }

        if( app.config.KUNJ_SAKIT && inputSakit > 0) {
          app.spinner.succeed(`rujukan: ${rujukan} dari kunj sakit: ${app.kunjSakitBlnIni.length} atau: ${Math.floor(1000*rujukan/app.kunjSakitBlnIni.length)/10} %`)
          app.spinner.succeed(`Kunj sakit yg harus diinput: ${inputSakit}`)
        }

        if(kekurangan > 0) {
          app.spinner.succeed(`contact rate ${uniqKartu.length} dari ${app.config.JML} atau: ${Math.floor(1000 * uniqKartu.length/app.config.JML)/10} %` )
          app.spinner.succeed(`kekurangan contact rate: ${kekurangan}`);
          app.spinner.succeed(`akan diinput: ${akanDiinput}`)

        }

        await app.getPesertaInput({
          akanDiinput,
          // kunjBlnIni,
          // uniqKartu, //: [...uniqKartu, ...kunjIni],
          inputSakit,
          inputHT,
          inputDM,
          listPstDM,
          listPstHT
        })
      }
    }

    let noT = 0

    if(app.randomList && app.randomList.length) for (let detail of app.randomList) {

      let tglDaftar = await app.getTglDaftar()

      //inp kunj
      let pendaftaran = {
        ket: detail.ket,
        det: {
          "kdProviderPeserta": app.config.PROVIDER,
          tglDaftar,
          // "tglDaftar": app.tglDaftarA(`${app.getRandomInt(app.tgl() > 4 ? app.tgl()-4  : 1, app.tgl())}-${app.blnThn()}`),
          "noKartu": detail.no,
          "kdPoli": detail.ket === 'sht' ? '021' : '001',
          "keluhan": null,
          "kunjSakit": detail.ket === 'sht' ? false : true,
          "sistole": 0,
          "diastole": 0,
          "beratBadan": 0,
          "tinggiBadan": 0,
          "respRate": 0,
          "heartRate": 0,
          "rujukBalik": 0,
          "kdTkp": detail.ket === 'sht' ? '50' : '10'
        }
      }

      // let noT = 0
      if(pendaftaran && pendaftaran.det && pendaftaran.det.noKartu && pendaftaran.det.noKartu.length === 13) {
        noT++

        let adakahDaft = kunjBlnIni.filter( ({ tgldaftar, peserta: { noKartu }}) => noKartu === pendaftaran.det.noKartu && tgldaftar === pendaftaran.det.tglDaftar)
        let num = 0

        while(adakahDaft.length && num < 10) {
          for ([id, ada] of Object.entries(adakahDaft)) {
            app.spinner.succeed(`${Number(id)+1} dari ${adakahDaft.length} ${ada.tgldaftar}, ${pendaftaran.det.tglDaftar}, ${pendaftaran.det.noKartu}, ${ada.kunjSakit ? `sakit` : `sehat`}`)
            app.spinner.succeed(`${ada.diagnosa1 && ada.diagnosa1.kdDiag ? `${ada.diagnosa1.kdDiag}, `:''}${ada.diagnosa2 && ada.diagnosa2.kdDiag ? `${ada.diagnosa2.kdDiag}, `:''}${ada.diagnosa3 && ada.diagnosa3.kdDiag ? `${ada.diagnosa3.kdDiag}, `:''}td: ${ada.sistole}/${ada.diastole}${ada.gulaDarahPuasa ? `, gdp: ${ada.gulaDarahPuasa}`:''}`)
          }
          pendaftaran.det.tglDaftar = await app.getTglDaftar()
          adakahDaft = kunjBlnIni.filter( ({ tgldaftar, peserta: { noKartu }}) => noKartu === pendaftaran.det.noKartu && tgldaftar === pendaftaran.det.tglDaftar)
          num++
        }

        app.spinner.succeed(`${noT}: ${pendaftaran.det.tglDaftar} | ${pendaftaran.det.noKartu} | ${adakahDaft.length ? `ada` : 'tidak ada'}`)

        if(!adakahDaft.length) { // || pendaftaran.ket === 'dm' || pendaftaran.ket === 'ht' ){
          app.spinner.start(`add pendaftaran: ${pendaftaran.det.noKartu}`)
          let daftResponse, kunjResponse, mcuResponse 
          
          daftResponse = await app.addPendaftaran({
            pendaftaran: pendaftaran.det
          })
          if(daftResponse) app.spinner.succeed(JSON.stringify(daftResponse))
  
          if(pendaftaran.det.kunjSakit) {
            //add kunj
            kunjResponse = await app.sendKunj({ daft: pendaftaran })
            if(kunjResponse) {
              app.spinner.succeed(JSON.stringify(kunjResponse))
              if(kunjResponse && kunjResponse.response && kunjResponse.response.message && (pendaftaran.ket === 'dm' || pendaftaran.ket === 'ht')){
                // add mcu
  
          //-------------------------------------------------------------------------
  
                mcuResponse = await app.sendMCU({
                  daft: pendaftaran,
                  noKunjungan:kunjResponse.response.message 
                })
                if(mcuResponse) app.spinner.succeed(JSON.stringify(mcuResponse))
        
          //-------------------------------------------------------------------------
              }
            }
  
          }
  
          if(app.config.REDIS_HOST){
            let sendText = await app.sendToWA({
              push: true,
              message: JSON.parse(JSON.stringify({
                pendaftaran,
                daftResponse,
                kunjResponse,
                mcuResponse
              }))
            })
  
            app.config.ARANGODB_DB && await app.upsertKontakJKN({doc: sendText})
    
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