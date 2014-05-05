var mongoose = require('mongoose');
var ResponseSchema = require('./schema')(mongoose.Schema);

var Share = require('lib/Share').model;
module.exports = Share.discriminator('response', ResponseSchema);