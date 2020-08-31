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

