var Schema = require('mongoose').Schema;

module.exports =  new Schema({
  max: {
    type: Number,
    required: true,
    default: 10
  },
  scaled: {
    type: Number,
    default: 0
  }
}, {_id: false, id: false});