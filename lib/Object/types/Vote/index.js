var app = module.exports = {};
app.model = require('./model');
var Share  = require('lib/Share').model;
var hooks = require('./hooks');


Share.schema.when('pre:add:vote', hooks.fill());