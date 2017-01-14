/**
 * Imports
 */

const Schema = require('@weo-edu/schema')

/**
 * School schema
 */

const name = Schema('string')
  .min(1, 'Required')

const schema = Schema()
  .prop('name', name)
  .prop('color', 'string')
  .prop('avatar', 'string')
  .prop('location', 'string')
  .required(['name'])

/**
 * Exports
 */

module.exports = schema
module.exports.name = name
