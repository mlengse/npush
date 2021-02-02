const moment = require('moment')
exports.xTimestamp = () => moment.utc().format('X')
// moment.now = () => +new Date('2021', '0', '30');
exports.tgl = () => moment().add(-1, 'd').date()
exports.blnThn = () => moment().add(-1, 'd').format('MM-YYYY')
exports.tglHariIni = () => `${this.tgl()}-${this.blnThn()}`
exports.now = moment().format('D')
exports.end = moment().endOf('month').format('D')
exports.blnThnGetPst = () => moment().add(-3, 'month').format('MM-YYYY')
exports.tglBlnLalu = () => moment().add(-1, 'month').format('D-MM-YYYY')
exports.tglKmrn = tgl  => moment(tgl, 'D-MM-YYYY').clone().add(-1,'d').format('D-MM-YYYY')
exports.tglDaftarA = (a) => {
  if(moment(a, 'DD-MM-YYYY').day() === 0){
   if(moment(a, 'DD-MM-YYYY').add(-4, 'd').day() === 0){
     return moment(a, 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
   } else {
     return moment(a, 'DD-MM-YYYY').add(-4, 'd').format('DD-MM-YYYY')
   }
  } else {
   if(moment(a, 'DD-MM-YYYY').add(-3, 'd').day() === 0){
     return moment(a, 'DD-MM-YYYY').add(-2, 'd').format('DD-MM-YYYY')
   } else {
     return moment(a, 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
   }
  } 
} 
exports.tglDaftar = () => {
 if(moment().day() === 0){
  if(moment().add(-4, 'd').day() === 0){
    return moment().add(-3, 'd').format('DD-MM-YYYY')
  } else {
    return moment().add(-4, 'd').format('DD-MM-YYYY')
  }
 } else {
  if(moment().add(-3, 'd').day() === 0){
    return moment().add(-2, 'd').format('DD-MM-YYYY')
  } else {
    return moment().add(-3, 'd').format('DD-MM-YYYY')
  }
 } 
} 