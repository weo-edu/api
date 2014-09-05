var channel = module.exports;
var Channel = channel.model = require('./model');
var _ = require('lodash');

// add helpers
_.extend(channel, require('./helpers'));