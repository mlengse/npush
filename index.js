const { schedule } = require('node-cron')
const init = require('./init')
const initRem = require('./init-sheet')
const menit = Math.floor(Math.random() * 60)
const jamPagi = 6 + Math.floor(Math.random() * 6)
const jamSore = 13 + Math.floor(Math.random() * 6)

console.log(`set cron push: ${menit} ${jamPagi},${jamSore} * * * ${new Date()}`)
process.env.SHEET_ID && console.log(`set cron sheet: ${Math.floor(menit*3/5)} 8-17 * * 1-6 ${new Date()}`)

schedule(`${menit} ${jamPagi},${jamSore} * * *`, ()=>{
	console.log(`running scheduled main app: ${new Date()}`)
	init(true)
})

process.env.SHEET_ID && schedule(`${Math.floor(menit*3/5)} 8-17 * * 1-6`, ()=>{
	console.log(`running scheduled appsheet: ${new Date()}`)
	initRem(true)
})