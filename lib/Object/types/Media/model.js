/**
 * Imports
 */

var MediaSchemas = require('./schema')
var scrape = require('lib/scrape')

/**
 * Media schemas
 */

Object.keys(MediaSchemas).forEach(function(key) {
  var Schema = MediaSchemas[key]

  Schema.path('originalContent').validate(function (url, done) {
    var model = this
    var share = this.share()
    var originalFilename = this.originalFilename

    if(share.isSheet() && !share.isNew && (model.isModified('originalContent') || model.isNew)) {
      scrape(url, function(err, data) {
        if(err) return done(false)

        data.originalContent = url
        data.originalFilename = originalFilename

        var id = model._id
        model.fromJSON(data, {reset: false})
        model._id = id
        done(true)
      })
    } else
      done(true)
  }, 'Invalid url', 'invalid')
})

/**
 * Exports
 */

module.exports = {Schemas: MediaSchemas}
