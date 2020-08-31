const {
  Client
} = require('node-rest-client')
const axios = require('axios')

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
      } = await new Promise(resolve =>  client.get(apiURL, args, data => resolve(data) ) );
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

    that.spinner.succeed(`pendaftaran tgl ${tanggal}: ${listAll.length}`)

    return listAll;
        
  }catch(e){
    that.spinner.fail(e)
  }

}

exports._getPeserta = async({
  that
}) => {
  try {
    let blnThn = that.blnThnGetPst()
    let kunjBlnIni = []
    let tgl = that.tglBlnLalu()

    while(!tgl.includes(blnThn)) {
      let kunjHariIni = await that.getPendaftaranProvider(tgl)
      kunjBlnIni = [...kunjBlnIni, ...kunjHariIni]
      tgl = that.tglKmrn(tgl)
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

