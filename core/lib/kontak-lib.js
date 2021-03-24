let noT = 0

exports._sendToWA = async ({ that, message }) => {
  let text, from, errText
  text = `Terima kasih atas kepercayaan Bpk/Ibu ${message.nama} terhadap pelayanan Puskesmas ${process.env.PUSKESMAS}.`
  if(message.daftResponse){
    let { response } = message.daftResponse
    if(Array.isArray(response)) {
      for(let { field, message} of response ){
        if(field === 'noKartu'){
          errText = `\n${field}: ${message}`
        } else {
          console.log(response)
        }
      }
    } else {
      console.log(response)
    }

  } 
  message.kunjResponse && console.log('kunj resp', message.kunjResponse)
  message.mcuResponse && console.log('mcu resp', message.mcuResponse)
  if(message.Tlp_Peserta.match(/^(08)([0-9]){1,12}$/)){
    from = message.Tlp_Peserta
  }
  if(!from && message.noHP.match(/^(08)([0-9]){1,12}$/)){
    from = message.noHP
  }
  if(from) {
    from = `62${from.substr(1)}@c.us`
    if(errText && errText.length){
      text = `${text}\nKami menemukan pesan dari sistem JKN:${errText}`
    }

    console.log('from', from)
    console.log('text', text)

    // that.redisPublish({
    //   topic: 'sendwa',
    //   message: JSON.stringify({
    //     from,
    //     text
    //   })
    // })


  }

}

exports._sendToWS = async ({ that, kontak }) => {
  //---------------------------------------
  // add pendaftaran

  let ket
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
  let pendaftaran = {
    kontak,
    ket,
    det: {
      "kdProviderPeserta": that.config.PROVIDER,
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

  noT++
  that.spinner.succeed(`${noT}: ${pendaftaran.det.noKartu}`)

  that.spinner.start(`add pendaftaran: ${pendaftaran.det.noKartu}`)
  let daftResponse, kunjResponse, mcuResponse
  
  daftResponse = await that.addPendaftaran({
    pendaftaran: pendaftaran.det
  })

  if(daftResponse) that.spinner.succeed(JSON.stringify(daftResponse))

  if(pendaftaran.det.kunjSakit) {
    //add kunj
    kunjResponse = await that.sendKunj({ daft: pendaftaran })
    if(kunjResponse) {
      that.spinner.succeed(JSON.stringify(kunjResponse))
      if(kunjResponse && kunjResponse.response && kunjResponse.response.message && (pendaftaran.ket === 'dm' || pendaftaran.ket === 'ht')){
        // add mcu

        mcuResponse = await that.sendMCU({
          daft: pendaftaran,
          noKunjungan:kunjResponse.response.message 
        })
        if(mcuResponse) that.spinner.succeed(JSON.stringify(mcuResponse))
  
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