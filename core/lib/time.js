const moment = require('moment')

exports.tgl = () => moment().add(-1, 'd').date()
exports.blnThn = () => moment().add(-1, 'd').format('MM-YYYY')
exports.tglHariIni = () => `${this.tgl()}-${this.blnThn()}`
exports.xTimestamp = () => moment.utc().format('X')
exports.now = moment().format('D')
exports.end = moment().endOf('month').format('D')
