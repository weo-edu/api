var Schema = require('mongoose').Schema;
var ChannelSchema = module.exports = new Schema({
  channel: {
    type: String,
  },
  object: {}
});