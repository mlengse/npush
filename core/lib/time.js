const moment = require('moment')

exports.tgl = () => moment().add(-1, 'd').date()
exports.blnThn = () => moment().add(-1, 'd').format('MM-YYYY')
exports.tglHariIni = () => `${this.tgl()}-${this.blnThn()}`
exports.xTimestamp = () => moment.utc().format('X')
exports.now = moment().format('D')
exports.end = moment().endOf('month').format('D')
exports.blnThnGetPst = () => moment().add(-3, 'month').format('MM-YYYY')
exports.tglBlnLalu = () => moment().add(-1, 'month').format('D-MM-YYYY')
exports.tglKmrn = tgl  => moment(tgl, 'D-MM-YYYY').clone().add(-1,'d').format('D-MM-YYYY')
exports.tglDaftar = () => moment().add(-3, 'd').format('DD-MM-YYYY')