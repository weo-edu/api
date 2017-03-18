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
  .prop('logo', 'string')
  .prop('color', 'string')
  .prop('location', 'string')
  .required(['name'])

/**
 * Exports
 */

module.exports = schema
module.exports.name = name
