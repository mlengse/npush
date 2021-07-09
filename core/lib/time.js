const moment = require('moment')
moment.locale('id')

const getBaseDate = () => {
  let baseDate = moment().format('DD-MM-YYYY')
  if(process.env.BASE_DATE){
    baseDate = process.env.BASE_DATE
  }
  return baseDate
}

// moment.now = () => +new Date('2021', '2', '28');
exports.unixTime = () => moment().format('x')
exports.getFormat1 = e => moment(e, 'D MMMM YYYY').format('YYYYMMDD')
exports.getFormat2 = e => moment(e, 'D MMMM YYYY').format('YYYY-MM-DD')
exports.checkDateA = ( a ) =>  a === moment().format('M/DD/YYYY')
exports.checkDateC = ( a ) =>  a === moment().add(-1, 'day').format('M/DD/YYYY')
exports.checkDate = ( a, b ) => moment(a, 'DD-MM-YYYY').format('M/DD/YYYY') === b
exports.xTimestamp = () => moment.utc().format('X')
exports.tgl = () => moment(getBaseDate(), 'DD-MM-YYYY').date()
exports.blnThn = () => moment(getBaseDate(), 'DD-MM-YYYY').add(-1, 'd').format('MM-YYYY')
exports.tglHariIni = () => `${this.tgl()}-${this.blnThn()}`
exports.tglKemarin = () => moment().add(-1, 'day').format('DD-MM-YYYY')
exports.now = moment(getBaseDate(), 'DD-MM-YYYY').format('D')
exports.end = moment(getBaseDate(), 'DD-MM-YYYY').endOf('month').format('D')
exports.blnThnGetPst = () => moment(getBaseDate(), 'DD-MM-YYYY').add(-3, 'month').format('MM-YYYY')
exports.reverseFormat = tgl => moment(tgl, 'DD-MM-YYYY').format('YYYY-MM-DD')
exports.getTahunBy = e => moment(e, 'YYYY-MM-DD').format('YYYY')
exports.tglBlnLalu = () => moment(getBaseDate(), 'DD-MM-YYYY').add(-1, 'month').format('D-MM-YYYY')
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
 if(moment(getBaseDate(), 'DD-MM-YYYY').day() === 0){
  if(moment(getBaseDate(), 'DD-MM-YYYY').add(-4, 'd').day() === 0){
    return moment(getBaseDate(), 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
  } else {
    return moment(getBaseDate(), 'DD-MM-YYYY').add(-4, 'd').format('DD-MM-YYYY')
  }
 } else {
  if(moment(getBaseDate(), 'DD-MM-YYYY').add(-3, 'd').day() === 0){
    return moment(getBaseDate(), 'DD-MM-YYYY').add(-2, 'd').format('DD-MM-YYYY')
  } else {
    return moment(getBaseDate(), 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
  }
 } 
} 