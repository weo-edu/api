var mongoose = require('mongoose');
var S3Schema = require('./schema');
var s3conf = require('lib/config').s3.uploads;
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
  });
});

module.exports = mongoose.model('S3', S3Schema);