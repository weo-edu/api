/**
 * Imports
 */

var Schema = require('mongoose').Schema

/**
 * Point Schema
 */

var PointSchema = new Schema({
  max: {
    type: Number,
    required: true,
    default: 10
  },
  scaled: {
    type: Number
  }
}, {_id: false, id: false})


PointSchema
  .path('max')
  .validate(function(val) {
    return val !== 0;
  }, 'Must not be 0', 'nonZero')

/**
 * Exports
 */

module.exports = PointSchema
