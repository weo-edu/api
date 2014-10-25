var Schema = require('mongoose').Schema;

module.exports =  new Schema({
  max: {
    type: Number,
    required: true,
    default: 10
  },
  scaled: Number,
}, {_id: false, id: false});