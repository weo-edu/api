var mongoose = require('mongoose');
var ItemSchema = require('./schema')(mongoose.Schema);

module.exports = {schema: ItemSchema}