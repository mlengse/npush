const {
  Client
} = require('node-rest-client')
const axios = require('axios')

exports._deletePendaftaran = async ({ 
  that,
  noKartu,
  tgldaftar,
  noUrut,
  kdPoli
}) => {
  try {
    const {
      headers
    } = await that.getArgs()
  
    const baseURL = `${that.config.APIV3}`
  
    that.spinner.start(`delete pendaftaran ${noKartu} tgl ${tgldaftar} noUrut ${noUrut} kdPoli ${kdPoli}`)
    let data = (await axios.create({
      baseURL,
      headers
    }).delete(`/pendaftaran/peserta/${noKartu}/tglDaftar/${tgldaftar}/noUrut/${noUrut}/kdPoli/${kdPoli}`)).data
  
    return data

  }catch(e){
    that.spinner.fail(JSON.stringify(e))
    // return data
  }
}


exports._sendMCU = async ({ that, noKunjungan, daft }) => {
  let mcu = {
    kdMCU: 0,
    noKunjungan: noKunjungan,
    kdProvider: that.config.PCAREUSR,
    tglPelayanan: daft.det.tglDaftar,
    tekananDarahSistole: that.kunjunganNow.sistole,
    tekananDarahDiastole: that.kunjunganNow.diastole,
    radiologiFoto: null,
    darahRutinHemo: 0,
    darahRutinLeu: 0,
    darahRutinErit: 0,
    darahRutinLaju: 0,
    darahRutinHema: 0,
    darahRutinTrom: 0,
    lemakDarahHDL: 0,
    lemakDarahLDL: 0,
    lemakDarahChol: 0,
    lemakDarahTrigli: 0,
    gulaDarahSewaktu: 0,
    gulaDarahPuasa: daft.ket === 'dm' ? that.getGDP() : 0,
    gulaDarahPostPrandial: 0,
    gulaDarahHbA1c: 0,
    fungsiHatiSGOT: 0,
    fungsiHatiSGPT: 0,
    fungsiHatiGamma: 0,
    fungsiHatiProtKual: 0,
    fungsiHatiAlbumin: 0,
    fungsiGinjalCrea: 0,
    fungsiGinjalUreum: 0,
    fungsiGinjalAsam: 0,
    fungsiJantungABI: 0,
    fungsiJantungEKG: null,
    fungsiJantungEcho: null,
    funduskopi: null,
    pemeriksaanLain: null,
    keterangan: null
  }
  try {
    that.spinner.start(`send MCU ${noKunjungan}`)
    const {
      headers
    } = await that.getArgs()
  
    const baseURL = `${that.config.APIV3}`
  
    const instance = axios.create({
      baseURL,
      headers
    })

    let res = await instance.post('/mcu', mcu)
    if(res){
      return res.data
    }

  }catch(e){
    that.spinner.fail(JSON.stringify(e))
    // return data
  }
}

exports._getMCU = async({
  that,
  noKunjungan
}) => {
  try{
    const { headers } = await that.getArgs()

    that.spinner.start(`get MCU by no kunj: ${noKunjungan}`)

    const baseURL = `${that.config.APIV3}`
  
    const instance = axios.create({
      baseURL,
      headers
    })

    let res = await instance.get(`/mcu/kunjungan/${noKunjungan}`)
    if(res && res.data && res.data.response ){
      return res.data.response
    }

  }catch({
    response
  }){
    return response
  }

}


exports._sendKunj = async ({that, daft}) => {

  let bbtb = that.dataBBTB.filter( ({ noKartu }) => noKartu === daft.det.noKartu)[0]
  if(bbtb && bbtb.beratBadan){
    that.kunjunganNow = {
      noKunjungan: null,
      noKartu: daft.det.noKartu,
      tglDaftar: daft.det.tglDaftar,
      kdPoli: daft.det.kdPoli,
      keluhan: daft.ket === 'skt' ? '-' : daft.ket,
      kdSadar: "01",
      sistole: that.getSystole(),
      diastole: that.getDiastole(),
      beratBadan: that.dataBBTB.filter( ({ noKartu }) => noKartu === daft.det.noKartu)[0].beratBadan,
      tinggiBadan: that.dataBBTB.filter( ({ noKartu }) => noKartu === daft.det.noKartu)[0].tinggiBadan,
      respRate: that.getRR(),
      heartRate: that.getHR(),
      terapi: "",
      kdStatusPulang: "3",
      tglPulang: daft.det.tglDaftar,
      kdDokter: that.config.KDDOKTER,
      kdDiag1: daft.ket === 'skt' ? 'Z00' : daft.ket === 'ht' ? 'I10' : 'E11',
      kdDiag2: null,
      kdDiag3: null,
      kdPoliRujukInternal: null,
      rujukLanjut: null,
      kdTacc: 0,
      alasanTacc: null
    }
  
    // console.log(kunjungan)
  
    try {
      that.spinner.start(`send kunjungan ${daft.det.noKartu} ${daft.det.tglDaftar}`)
      const {
        headers
      } = await that.getArgs()
    
      const baseURL = `${that.config.APIV3}`
    
      const instance = axios.create({
        baseURL,
        headers
      })
  
      let res = await instance.post('/kunjungan', that.kunjunganNow)
      if(res){
        return res.data
      }
  
    }catch(e){
      that.spinner.fail(JSON.stringify(e))
      // return data
    }
  
  }
  
}

