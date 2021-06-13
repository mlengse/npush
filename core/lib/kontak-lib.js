let noT = 0

exports._upsertKontakJKN = async ({ that, doc }) => {
  let res = await that.arangoUpsert({
    coll: 'kontak-jkn', 
    doc: Object.assign({}, doc, {
      _key: doc._key || doc.ID || doc.id || that.unixTime()
    })
  })
  return res.NEW
}

exports._sendToWA = async ({ that, message, push }) => {
  let text, from, errText

  text = `Terima kasih atas kepercayaan Bpk/Ibu ${message.nama} terhadap pelayanan Puskesmas ${process.env.PUSKESMAS}.`

  if(message.daftResponse){
    if(!message.nama || !message.noHP) {
      message = await that.getPatient({message})
    }

    if(push){
      text = `Yth Bpk/Ibu ${message.nama},\nkami dari Puskesmas ${process.env.PUSKESMAS} menginformasikan, untuk pencegahan penyebaran Covid-19, tetap lakukan 3M Plus: \n*) Memakai masker dengan benar \n*) Menjaga jarak \n*) Mencuci tangan dengan sabun dan air mengalir \n*) Plus menjaga pola hidup bersih dan sehat. `
    }

    let { response } = message.daftResponse

    if(Array.isArray(response)) {
      for(let { field, message} of response ){
        if(field === 'noKartu'){
          errText = `\n${field}: ${message}`
        } else if(field !== 'noUrut') {
          that.spinner.fail(response)
        }
      }
    } else if(!JSON.stringify(response).includes('noUrut')) {
      that.spinner.fail(response)
    }
    // message.kunjResponse && console.error('kunj resp', message.kunjResponse)
    // message.mcuResponse && console.error('mcu resp', message.mcuResponse)
    if(message.Tlp_Peserta && message.Tlp_Peserta.match(/^(08)([0-9]){1,12}$/)){
      from = message.Tlp_Peserta
    }
    if(!from && message.noHP && message.noHP.match(/^(08)([0-9]){1,12}$/)){
      from = message.noHP
    }
    if(!from && message.no_hp && message.no_hp.match(/^(08)([0-9]){1,12}$/)){
      from = message.no_hp
    }
    if(from) {
      from = `62${from.substr(1)}@c.us`
      if(errText && errText.length){
        text = `${text}\nKami menemukan pesan dari sistem JKN:${errText}`
      }
  
      // that.spinner.succeed(`from ${from} text ${text}`)

      if(JSON.stringify(response).includes('noUrut')){
        that.redisPublish({
          topic: 'sendwa',
          message: JSON.stringify({
            nama: message.nama,
            from,
            text
          })
        })
      }
    }
  
  } 

  return Object.assign({}, message, {
    text,
    from
  })

}

exports._sendToWS = async ({ that, kontak }) => {
  //---------------------------------------
  // add pendaftaran
  let daftResponse, kunjResponse, mcuResponse, ket, pendaftaran
  if(kontak.aktif /* && kontak.kdProviderPst.kdProvider.trim() === that.config.PROVIDER*/){
    switch (kontak.Kunjungan) {
      case 'Sehat':
        ket = 'sht'
        break;
      case 'Sakit':
        ket = 'skt'
        break;
      case 'Prolanis HT':
        ket = 'ht'
        break;
      case 'Prolanis DM':
        ket = 'dm'
        break;
      default:
        break;
    }
    pendaftaran = {
      kontak,
      ket,
      det: {
        "kdProviderPeserta": kontak.kdProviderPst.kdProvider, //that.config.PROVIDER,
        "tglDaftar": that.tglDaftarB(kontak.Tanggal),
        "noKartu": kontak.noKartu,
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
    }
    that.spinner.start(`add pendaftaran: ${pendaftaran.det.noKartu}`)
  
    daftResponse = await that.addPendaftaran({
      pendaftaran: pendaftaran.det
    })
  
    noT++
    that.spinner.succeed(`${noT}: ${pendaftaran.det.noKartu}`)
  
    if(daftResponse) that.spinner.succeed(`daftResponse: ${JSON.stringify(daftResponse)}`)
  
    if(pendaftaran.det.kunjSakit) {
      //add kunj
      kunjResponse = await that.sendKunj({ daft: pendaftaran })
      if(kunjResponse) {
        that.spinner.succeed(`kunjResponse: ${JSON.stringify(kunjResponse)}`)
        if(kunjResponse && kunjResponse.response && kunjResponse.response.message && (pendaftaran.ket === 'dm' || pendaftaran.ket === 'ht')){
          // add mcu
  
          mcuResponse = await that.sendMCU({
            daft: pendaftaran,
            noKunjungan:kunjResponse.response.message 
          })
          if(mcuResponse) that.spinner.succeed(`mcuResponse: ${JSON.stringify(mcuResponse)}`)
    
        }
      }
  
    }
  
  }

  return JSON.parse(JSON.stringify(Object.assign({}, kontak, pendaftaran, { 
    kontak: undefined,
    daftResponse,
    kunjResponse,
    mcuResponse
  })))


}