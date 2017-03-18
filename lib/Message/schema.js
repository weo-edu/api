/**
 * Imports
 */

var Schema = require('@weo-edu/schema')

/**
 * Message schema
 */

const schema = Schema()
  .prop('_id', 'string')
  .prop('type', 'string')
  .prop('userId', 'string')
  .prop('createdAt', 'string')
  .prop('channel', 'string')
  .prop('text', 'string')
  .required(['channel'])

/**
 * Exports
 */

module.exports = schema
