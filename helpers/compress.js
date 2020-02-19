const tinify = require('tinify')
// const config = require('/secrets/avd/config')
tinify.key = config.tinifyKey

const compress = async (url, date) => {
  const source = tinify.fromUrl(url)
  const name = url.substring(url.lastIndexOf('/') + 1)
  return source.store({
    service: 's3',
    aws_access_key_id: global.config.aws.accessKey,
    aws_secret_access_key: global.config.aws.secretAccess,
    region: 'ap-south-1',
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    },
    path: `avd-bapuji/compressed/${date}/${name}`
  })
    .meta()
    .then((meta) => {
      return meta
    })
    .catch((err) => {
      console.error({err})
      return err
    })
}

module.exports = compress
