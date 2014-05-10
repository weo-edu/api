var mongoose = require('mongoose');
var ObjectSchema = require('./schema')(mongoose.Schema);
var async = require('async');


module.exports = {schema: ObjectSchema};

