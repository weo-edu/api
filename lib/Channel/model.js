var mongoose = require('mongoose');
var ChannelSchema = require('./schema');

module.exports = mongoose.model('Channel', ChannelSchema);