const { schedule } = require('node-cron')
const init = require('./init')
const menit = 23 //Math.floor(Math.random() * 60)
const jamPagi = 1 + Math.floor(Math.random() * 6)
const jamSore = 15 //13 + Math.floor(Math.random() * 6)

console.log(`set cron: ${menit} ${jamPagi},${jamSore} * * * ${new Date()}`)

schedule(`${menit} ${jamPagi},${jamSore} * * *`, ()=>{
	console.log(`running scheduled app: ${new Date()}`)
	init(true)
})