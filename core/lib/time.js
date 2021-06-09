const moment = require('moment')
moment.locale('id')

let baseDate = moment().format('DD-MM-YYYY')
if(process.env.BASE_DATE){
  baseDate = process.env.BASE_DATE
}

// moment.now = () => +new Date('2021', '2', '28');
exports.unixTime = () => moment().format('x')
exports.checkDateA = ( a ) =>  a === moment().format('M/DD/YYYY')
exports.checkDateC = ( a ) =>  a === moment().add(-1, 'day').format('M/DD/YYYY')
exports.checkDate = ( a, b ) => moment(a, 'DD-MM-YYYY').format('M/DD/YYYY') === b
exports.xTimestamp = () => moment.utc().format('X')
exports.tgl = () => moment(baseDate, 'DD-MM-YYYY').date()
exports.blnThn = () => moment(baseDate, 'DD-MM-YYYY').add(-1, 'd').format('MM-YYYY')
exports.tglHariIni = () => `${this.tgl()}-${this.blnThn()}`
exports.tglKemarin = () => moment().add(-1, 'day').format('DD-MM-YYYY')
exports.now = moment(baseDate, 'DD-MM-YYYY').format('D')
exports.end = moment(baseDate, 'DD-MM-YYYY').endOf('month').format('D')
exports.blnThnGetPst = () => moment(baseDate, 'DD-MM-YYYY').add(-3, 'month').format('MM-YYYY')
exports.reverseFormat = tgl => moment(tgl, 'DD-MM-YYYY').format('YYYY-MM-DD')
exports.getTahunBy = e => moment(e, 'YYYY-MM-DD').format('YYYY')
exports.tglBlnLalu = () => moment(baseDate, 'DD-MM-YYYY').add(-1, 'month').format('D-MM-YYYY')
exports.tglKmrn = tgl  => moment(tgl, 'D-MM-YYYY').clone().add(-1,'d').format('D-MM-YYYY')
exports.tglKmrnDD = tgl  => moment(tgl, 'DD-MM-YYYY').clone().add(-1,'d').format('DD-MM-YYYY')
exports.tglDaftarB = b => moment(b, 'M/DD/YYYY').format('DD-MM-YYYY')
exports.tglPcareFromKontak = tgl => moment(tgl, 'M/D/YYYY').format('DD-MM-YYYY')
exports.tglDaftarA = (a) => {
  if(Number(a.split('-')[0]) < 4) {
    return a
  }

  if(moment(a, 'DD-MM-YYYY').day() === 0){
    if(moment(a, 'DD-MM-YYYY').add(-3, 'd').day() === 0){
      return moment(a, 'DD-MM-YYYY').add(-2, 'd').format('DD-MM-YYYY')
    } 
    return moment(a, 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
  } 

  if(moment(a, 'DD-MM-YYYY').add(-2, 'd').day() === 0){
    return moment(a, 'DD-MM-YYYY').add(-1, 'd').format('DD-MM-YYYY')
  } 
  return moment(a, 'DD-MM-YYYY').add(-2, 'd').format('DD-MM-YYYY')
} 
exports.tglDaftar = () => {
 if(moment(baseDate, 'DD-MM-YYYY').day() === 0){
  if(moment(baseDate, 'DD-MM-YYYY').add(-4, 'd').day() === 0){
    return moment(baseDate, 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
  } else {
    return moment(baseDate, 'DD-MM-YYYY').add(-4, 'd').format('DD-MM-YYYY')
  }
 } else {
  if(moment(baseDate, 'DD-MM-YYYY').add(-3, 'd').day() === 0){
    return moment(baseDate, 'DD-MM-YYYY').add(-2, 'd').format('DD-MM-YYYY')
  } else {
    return moment(baseDate, 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
  }
 } 
} 