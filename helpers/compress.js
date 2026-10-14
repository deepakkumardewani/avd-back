const tinify = require('tinify')

const compress = async (url, date) => {
  const aws = global.config && global.config.aws
  if (!global.config || !global.config.tinifyKey || !aws) {
    throw new Error('Image compression is not configured')
  }

  tinify.key = global.config.tinifyKey
  const source = tinify.fromUrl(url)
  const name = url.substring(url.lastIndexOf('/') + 1)
  const meta = await source.store({
    service: 's3',
    aws_access_key_id: aws.accessKey,
    aws_secret_access_key: aws.secretAccess,
    region: 'ap-south-1',
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    },
    path: `avd-bapuji/compressed/${date}/${name}`
  }).meta()

  return meta
}

module.exports = compress
