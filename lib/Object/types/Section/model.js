/**
 * Imports
 */

var SectionSchema = require('./schema')
var q = require('q')

SectionSchema.plugin(require('lib/schema-plugin-was-modified'))

/**
 * Exports
 */

module.exports = {schema: SectionSchema}
