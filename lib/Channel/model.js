var mongoose = require('mongoose');
var ChannelSchema = require('./schema');

ChannelSchema.path('channel').index({unique: true});
module.exports = mongoose.model('Channel', ChannelSchema);