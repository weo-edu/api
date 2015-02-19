var mongoose = require('mongoose');
var config = require('lib/config');
var debug = require('debug')('weo:db');


mongoose.plugin(require('lib/created-at'));
mongoose.plugin(require('lib/updated-at'));
mongoose.plugin(require('lib/enable-virtuals'));
mongoose.plugin(require('lib/schema-plugin-kind'));
mongoose.plugin(require('lib/schema-plugin-extend'));
mongoose.plugin(require('lib/schema-plugin-discriminator'));
mongoose.plugin(require('lib/schema-plugin-path'));
mongoose.plugin(require('lib/schema-plugin-strict'));
mongoose.plugin(require('lib/schema-plugin-fromJSON'));
mongoose.plugin(require('lib/schema-plugin-was-modified'));
mongoose.plugin(require('lib/schema-plugin-post'));

debug('starting mongoose...');
mongoose.connect(config.mongo);