var mongoose = require('mongoose');
mongoose.plugin(require('lib/schema-plugin-discriminator'));
mongoose.plugin(require('lib/created-at'));
mongoose.plugin(require('lib/schema-plugin-path'));