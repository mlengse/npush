const moment = require('moment')
exports.xTimestamp = () => moment.utc().format('X')
// moment.now = () => +new Date('2021', '0', '30');
exports.tgl = () => moment('31-01-2021', 'DD-MM-YYYY').add(-1, 'd').date()
exports.blnThn = () => moment('31-01-2021', 'DD-MM-YYYY').add(-1, 'd').format('MM-YYYY')
exports.tglHariIni = () => `${this.tgl()}-${this.blnThn()}`
exports.now = moment('31-01-2021', 'DD-MM-YYYY').format('D')
exports.end = moment('31-01-2021', 'DD-MM-YYYY').endOf('month').format('D')
exports.blnThnGetPst = () => moment('31-01-2021', 'DD-MM-YYYY').add(-3, 'month').format('MM-YYYY')
exports.tglBlnLalu = () => moment('31-01-2021', 'DD-MM-YYYY').add(-1, 'month').format('D-MM-YYYY')
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
 if(moment('31-01-2021', 'DD-MM-YYYY').day() === 0){
  if(moment('31-01-2021', 'DD-MM-YYYY').add(-4, 'd').day() === 0){
    return moment('31-01-2021', 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
  } else {
    return moment('31-01-2021', 'DD-MM-YYYY').add(-4, 'd').format('DD-MM-YYYY')
  }
 } else {
  if(moment('31-01-2021', 'DD-MM-YYYY').add(-3, 'd').day() === 0){
    return moment('31-01-2021', 'DD-MM-YYYY').add(-2, 'd').format('DD-MM-YYYY')
  } else {
    return moment('31-01-2021', 'DD-MM-YYYY').add(-3, 'd').format('DD-MM-YYYY')
  }
 } 
} 