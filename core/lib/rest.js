const {
  Client
} = require('node-rest-client')
const axios = require('axios')

exports._sendKunj = async ({that, daft}) => {
  // console.log(that.dataBBTB.filter( ({ noKartu }) => noKartu === daft.det.noKartu))
  let kunjungan = {
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
    kdDokter: '123139',
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
    that.spinner.start(`send kunjungan ${daft.det.tglDaftar}`)
    const {
      headers
    } = await that.getArgs()
  
    const baseURL = `${that.config.APIV3}`
  
    const instance = axios.create({
      baseURL,
      headers
    })

    let res = await instance.post('/kunjungan', kunjungan)
    if(res){
      return res.data
    }

  }catch(e){
    that.spinner.fail(JSON.stringify(e))
    // return data
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
        response 
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
          reject('request error', err);
        });
      });
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
  inputRPPT
}) => {

  try {
    // let blnThn = that.blnThnGetPst()
    // let kunjBlnIni = []
    let tanggal = that.tglBlnLalu()
    let randomListSht = []
    let randomListDM = []
    let randomListHT = []
    let randomListSkt = []

    let cekPstSudah =[]

    that.dataBBTB = []

    let baleni = async () => {
      let kunjHariIni = await that.getPendaftaranProvider({
        tanggal
      })
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
  
      for ({noka, beratBadan, tinggiBadan} of kartuList) if(cekPstSudah.indexOf(noka) === -1 && uniqKartu.indexOf(noka) === -1) {
        cekPstSudah.push(noka)
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
          if(pst.aktif) {
            if((randomListHT.length + randomListDM.length + randomListSkt.length) < inputRPPT){
              if(pst.pstProl && pst.pstProl !== ''){
                if(pst.pstProl === 'HT'){
                  randomListHT.push(pst.noKartu)
                }
                if(pst.pstProl === 'DM'){
                  randomListDM.push(pst.noKartu)
                }
              } else {
                randomListSkt.push(pst.noKartu)
              }
            } else if((randomListSht.length + randomListDM.length + randomListHT.length + randomListSkt.length) < akanDiinput){
              randomListSht.push(pst.noKartu)
            }

          }

        }
      }
      tanggal = that.tglKmrn(tanggal)

    }
  
    // while((randomListHT.length + randomListDM.length + randomListSkt.length) < inputRPPT){
    //   await baleni()
    // }
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
    response: {
      data
    }
  }){
    return data
  }

}