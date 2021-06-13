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

  } catch (e) {
    that.spinner.fail(JSON.stringify(e))
    // return data
  }
}


exports._sendMCU = async ({ that, noKunjungan, daft }) => {
  let mcu = {
    kdMCU: 0,
    noKunjungan: noKunjungan,
    kdProvider: that.config.PROVIDER,
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
    gulaDarahPuasa: daft.ket === 'dm' ? (daft.kontak && daft.kontak.GDP ? daft.kontak.GDP : that.getGDP()) : 0,
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
    if (res) {
      return res.data
    }

  } catch (e) {
    that.spinner.fail(JSON.stringify(e))
    // return data
  }
}

exports._getMCU = async ({
  that,
  noKunjungan
}) => {
  that.spinner.start(`get MCU by no kunj: ${noKunjungan}`)
  try {

    let mcu
    if (that.config.ARANGODB_DB) {
      let mcuDB = await that.arangoQuery({
        aq: `FOR m in mcu
        FILTER m._key == "${noKunjungan}"
        RETURN m`
      })

      if (mcuDB.length) {
        mcu = mcuDB[0]
      }
    } else {
      mcu = that.getMCUJSON(noKunjungan)
    }
      
    if (!mcu) {
      const { headers } = await that.getArgs()

      const baseURL = `${that.config.APIV3}`

      const instance = axios.create({
        baseURL,
        headers
      })

      let res = await instance.get(`/mcu/kunjungan/${noKunjungan}`)
      if (res && res.data && res.data.response && res.data.response.list ) {

        that.config.ARANGODB_DB ? await that.arangoUpsert({
          coll: 'mcu',
          doc: Object.assign({}, res.data.response.list[0], {
            _key: noKunjungan,
          })
        }) : that.addMCUJSON(res.data.response.list[0])

        return res.data.response.list[0]
        
      }

    }

    return mcu
  } catch (e) {
    that.spinner.fail(`${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
    return null
  }


}



exports._sendKunj = async ({ that, daft }) => {
  // console.log(daft)
  let sistole, diastole, kdDiag1, kdDokter
  if (daft.kontak) {
    kdDiag1 = kontak.Diagnosis
    kdDokter = kontak.Petugas.split('\t')[0]
    if (daft.ket === 'ht') {
      sistole = kontak.Sistolik
      diastole = kontak.Diastolik
    }
  }

  let bbtb = that.dataBBTB.filter(({ noKartu }) => noKartu === daft.det.noKartu)[0]
  if (bbtb && bbtb.beratBadan) {
    that.kunjunganNow = {
      noKunjungan: null,
      noKartu: daft.det.noKartu,
      tglDaftar: daft.det.tglDaftar,
      kdPoli: daft.det.kdPoli,
      keluhan: daft.ket === 'skt' ? '-' : daft.ket,
      kdSadar: "01",
      sistole: sistole || that.getSystole(),
      diastole: diastole || that.getDiastole(),
      beratBadan: that.dataBBTB.filter(({ noKartu }) => noKartu === daft.det.noKartu)[0].beratBadan,
      tinggiBadan: that.dataBBTB.filter(({ noKartu }) => noKartu === daft.det.noKartu)[0].tinggiBadan,
      respRate: that.getRR(),
      heartRate: that.getHR(),
      terapi: "",
      kdStatusPulang: "3",
      tglPulang: daft.det.tglDaftar,
      kdDokter: kdDokter || that.config.KDDOKTER,
      kdDiag1: daft.ket === 'skt' ? (kdDiag1 || 'Z00') : daft.ket === 'ht' ? 'I10' : 'E11',
      kdDiag2: null,
      kdDiag3: null,
      kdPoliRujukInternal: null,
      rujukLanjut: null,
      kdTacc: 0,
      alasanTacc: null
    }

    // console.log(that.kunjunganNow)

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
      if (res) {
        return res.data
      }

    } catch (e) {
      that.spinner.fail(JSON.stringify(e))
      // return data
    }

  }

}

exports._addPendaftaran = async ({
  that,
  pendaftaran
}) => {

  try {
    const {
      headers
    } = await that.getArgs()

    const baseURL = `${that.config.APIV3}`

    const instance = axios.create({
      baseURL,
      headers
    })

    let res = await instance.post('/pendaftaran', pendaftaran)

    if (res && res.data) {
      return res.data
    }
  } catch (err) {
    if(err.response && err.response.data){
      return err.response.data
    }
    that.spinner.fail(err)
  }
}

exports._getPendaftaranProvider = async ({
  that,
  tanggal
}) => {
  if (!tanggal) {
    tanggal = that.tglHariIni()
  }

  try {
    let listAll = []
    let countAll = 1

    let tgl = Number(tanggal.split('-')[0])

    // console.log(that.blnThn(), tanggal, tanggal.includes(that.blnThn()))

    if (that.config.ARANGODB_DB && !tanggal.includes(that.blnThn())) { // || (tanggal.includes(that.blnThn()) && that.tgl() - tgl > 4))) {
      let daftDB = await that.arangoQuery({
        aq: `FOR d in pendaftaranJKN
        FILTER d._key == "${tanggal}"
        RETURN d`
      })

      if (daftDB.length) {
        listAll = daftDB[0].list
        countAll = daftDB[0].jumlah
      }
    }

    if (!listAll.length) {
      that.spinner.start(`get pendaftaran tgl ${tanggal}`)
      const args = await that.getArgs()

      // that.spinner.start(args)

      const client = new Client()
      do {
        let start = listAll.length
        let apiURL = `${that.config.APIV3}/pendaftaran/tglDaftar/${tanggal}/${start}/300`

        // that.spinner.start(`url: ${apiURL}`)

        let {
          response,
          metadata
        } = await new Promise((resolve, reject) => {
          let req = client.get(apiURL, args, data => resolve(data))
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

      listAll.length && that.config.ARANGODB_DB && await that.arangoUpsert({
        coll: 'pendaftaranJKN', doc: {
          _key: tanggal,
          jml: listAll.length,
          list: listAll
        }
      })

      // if(listAll.length) for(let re of listAll) {
      //   that.config.ARANGODB_DB && await that.arangoUpsert({
      //     coll: 'pesertaJKN',
      //     doc: Object.assign({}, re.peserta, re.progProlanis, {
      //       _key: re.peserta.noKartu,
      //     })
      //   })

      // }
    }



    listAll.length && that.spinner.succeed(`pendaftaran tgl ${tanggal}: ${listAll.length}`)

    return listAll;

  } catch (e) {
    that.spinner.fail(e)
    return that.getPendaftaranProvider({
      tanggal
    })
  }

}

exports._getPesertaInput = async ({
  that,
  akanDiinput,
  // kunjBlnIni,
  // uniqKartu,
  inputSakit,
  inputHT,
  inputDM,
  listPstHT,
  listPstDM
}) => {

  try {
    let count = 0
    let tanggal = that.tglBlnLalu()
    let randomListSht = []
    let randomListDM = []
    let randomListHT = []
    let randomListSkt = []

    while(listPstHT.length && randomListHT.length < inputHT){
      let ht = listPstHT.pop()
      randomListHT.push(ht)
      // inputHT--
    }
    while(listPstDM.length && randomListDM.length < inputDM){
      let dm = listPstDM.pop()
      randomListDM.push(dm)
      // console.log(listPstDM.length, randomListDM.length, inputDM)
      // inputDM--
    }

    const baleni = async () => {

      let kunjHariIni = await that.getPendaftaranProvider({
        tanggal
      })
      // console.log(kunjHariIni)
      let kartuList = kunjHariIni.map(({
        peserta: {
          noKartu,
        },
        beratBadan,
        tinggiBadan
      }) => ({
        noka: noKartu,
        beratBadan,
        tinggiBadan
      }))

      for (kart of kartuList) {
        // console.log(kart)
        let {
          noka,
          beratBadan,
          tinggiBadan
        } = kart
        if (that.cekPstSudah.indexOf(noka) === -1 && that.daftUnik.indexOf(noka) === -1) {
          that.cekPstSudah.push(noka)

          if (tinggiBadan === 0 || beratBadan === 0) {
            await that.getRiwayatKunjungan({
              peserta: {
                noKartu: noka
              }
            })

          }

          if (
            randomListSkt.indexOf(noka) === -1 ||
            randomListHT.indexOf(noka) === -1 ||
            randomListDM.indexOf(noka) === -1 ||
            randomListSht.indexOf(noka) === -1
          ) {
            // randomListSht.push(noka)
            let pst = await that.getPesertaByNoka({
              noka
            })

            // console.log(pst)
            if (pst && pst.aktif && pst.kdProviderPst.kdProvider.trim() === that.config.PROVIDER) {
              if (pst.pstProl && pst.pstProl !== '') {
                if (pst.pstProl.includes('HT') && randomListHT.length < inputHT) {
                  randomListHT.push(pst.noKartu)
                }
                if (pst.pstProl.includes('DM') && randomListDM.length < inputDM) {
                  randomListDM.push(pst.noKartu)
                }
              } else {
                if ((randomListHT.length + randomListDM.length + randomListSkt.length) < inputSakit) {
                  randomListSkt.push(pst.noKartu)
                } else if ((randomListSht.length + randomListDM.length + randomListHT.length + randomListSkt.length) < akanDiinput) {
                  randomListSht.push(pst.noKartu)
                }
              }

            }

          }
        }
      }
      tanggal = that.tglKmrn(tanggal)
      count++

    }

    while ((randomListSht.length + randomListDM.length + randomListHT.length + randomListSkt.length) < akanDiinput || randomListDM.length < inputDM || randomListHT.length < inputHT || (randomListHT.length + randomListDM.length + randomListSkt.length) < inputSakit) {
      await baleni()
    }

    if (!that.config.RPPT) {
      randomListSkt = [...randomListSkt, ...randomListDM, ...randomListHT]
      randomListDM = []
      randomListHT = []
    }

    if (!that.config.KUNJ_SAKIT) {
      randomListSht = [...randomListSkt, ...randomListSht]
      randomListSkt = []
    }

    randomListSht.length && that.spinner.succeed(`random list sehat ready: ${randomListSht.length}`)
    process.env.RPPT && randomListDM.length && that.spinner.succeed(`random list dm ready: ${randomListDM.length}`)
    process.env.RPPT && randomListHT.length && that.spinner.succeed(`random list ht ready: ${randomListHT.length}`)
    process.env.KUNJ_SAKIT && randomListSkt.length && that.spinner.succeed(`random list sakit ready: ${randomListSkt.length}`)
    that.randomList = [
      ...randomListSht.map(no => ({
        no,
        ket: 'sht'
      })),
      ...randomListSkt.map(no => ({
        no,
        ket: 'skt'
      })),
      ...randomListDM.map(no => ({
        no,
        ket: 'dm'
      })),
      ...randomListHT.map(no => ({
        no,
        ket: 'ht'
      }))
    ]

  } catch (e) {
    that.spinner.fail(`${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
  }
}

exports._getPeserta = async ({
  that
}) => {
  try {
    let blnThn = that.blnThnGetPst()
    let kunjBlnIni = []
    let tanggal = that.tglBlnLalu()

    while (!tanggal.includes(blnThn)) {
      let kunjHariIni = await that.getPendaftaranProvider({
        tanggal
      })
      kunjBlnIni = [...kunjBlnIni, ...kunjHariIni]
      tanggal = that.tglKmrn(tanggal)
    }

    const kartuList = kunjBlnIni.map(({
      peserta: {
        noKartu
      }
    }) => noKartu)

    const uniqKartu = that.uniqEs6(kartuList)

    return uniqKartu

  } catch (e) {
    that.spinner.fail(e)
  }
}

exports._getRiwayatKunjungan = async ({ that, peserta, bln, count }) => {
  let riws = []

  try {
    that.spinner.start(`find riwayat kunjungan ${peserta.nama ? peserta.nama : peserta.noKartu}`)

    if (that.config.ARANGODB_DB) {
      let kunjDB = await that.arangoQuery({
        aq: `FOR k IN kunjJKN
        FILTER k.peserta.noKartu == "${peserta.noKartu}"
        ${bln ? `AND CONTAINS(k.tglKunjungan, "${bln}")` : ''}
        RETURN k`
      })
      kunjDB.length ? riws = kunjDB : null
    } else {
      riws = that.getKunjJKNByPst(peserta.noKartu, bln)
    }

    if (!riws.length  || ( riws.length && count &&  riws.length < count)) {
      const { headers } = await that.getArgs()
      const baseURL = `${that.config.APIV3}`

      const instance = axios.create({
        baseURL,
        headers
      })

      that.spinner.start(`fetch riwayat kunjungan ${peserta.nama ? peserta.nama : peserta.noKartu}, riws ${riws.length}, count ${count ? count : 0}, ${riws.length < count}`)
      let res = await instance.get(`/kunjungan/peserta/${peserta.noKartu}`)
      // that.spinner.succeed()
      if (res && res.data && res.data.response && res.data.response.list.length) {
        riws = res.data.response.list
        if (riws && riws.length) for (let riw of riws) {
          that.config.ARANGODB_DB ? await that.arangoUpsert({
            coll: 'kunjJKN',
            doc: riw
          }) : that.addKunjJKN(riw)
        }
      }
    }

    let bb = 0
    let tb = 0
    if (riws && riws.length) {
      for (let riw of riws) {
        if (riw.tinggiBadan > 0) {
          tb = riw.tinggiBadan
        }
        if (riw.beratBadan > 0) {
          bb = riw.beratBadan
        }
        if (bb && tb) {
          if (!that.dataBBTB) {
            that.dataBBTB = []
          }
          that.dataBBTB.push({
            noKartu: riw.peserta.noKartu,
            tinggiBadan: tb,
            beratBadan: bb
          })
          if (!that.cekPstSudah) {
            that.cekPstSudah = []
          }
          that.cekPstSudah.push(riw.peserta.noKartu)
          break
        }
      }
    }
    return riws.filter( e => e.tglKunjungan.includes(bln))

  } catch (e) {
    // that.spinner.fail(`${new Date()} riwayat kunjungan ${peserta.nama ? peserta.nama : peserta.noKartu} | ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
  }
}

exports._getPesertaByNoka = async ({ that, noka }) => {
  that.spinner.start(`find peserta by no kartu: ${noka}`)
  noka = (escape(noka)).split(' ').join('')
  if (noka.length === 13) {

    let pesertaArr, peserta
    that.config.ARANGODB_DB ? pesertaArr = await that.arangoQuery({
      aq: `FOR p IN pesertaJKN
      FILTER p._key == "${noka}"
      RETURN p`
    }): peserta = that.getPesertaJKN(noka)

    if(!peserta && pesertaArr && pesertaArr.length ) {
      peserta = pesertaArr[0]
    }

    if(!peserta || (peserta && !peserta.aktif)) {
      try {
        const { headers } = await that.getArgs()
  
        that.spinner.start(`fetch peserta by no kartu: ${noka}`)
  
        const baseURL = `${that.config.APIV3}`
  
        const instance = axios.create({
          baseURL,
          headers
        })
  
        let res = await instance.get(`/peserta/noka/${noka}`)
        if (res && res.data && res.data.response) {
          // console.log(res.data.response)
          that.config.ARANGODB_DB ? await that.arangoUpsert({
            coll: 'pesertaJKN', 
            doc: Object.assign({}, res.data.response, {
              _key: noka,
            })
          }) : that.addPesertaJKN(res.data.response)
          return res.data.response
        }
        return null
  
      } catch (e) {
        that.spinner.fail(`${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
        return null
      }
    }

    return peserta
  

  }

  return null

}