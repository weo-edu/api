/**
 * Imports
 */

var mongoose = require('mongoose')
var ObjectSchema = require('./schema')

/**
 * Object model
 */

ObjectSchema.pre('validate', function (next) {
  if (!this._id) {
    this._id = new mongoose.Schema.Types.ObjectId
  }
  next()
})

ObjectSchema.method('autograde', function () {})

/**
 * Plugins
 */

ObjectSchema.plugin(require('lib/schema-plugin-was-modified'))

/**
 * Exports
 */

module.exports = {schema: ObjectSchema}
