/**
 * Modules
 */

const db = require('lib/monk')

/**
 * Constants
 */

const avatars = db.get('avatars')

/**
 * Indexes
 */

avatars.index('user')

/**
 * Model
 */

exports.set = function (id, url, cb) {
  avatars.update({user: id}, {$set: {url: url}}, {upsert: true}, cb)
}

exports.get = function (id, cb) {
  avatars.findOne({user: id}, function (err, doc) {
    if(err) return cb(err)
    cb(null, doc ? doc.url : 'default')
  })
}
