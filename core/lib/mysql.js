const mysql = require('mysql')
// let connection
// let connection  = mysql.createPool({
// // const connection  = mysql.createConnection({
//   connectionLimit : 500,
//   host: process.env.MYSQL_HOST,
//   password: process.env.MYSQL_PASSWORD,
//   user: process.env.MYSQL_USER,
//   database: process.env.MYSQL_DATABASE
// });

exports._poolClose = async ({ that }) => {
  that.spinner.start('close mysql connection')

  if(!!that.connection) {
    await that.connection.end()
    that.connection = null
  }
  that.spinner.succeed(`mysql connection closed: ${new Date()}`)
}

exports._connect = async ({ that , query }) => {
  if(!that.connection || (that.connection && that.connection.state === 'disconnected') && process.env.MYSQL_USER){
    // connection  = mysql.createPool({
    that.connection = mysql.createConnection({
      // connectionLimit : 500,
      host: that.config.MYSQL_HOST,
      password: that.config.MYSQL_PASSWORD,
      user: that.config.MYSQL_USER,
      database: that.config.MYSQL_DATABASE
    });
  } 
  if(!that.connection) return []
  that.spinner.start(`query: ${query}`)
  if(query.toLowerCase().includes('undefined')) {
    that.spinner.fail(`query: ${query}`)
  }
  return await new Promise( resolve => {
    that.connection.query(query, (err, results) => {
      if(err && err.code === 'PROTOCOL_CONNECTION_LOST') {
        that.spinner.fail('mysql connection close')
        resolve(that.connect({ query }))
      }
      // that.spinner.succeed(`query: ${query}`)
      resolve(results)
    })
  })
}

exports._getVisitsHistoryByNoJKN = async ({that, peserta }) => {
  that.spinner.start(`get visits history in simpus ${peserta.nama} no jkn ${peserta.noKartu }`)
  let newVisitsHistory = []
  let visitsHistory = await that.connect({
    query: `SELECT id, no_kartu FROM visits WHERE no_kartu = "${peserta.noKartu}"`
  })
  if (visitsHistory.length) {
    for(let visit of visitsHistory) {
      let anamnesis = await that.connect({
        query: `SELECT id, systole, diastole, nadi, respirationrate, tinggi, berat FROM anamnesis WHERE visit_id = "${visit.id}"`
      })
      let diagnosis = await that.connect({
        query: `SELECT disease_id FROM diagnosis WHERE visit_id = "${visit.id}"`
      })
      if(anamnesis.length) for(let an of anamnesis) newVisitsHistory.push(an)
      if(diagnosis.length) for (let di of diagnosis) newVisitsHistory.push(di)
    }
  }
  return newVisitsHistory
}

exports._getVisitsHistoryByUmurAndSexID = async ({that, umur, sex_id}) => {
  that.spinner.start(`get visits history in simpus ${sex_id === '1' ? 'Laki-laki' : 'Perempuan'} umur ${ umur }`)
  let newVisitsHistory = []
  let visitsHistory = await that.connect({
    query: `SELECT id, umur, sex_id FROM visits WHERE umur = ${umur} AND sex_id = ${sex_id}`
  })
  if (visitsHistory.length) {
    for(let visit of visitsHistory) {
      let anamnesis = await that.connect({
        query: `SELECT id, systole, diastole, nadi, respirationrate, tinggi, berat FROM anamnesis WHERE visit_id = "${visit.id}"`
      })
      let diagnosis = await that.connect({
        query: `SELECT disease_id FROM diagnosis WHERE visit_id = "${visit.id}"`
      })
      if(anamnesis.length) for(let an of anamnesis) newVisitsHistory.push(an)
      if(diagnosis.length) for (let di of diagnosis) newVisitsHistory.push(di)
    }
  }
  return newVisitsHistory
}

exports._getDokters = async ({ that }) => await that.connect({
  query: `SELECT * FROM bpjs_workers LIMIT 1`
})

exports._getSettings = async ({ that }) => await that.connect({
  query: `SELECT * FROM healthcenters LIMIT 1`
})

exports._getPatient = async ({ that, message}) => {

  if(message && message.pendaftaran && message.pendaftaran.det && message.pendaftaran.det.noKartu) {
    try{
      let res = await that.connect({
        query: `SELECT * FROM patients WHERE no_kartu = "${message.pendaftaran.det.noKartu}"`
      })
      if(res.length){
        message = Object.assign({}, message, res[0])
        if( (!message.no_hp || (message.no_hp && !message.no_hp.match(/^(08)([0-9]){1,12}$/))) && message.no_kartu) {
          res = await that.connect({
            query: `SELECT * FROM bpjs_verifications WHERE no_bpjs = "${message.no_kartu}"`
          })
          if(res[0] && res[0].json_response && res[0].json_response.response) {
            message = Object.assign({}, message, JSON.parse(res[0].json_response.response))
    
            if(message.noHP && message.noHP.match(/^(08)([0-9]){1,12}$/)) {
              message.no_hp = message.noHP
            }
          }
        }
      }
    }catch(err) {
      that.spinner.fail(`${new Date()} ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`)
    }
    
  }


  return message
}