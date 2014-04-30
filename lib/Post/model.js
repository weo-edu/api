var mongoose = require('mongoose');
var PostSchema = require('./schema')(mongoose.Schema);

var Share = require('lib/Share').model;
module.exports = Share.discriminator('post', PostSchema);