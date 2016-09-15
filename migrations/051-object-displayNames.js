var mongo = require('../lib/mongo')
var es = require('event-stream')
var strip = require('strip')

var katexMathMLRegEx = /<math>.*?<\/math>/g

exports.up = function(cb){
  var map = {shares: 'Share', groups: 'Group', users: 'User'}

  mongo.connect.then(function () {
    var shares = mongo.collection('shares')

    shares
      .find()
      .pipe(es.through(function (doc) {
        if (doc._object && doc._object[0] && doc._object[0].attachments) {
          doc._object[0].attachments.forEach(function (att) {
            if (!att.displayName && att.content) att.displayName = xf(att.content)

            if (att.attachments) {
              att.attachments.forEach(function (sub) {
                if (!sub.displayName && sub.content) sub.displayName = xf(sub.content)
              })
            }
          })
        }

        this.emit('data', doc)
      }))
      .pipe(es.map(function (doc, cb) {
        shares.findOne(doc._id).update(doc).then(function () {
          cb()
        }, function (err) { cb(err) })
      }))
      .on('end', cb)
  })
}

exports.down = function(next){
  next()
}


function xf (str) {
  return strip(str.replace(katexMathMLRegEx, ''))
}
