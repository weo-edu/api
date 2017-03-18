/**
 * Imports
 */

var Schema = require('@weo-edu/schema')

/**
 * Channel schema
 */

const schema = Schema()
  .prop('_id', 'string')
  .prop('createdAt', 'string')
  .prop('ownerId', 'string')
  .prop('name', 'string')
  .required(['name'])

/**
 * Exports
 */

module.exports = schema
