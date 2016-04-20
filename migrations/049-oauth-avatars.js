/**
 * Imports
 */

var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')
var request = require('superagent')
var uuid = require('uuid')
var s3config = require('../lib/config').s3.uploads
var s3client = require('knox').createClient(s3config)
var bucketUrl = 'http://' + s3config.bucket + '.s3-' + s3config.region + '.amazonaws.com'
var mongo = require('../lib/mongo')

/**
 * Migrations
 */

exports.up = function(next){
  var ps = es.pause()
  chug
    .src('users', {'auth.facebook.id': {$exists: true}})
    .pipe(ps)
    .pipe(es.map(function(doc, cb) {
      ps.pause()
      console.log('processing user', doc._id)
      process(doc, function (err) {
        if (err) return cb(err)
        cb(null, doc)
        ps.resume()
      }, cb)
    }))
    .pipe(chug.dest('users'))
    .on('end', next)

  ps.resume()
}

exports.down = function(next){
  next()
}

/**
 * Process a user document
 */

function process (user, cb) {
  var avatars = mongo.collection('avatars')
  console.log('process', user._id)
  try {
    avatars.findOne({user: user._id.toString()}).then(function (doc) {
      console.log('avatar', doc)
      if (!doc) return cb(null)
      if (doc.url && doc.url.indexOf('fbcdn.net/hprofile') === -1) return cb()

      s3upload('http://graph.facebook.com/' + user.auth.facebook.id + '/picture?type=large', function (err, url) {
        if (err) return cb(err)
        console.log('uploaded', user._id, user.auth.facebook.id, url)
        avatars
          .findOne(doc._id)
          .update('url', url)
          .then(function () { cb() }, cb)
      })
    }, cb)
  } catch (e) {
    console.log("CAUGHT", e)
  }
}

/**
 * Helpers
 */

function s3upload (url, cb) {
  request
    .get(url, function (err, res) {
      if (err) return cb(err)

      var path = '/' + uuid.v4()
      var headers = {
        'Content-Length': res.headers['content-length'],
        'Content-Type': res.headers['content-type']
      }

      s3client.putBuffer(res.body, path, headers, function (err, res) {
        if (err) return cb(err)
        res
          .resume()
          .on('error', function (err) { cb(err) })
          .on('end', function () {
            cb(null, bucketUrl + path)
          })
      })
    })
    .on('error', function (err) { cb(err) })
}
