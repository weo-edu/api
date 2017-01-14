/**
 * Imports
 */

const validator = require('@weo-edu/validate')

/**
 * Validate middleware
 */

function validate (schema) {
  const check = validator(schema)

   return function (req, res, next) {
    const keys = Object.keys(req.body)
    const result = keys.length === 1 && keys[0] === 'value'
      ? check(req.body.value)
      : check(req.body)

    if (!result.valid) {
      res.send(400, result)
    } else {
      next()
    }
  }
}

/**
 * Exports
 */

module.exports = validate
