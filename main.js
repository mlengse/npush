if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {
  try{
    await app.close(isPM2)

    console.log(`process done: ${new Date()}`)
  }catch(e){
    console.error(e)
    console.error(`process error: ${new Date()}`)
  }
}