exports._addPendaftaran = async ({
  that, 
  pendaftaran
}) => {

  try{
    const {
      headers
    } = await that.getArgs()
  
    const baseURL = `${that.config.APIV3}`
  
    const instance = axios.create({
      baseURL,
      headers
    })

    let res = await instance.post('/pendaftaran', pendaftaran )

    if(res){
      return res.data
    }
  }catch({
    response: {
      data
    }
  }){
    return data
  }
}

exports._getPendaftaranProvider = async({
  that,
  tanggal
}) => {
  if(!tanggal){
    tanggal = that.tglHariIni()
  }

  try{
    that.spinner.start(`get pendaftaran tgl ${tanggal}`)
    const args = await that.getArgs()

    // that.spinner.start(args)

    const client = new Client()
    let listAll = []
    let countAll = 1
    do {
      let start = listAll.length
      let apiURL = `${that.config.APIV3}/pendaftaran/tglDaftar/${tanggal}/${start}/300`

      // that.spinner.start(`url: ${apiURL}`)
  
      let {
        response,
        metadata
      } = await new Promise((resolve, reject) =>  {
        let req = client.get(apiURL, args, data => resolve(data) )
        req.on('requestTimeout', function (req) {
          reject('request has expired');
          req.abort();
        });
        
        req.on('responseTimeout', function (res) {
          reject('response has expired');
        });
        
        //it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
        req.on('error', function (err) {
          reject(err);
        });
      });
      // console.log(metadata)
      // let response = a.response
      if (response) {
        // console.log(response)
        if (response.count) {
          countAll = response.count;
        } 
        if (response.list && response.list.length) {
          listAll = [...listAll, ...response.list];
        }
      } else {
        countAll = 0
      }
    } while (listAll.length < countAll);

    that.spinner.start(`pendaftaran tgl ${tanggal}: ${listAll.length}`)

    return listAll;
        
  }catch(e){
    that.spinner.fail(e)
    return that.getPendaftaranProvider({
      tanggal
    })
  }

}

