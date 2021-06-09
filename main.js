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

    app.dataBBTB = []
    app.cekPstSudah =[]

    let kunjBlnIni = []

    //get kunj bln ini
    let tgl = app.tgl()
    while(tgl){
      let tglHariIni = `${tgl}-${app.blnThn()}`
      let kunjHariIni = await app.getPendaftaranProvider({
        tanggal: tglHariIni
      })
      kunjBlnIni = [ ...kunjBlnIni, ...kunjHariIni]
      tgl--
    }

    kunjBlnIni = kunjBlnIni.filter( e => !e.kunjSakit || (e.kunjSakit && e.status.includes('dilayani')))
    let daftUnik = app.uniqEs6(kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu))

    app.kunjBlnIni = []

    for( let noka of daftUnik) {
      let pesertaArr, peserta
      app.config.ARANGODB_DB ? pesertaArr = await app.arangoQuery({
        aq: `FOR p IN pesertaJKN
        FILTER p._key == "${noka}"
        RETURN p`
      }): null

      if(!peserta && pesertaArr && pesertaArr.length ) {
        peserta = pesertaArr[0]
      }

      if(!peserta){
        peserta = await app.getPesertaByNoka({
          noka
        })
      }

      // let pst = await app.getPesertaByNoka({noka})
      // console.log(pst)
      if(peserta && peserta.kdProviderPst && peserta.kdProviderPst.kdProvider && peserta.kdProviderPst.kdProvider === app.config.PROVIDER){
        let findPst = kunjBlnIni.filter( e => e.peserta.noKartu === noka)
        findPst[0].peserta = peserta
        app.kunjBlnIni.push(findPst[0])
        
      }
    }

    app.daftUnik = app.uniqEs6(app.kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu))
    app.kunjSakitBlnIni = app.kunjBlnIni.filter( kunj => kunj.kunjSakit)

    // app.spinner.succeed(`${JSON.stringify(app.daftUnik)}`)

    app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)

    const kartuList = app.kunjBlnIni.map( ({ peserta : { noKartu } }) => noKartu)
    const uniqKartu = app.uniqEs6(kartuList)
    // app.spinner.succeed(`kunj total bln ${app.blnThn()}: ${app.kunjBlnIni.length}`)

    //get rasio rujukan


    let kunjSakitUnique = []
    let rujukan = 0
    let htAll = 0
    let kunjHT = []
    let dmAll = 0
    let kunjDM = []
    let listPstHT = []
    let listPstDM = []
    if(htAll < app.config.HT) {
      htAll = app.config.HT
    }
    if(dmAll < app.config.DM) {
      dmAll = app.config.DM
    }
    for( let {peserta} of app.kunjSakitBlnIni ) {
      let isHT = false
      let isHTControlled = false
      let isDM = false
      let isDMControlled = false
      //hitung jml rujukan
      
      if(kunjSakitUnique.indexOf(peserta.noKartu) === -1){
        let res = await app.getRiwayatKunjungan({ 
          peserta,
          bln: app.blnThn()
        })
        kunjSakitUnique.push(peserta.noKartu)

        if(res && res.length) for(let re of res){
          let blnThn = re.tglKunjungan.split('-')
          blnThn.shift()
          blnThn = blnThn.join('-')
          if(blnThn === app.blnThn()) {
            if((re.diagnosa1.kdDiag === 'I10' || re.diagnosa2.kdDiag === 'I10' || re.diagnosa3.kdDiag === 'I10')
            && 100*kunjHT.length/htAll < 5 
            ){
              isHT = true
              if(re.sistole < 130 && re.sistole > 109 && re.diastole < 90) {
    
                if(peserta && peserta.pstProl && peserta.pstProl.includes('HT')){
                  // console.log('')
                  // console.log('-------------')
                  // console.log('is HT controlled: ', JSON.stringify(re))
                  // console.log('is prolanis: ', JSON.stringify(peserta))
                  if(kunjHT.indexOf(peserta.noKartu) === -1){
                    kunjHT.push(peserta.noKartu)
                    // console.log('kunj HT: ', kunjHT.length)
                  }
                  isHTControlled = true
                }
                
                app.config.ARANGODB_DB && await app.arangoUpsert({
                  coll: 'pesertaJKN',
                  doc: Object.assign({}, re.peserta, re.progProlanis, peserta, {
                    _key: re.peserta.noKartu,
                  })
                })
              } else {
                if(peserta && peserta.pstProl && peserta.pstProl.includes('HT')){
                  listPstHT.push(peserta.noKartu)
                }
  
              }
            }

            if((re.diagnosa1.kdDiag === 'E11.9' || re.diagnosa2.kdDiag === 'E11.9' || re.diagnosa3.kdDiag === 'E11.9'
            || re.diagnosa1.kdDiag === 'E11' || re.diagnosa2.kdDiag === 'E11' || re.diagnosa3.kdDiag === 'E11') 
            && 100*kunjDM.length/dmAll < 5
            ){
              // console.log('')
              // console.log('-------------')
              // console.log('is DM: ', JSON.stringify(re))
              isDM = true

  
              if(peserta && peserta.pstProl && peserta.pstProl.includes('DM')){
                // console.log('')
                // console.log('-------------')
                // console.log('is DM: ', JSON.stringify(re))
                // // console.log('is controlled: ', JSON.stringify(mc))
                // console.log('is prolanis: ', JSON.stringify(peserta))
                let mcu = await app.getMCU({
                  noKunjungan: re.noKunjungan
                })
                // console.log(mcu)
                // console.log('mcu   :', JSON.stringify(mcu))
                if(mcu && mcu.list && mcu.list.length ) for( let mc of mcu.list) {
    
                  if(mc.gulaDarahPuasa > 0 && mc.gulaDarahPuasa < 130 ) {
                    // console.log('')
                    // // console.log('-------------')
                    // // console.log('is DM: ', JSON.stringify(re))
                    // console.log('is controlled: ', JSON.stringify(mc))
                    isDMControlled = true
                    if(kunjDM.indexOf(peserta.noKartu) === -1){
                      kunjDM.push(peserta.noKartu)
                      app.spinner.succeed(`kunj DM: ${kunjDM.length} | ${re.tglKunjungan} | ${re.peserta.noKartu} | ${re.noKunjungan} | ${peserta.pstProl} | ${mc.gulaDarahPuasa}`)
                    }
                  } else {
                    listPstDM.push(peserta.noKartu)

                  }
                }
          
              }
              
              app.config.ARANGODB_DB && await app.arangoUpsert({
                coll: 'pesertaJKN',
                doc: Object.assign({}, re.peserta, re.progProlanis, peserta, {
                  _key: re.peserta.noKartu,
                })
              })

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
    if(htAll < app.config.HT) {
      htAll = app.config.HT
    }
    if(100*kunjHT.length/htAll < 5){
      let htNum = kunjHT.length
      while (100*htNum/htAll < 5 ){
        inputHT++
        htNum++
      }
      // app.spinner.succeed(`HT Prolanis terkendali: ${kunjHT.length} dari kunj HT: ${htAll} atau: ${Math.floor(1000*kunjHT.length/htAll)/10} %`)
    }

    let inputDM = 0
    if(dmAll < app.config.DM) {
      dmAll = app.config.DM
    }
    if(100*kunjDM.length/dmAll < 5){
      let dmNum = kunjDM.length
      while (100*dmNum/dmAll < 5 ){
        inputDM++
        dmNum++
      }
      // app.spinner.succeed(`DM Prolanis terkendali: ${kunjDM.length} dari kunj DM: ${dmAll} atau: ${Math.floor(1000*kunjDM.length/dmAll)/10} %`)
    }

    let inputSakit = inputHT + inputDM
    if( 100*rujukan/app.kunjSakitBlnIni.length > 15 ){
      let kunjSakit = app.kunjSakitBlnIni.length + inputSakit
      while (100*rujukan/kunjSakit > 15){
        kunjSakit++
        inputSakit++
      }
      // app.spinner.succeed(`rujukan: ${rujukan} dari kunj sakit: ${app.kunjSakitBlnIni.length} atau: ${Math.floor(1000*rujukan/app.kunjSakitBlnIni.length)/10} %`)
    }

    let kekurangan = 0
    if (uniqKartu.length/app.config.JML < 0.1556) {
      //handle angka kontak
      kekurangan = Math.floor((app.config.JML*0.1556) - uniqKartu.length)
    }

    // if(kekurangan ){
    if(inputSakit || kekurangan || inputHT || inputDM ){

      //get peserta yg akan diinput
      const sisaHari = Number(app.end) - Number(app.now)
      //const sisaHari = moment().to(moment().endOf("month"));
      app.spinner.succeed(`tgl ${app.now} s.d. ${app.end}; sisa hari: ${sisaHari}`);
      const pembagi = sisaHari - 2

      if(pembagi > 0 || kekurangan > 0 || inputSakit || inputHT) {
        let akanDiinput = Math.floor((kekurangan / pembagi) * 0.6) || inputSakit || (inputHT) || (inputDM);
        if(pembagi < 1){
          akanDiinput = Math.floor(kekurangan)
        }
        app.spinner.succeed(`akan diinput: ${akanDiinput}`)

        if(!app.config.RPPT){
          inputHT = 0
          inputDM = 0
        }
    
        if(!app.config.KUNJ_SAKIT){
          inputSakit = 0
        }

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
        }

        await app.getPesertaInput({
          akanDiinput,
          uniqKartu, //: [...uniqKartu, ...kunjIni],
          inputSakit,
          inputHT,
          inputDM,
          listPstDM,
          listPstHT
        })
      }
    }

    if(app.randomList && app.randomList.length) {

      let tglDaftar = await app.getTglDaftar()


      //inp kunj

      let detailList = app.randomList.map( ({no, ket}) => ({
        ket,
        det: {
          "kdProviderPeserta": app.config.PROVIDER,
          tglDaftar,
          // "tglDaftar": app.tglDaftarA(`${app.getRandomInt(app.tgl() > 4 ? app.tgl()-4  : 1, app.tgl())}-${app.blnThn()}`),
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

        let adakahDaft = app.daftUnik.filter( noKartu => noKartu === pendaftaran.det.noKartu )

        app.spinner.succeed(`${noT}: ${pendaftaran.det.tglDaftar} | ${pendaftaran.det.noKartu} | ${adakahDaft.length ? `ada ${JSON.stringify(adakahDaft)}` : 'tidak ada'}`)

        if(!adakahDaft.length || pendaftaran.ket === 'dm' || pendaftaran.ket === 'ht' ){
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