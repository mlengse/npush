const crypto = require('crypto')

exports._getArgs = ({that}) => {
  const xTimestamp = that.xTimestamp()
  const var1 = `${that.config.XCONSID}&${xTimestamp}`
  const xSignature = crypto.createHmac('sha256', that.config.CONSPWD).update(var1).digest('base64')
  const xAuthorization = `Basic ${
    Buffer.from(`${
      that.config.PCAREUSR
    }:${
      that.config.PCAREPWD
    }:${
      that.config.KDAPP
    }`)
    .toString('base64')
  }`

  return {
    headers:{
      "X-cons-id": that.config.XCONSID,
      "X-Timestamp": xTimestamp,
      "X-Signature": xSignature,
      "X-Authorization": xAuthorization
    }
  }
}

