var policy = require('s3-policy')
var bytes = require('bytes')
var s3UploadConf = require('lib/config').s3.uploads
var ObjectId = require('mongoose').Types.ObjectId

function s3policy(base, props) {
  if('string' === typeof props)
    props = {name: props}

  var bucket = props.bucket || base.bucket
  var key = props.key || base.key
  var acl = props.acl || 'public-read'
  var length = props.size || bytes(base.size)

  var p = policy({
    acl: acl,
    expires: props.expires || (new Date(Date.now() + 60000)),
    bucket: bucket,
    secret: props.secret || base.secret,
    key: key,
    name: props.name,
    length: length,
    conditions: [
      ['starts-with', '$Content-Disposition', '']
    ]
  })

  return {
    policy: p.policy,
    signature: p.signature,
    bucket: bucket,
    acl: acl,
    key: key,
    name: props.name,
    length: length
  }
}

exports.upload = function(req, res) {
  var id = (new ObjectId()).toString()
  var name = 'uploads/' + id
  res.json(s3policy(s3UploadConf, name))
}