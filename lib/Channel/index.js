var channel = module.exports;
channel.model = require('./model');
var _ = require('lodash');

// add helpers
_.extend(channel, require('./helpers'));