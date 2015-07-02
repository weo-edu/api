var chug = require('mongo-chug')(require('../lib/config/').mongo)
var Promise = require('es6-promise').Promise
var es = require('event-stream')
var http = require('http')
var uuid = require('uuid')
var s3config = require('../lib/config').s3.uploads
var s3client = require('knox').createClient(s3config)
var bucketUrl = 'http://' + s3config.bucket + '.s3-' + s3config.region + '.amazonaws.com'

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.map(function(doc, cb) {
      process(doc).then(function() {
        cb(null, doc)
      }, cb)
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};

function process(share) {
  var qs = []

  if(share.image && share.image.url) {
    qs.push(copy(share.image.url).then(function(url) {
      share.image.url = url
    }))
  }

  if(share._object[0] && share._object[0].attachments) {
    share._object[0].attachments.forEach(function(obj) {
      if(obj.image && obj.image.url) {
        qs.push(copy(obj.image.url).then(function(url) {
          obj.image.url = url
        }))
      }
    })
  }

  return Promise.all(qs)
}

var cache = {}

function copy(url) {
  var q = new Promise(function(resolve, reject) {
    url = url.replace('https://', 'http://')

    if(cache[url])
      return resolve(cache[url])

    cache[url] = q
    http.get(url, function(res) {
      // We're unable to move this one for whatever reason
      if(res.statusCode !== 200)
        return resolve(url)

      var path = '/' + uuid.v4()
      var headers = {
          'Content-Length': res.headers['content-length']
        , 'Content-Type': res.headers['content-type']
      }

      res.on('error', reject)
      console.log('s3 putStream', url, res.statusCode)
      s3client.putStream(res, path, headers, function(err, res) {
        if(err) return reject(err)

        res
          .resume()
          .on('error', reject)
          .on('end', function() {
            console.log('complete', bucketUrl + path)
            resolve(bucketUrl + path)
          })
      })
    })
    .on('error', reject)
  })

  return q
}
