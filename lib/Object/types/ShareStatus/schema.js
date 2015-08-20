/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')

/**
 * Status schema
 */

var StatusSchema = ObjectSchema.discriminator('status', {
  status: {
    type: String,
    required: true
  },
  object: {},
  actor: {},
  meta: {}
})

/**
 * Exports
 */

module.exports = StatusSchema