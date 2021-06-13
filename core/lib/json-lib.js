const FileSync = require('lowdb/adapters/FileSync')
const db = require('lowdb')(new FileSync('./db/db.json'))
const pesertaJKN = require('lowdb')(new FileSync('./db/peserta-jkn.json'))
const kunjJKN = require('lowdb')(new FileSync('./db/kunj-jkn.json'))
const mcu = require('lowdb')(new FileSync('./db/mcu-jkn.json'))
const bbtb = require('lowdb')(new FileSync('./db/bbtb.json'))
db.defaults({ liburnas: [] }).write()    
pesertaJKN.defaults({ peserta: [] }).write()    
kunjJKN.defaults({ kunj: [] }).write()    
mcu.defaults({ mcu: [] }).write()    
bbtb.defaults({ bbtb: [] }).write()    


exports.addLiburnas = obj => db.get('liburnas').push(obj).write()
exports.getLiburArr = tahun => db.get('liburnas').filter({ tahun }).value()

exports.addPesertaJKN = obj => this.getPesertaJKN(obj.noKartu) ? pesertaJKN.get('peserta').filter( { noKartu: obj.noKartu}).assign(obj).write() : pesertaJKN.get('peserta').push(obj).write()
exports.getPesertaJKN = noKartu => (pesertaJKN.get('peserta').filter({ noKartu }).value())[0]

exports.addKunjJKN = obj => this.getKunjJKNByNoKunj(obj.noKunjungan) ? kunjJKN.get('kunj').filter({ noKunjungan: obj.noKunjungan }).assign(obj).write() : kunjJKN.get('kunj').push(obj).write()
exports.getKunjJKNByPst = (noKartu, bln) => (kunjJKN.get('kunj').filter({ peserta: { noKartu } }).value()).filter(e => (bln && e.tglKunjungan.includes(bln)) || !bln)
exports.getKunjJKNByNoKunj = noKunjungan => (kunjJKN.get('kunj').filter({ noKunjungan }).value())[0]

exports.addMCUJSON = obj => this.getMCUJSON(obj.noKunjungan) ? mcu.get('mcu').filter({ noKunjungan: obj.noKunjungan }).assign(obj).write() : mcu.get('mcu').push(obj).write()
exports.getMCUJSON = noKunjungan => (mcu.get('mcu').filter({ noKunjungan }).value())[0]


exports.addbbtb = obj => this.getbbtb(obj.noKartu) ? bbtb.get('bbtb').filter({ noKartu: obj.noKartu }).assign(obj).write() : bbtb.get('bbtb').push(obj).write()
exports.getbbtb = noKartu => (bbtb.get('bbtb').filter({ noKartu }).value())[0]