exports._getPesertaInput = async({
  that,
  akanDiinput,
  uniqKartu,
  inputSakit,
  inputHT,
  inputDM
}) => {

  if(inputSakit > 200) {
    inputSakit = 200
  }

  if(akanDiinput > 200){
    akanDiinput = 200
  }

  try {
    // let blnThn = that.blnThnGetPst()
    // let kunjBlnIni = []
    let tanggal = that.tglBlnLalu()
    let randomListSht = []
    let randomListDM = []
    let randomListHT = []
    let randomListSkt = []

    // let cekPstSudah =[]

    // that.dataBBTB = []

    let baleni = async () => {
      let kunjHariIni = await that.getPendaftaranProvider({
        tanggal
      })
      // console.log(kunjHariIni)
      let kartuList = kunjHariIni.map( ({
        peserta: {
          noKartu,
        },
        beratBadan,
        tinggiBadan
      }) => ({
        noka: noKartu,
        beratBadan,
        tinggiBadan
      }) )
  
      for (kart of kartuList) {
        // console.log(kart)
        let {
          noka, 
          beratBadan, 
          tinggiBadan
        } = kart
        if(that.cekPstSudah.indexOf(noka) === -1 && uniqKartu.indexOf(noka) === -1) {
          that.cekPstSudah.push(noka)
          if(tinggiBadan === 0 || beratBadan === 0){
            let riws = await that.getRiwayatKunjungan({
              peserta: {
                noKartu: noka
              }
            })
  
            if(riws && riws.length) for(let riw of riws){
              if(riw.beratBadan && riw.tinggiBadan){
                tinggiBadan = riw.tinggiBadan
                beratBadan = riw.beratBadan
                break
              }
            }
  
            // console.log(riws)
          }
          if(tinggiBadan && beratBadan){
            that.dataBBTB.push({
              noKartu: noka,
              tinggiBadan,
              beratBadan
            })
    
          }
          if(
            randomListSkt.indexOf(noka) === -1 ||
            randomListHT.indexOf(noka) === -1 ||
            randomListDM.indexOf(noka) === -1 ||
            randomListSht.indexOf(noka) === -1
          ) {
            let pst = await that.getPesertaByNoka({
              noka
            })
  
            // console.log(pst)
            if(pst.aktif && pst.kdProviderPst.kdProvider.trim() === that.config.PCAREUSR) {
              if(pst.pstProl && pst.pstProl !== ''){
                if(pst.pstProl.includes('HT') && randomListHT.length < inputHT){
                  randomListHT.push(pst.noKartu)
                }
                if(pst.pstProl.includes('DM') && randomListDM.length < inputDM){
                  randomListDM.push(pst.noKartu)
                }
              } else {
                if((randomListHT.length + randomListDM.length + randomListSkt.length) < inputSakit){
                  randomListSkt.push(pst.noKartu)
                } else if((randomListSht.length + randomListDM.length + randomListHT.length + randomListSkt.length) < akanDiinput){
                  randomListSht.push(pst.noKartu)
                }
              }
  
            }
  
          }
        }
      }
      tanggal = that.tglKmrn(tanggal)

    }
  
    while((randomListHT.length + randomListDM.length + randomListSkt.length) < inputSakit){
      await baleni()
    }
    while((randomListSht.length + randomListDM.length + randomListHT.length + randomListSkt.length) < akanDiinput){
      await baleni()
    }

    that.spinner.succeed(`random list sehat ready: ${randomListSht.length}`)
    that.spinner.succeed(`random list dm ready: ${randomListDM.length}`)
    that.spinner.succeed(`random list ht ready: ${randomListHT.length}`)
    that.spinner.succeed(`random list sakit ready: ${randomListSkt.length}`)
    that.randomList = [
      ...randomListSht.map( no => ({
        no,
        ket: 'sht'
      })),
      ...randomListSkt.map( no => ({
        no,
        ket: 'skt'
      })),
      ...randomListDM.map( no => ({
        no,
        ket: 'dm'
      })),
      ...randomListHT.map( no => ({
        no,
        ket: 'ht'
      }))
    ]

  }catch(e){
    console.error(e)
  }
}

exports._getPeserta = async({
  that
}) => {
  try {
    let blnThn = that.blnThnGetPst()
    let kunjBlnIni = []
    let tanggal = that.tglBlnLalu()

    while(!tanggal.includes(blnThn)) {
      let kunjHariIni = await that.getPendaftaranProvider({
        tanggal
      })
      kunjBlnIni = [...kunjBlnIni, ...kunjHariIni]
      tanggal = that.tglKmrn(tanggal)
    }

    const kartuList = kunjBlnIni.map( ({
      peserta: {
        noKartu
      }
    }) => noKartu )

    const uniqKartu = that.uniqEs6(kartuList)

    return uniqKartu

  }catch(e){
    that.spinner.fail(e)
  }
}

exports._getRiwayatKunjungan = async ({that, peserta}) => {
  try{
    const { headers } = await that.getArgs()
    that.spinner.start(`fetch riwayat kunjungan ${peserta.nama ? peserta.nama : peserta.noKartu }`)

    const baseURL = `${that.config.APIV3}`
  
    const instance = axios.create({
      baseURL,
      headers
    })

    let res = await instance.get(`/kunjungan/peserta/${peserta.noKartu}`)

    if(res && res.data && res.data.response && res.data.response.list.length){
      let riws = res.data.response.list
      // let tinggiBadan = 0
      // let beratBadan = 0
      if(riws && riws.length) for(let riw of riws){
        if(riw.beratBadan && riw.tinggiBadan){
          // tinggiBadan = riw.tinggiBadan
          // beratBadan = riw.beratBadan
          // console.log(riw)
          if(riw.tinggiBadan && riw.beratBadan){
            that.dataBBTB.push({
              noKartu: riw.peserta.noKartu,
              tinggiBadan: riw.tinggiBadan,
              beratBadan: riw.beratBadan
            })
            that.cekPstSudah.push(riw.peserta.noKartu)
          }

          break
        }
      }


      return res.data.response.list
    }
    return []

  }catch({
    response
  }){
    return response
  }
}

exports._getPesertaByNoka = async ({ that, noka}) => {
  try{
    const { headers } = await that.getArgs()

    that.spinner.start(`get peserta by no kartu: ${noka}`)

    const baseURL = `${that.config.APIV3}`
  
    const instance = axios.create({
      baseURL,
      headers
    })

    let res = await instance.get(`/peserta/noka/${noka}`)
    if(res && res.data && res.data.response ){
      return res.data.response
    }

  }catch({
    response
  }){
    return response
  }

}