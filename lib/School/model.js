/**
 * Imports
 */

const db = require('lib/monk')

/**
 * Model
 */

const Schools = db.get('schools')

Schools.index({
  name: 'text',
  location: 'text'
})

/**
 * Exports
 */

module.exports = Schools
