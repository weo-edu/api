var mongoose = require('mongoose');
var config = require('lib/config');
var debug = require('debug')('weo:db');

require('./plugins')();

debug('starting mongoose...');
mongoose.connect(config.mongo);

