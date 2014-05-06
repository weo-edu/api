var mongoose = require('mongoose');
var ResponseSchema = require('./schema')(mongoose.Schema);

module.exports = mongoose.model('Response', ResponseSchema);