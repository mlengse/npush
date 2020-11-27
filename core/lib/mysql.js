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
  if(!!that.connection) {
    await that.connection.end()
    that.connection = null
  }
}

exports._connect = async ({ that , query }) => {
  if(!that.connection){
    // connection  = mysql.createPool({
    that.connection  = mysql.createConnection({
      // connectionLimit : 500,
      host: that.config.MYSQL_HOST,
      password: that.config.MYSQL_PASSWORD,
      user: that.config.MYSQL_USER,
      database: that.config.MYSQL_DATABASE
    });
  }
  that.spinner.start(`query: ${query}`)
  if(query.toLowerCase().includes('undefined')) {
    that.spinner.succeed(`query: ${query}`)
  }
  return await new Promise( (resolve, reject) => {
    that.connection.query(query, (err, results) => {
      err ? reject(err) : null;
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

exports._getDokters = async ({
  that
}) => await that.connect({
  query: `SELECT * FROM bpjs_workers LIMIT 1`
})

exports._getSettings = async ({
  that
}) => await that.connect({
  query: `SELECT * FROM healthcenters LIMIT 1`
})