/**
 * Imports
 */

var SectionSchema = require('./schema')
var q = require('q')

/**
 * Section model
 */

SectionSchema.method('grade', function() {
  var points = (this.attachments || []).reduce(function(memo, object) {
    if (object.points && object.isGradable && object.isGradable()) {
      memo.max += object.points.max
      memo.raw += Math.round(object.points.max * (object.points.scaled || 0) * 100) / 100
    }
    return memo
  }, {max: 0, raw: 0})

  this.points.max = points.max
  this.points.scaled = points.max
    ? points.raw / points.max
    : 0
})

SectionSchema.method('autograde', function () {
  var self = this
  return q.all(
    self
      .attachments
      .map(function (att) {
        return att.autograde()
      })
  ).then(function () {
    return self.grade()
  })
})

SectionSchema.plugin(require('lib/schema-plugin-was-modified'))

/**
 * Exports
 */

module.exports = {schema: SectionSchema}
