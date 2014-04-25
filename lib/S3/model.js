var mongoose = require('mongoose');
var S3Schema = require('./schema')(mongoose.Schema);
var S3 = mongoose.model('S3', S3Schema);
var policy = require('s3-policy');
var bytes = require('bytes');

var min = 60000;
S3Schema.method('policy', function(acl, size) {
  size = size || s3conf.size;

  var now = Date.now();
  return policy({
    acl: 'public-read',
    expires: new Date(now + min),
    bucket: s3conf.bucket,
    secret: s3conf.secret,
    key: s3conf.key,
    name: 'uploads/',
    length: bytes(size)
  })
});