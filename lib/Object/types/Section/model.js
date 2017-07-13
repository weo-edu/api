/**
 * Imports
 */

var SectionSchema = require('./schema')
var LinkActivity = require('./schema')
var q = require('q')

/**
 * Section model
 */

SectionSchema.plugin(require('lib/schema-plugin-was-modified'))

/**
 * Exports
 */

module.exports = {schema: SectionSchema}
