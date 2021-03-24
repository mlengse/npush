const redis = require('redis')

let subscriber, publisher
if(process.env.REDIS_HOST){
  publisher = redis.createClient({
    host: process.env.REDIS_HOST
  })

  // subscriber = redis.createClient({
  //   host: process.env.REDIS_HOST
  // })

  // subscriber.subscribe('kontak');

}

exports.getSubscriber = () => subscriber

exports.redisPublish = ({ topic, message }) => publisher.publish( topic, message, () => {})

// subscriber.on('message', (channel, message) => {
//   message = JSON.parse(message)

// })
