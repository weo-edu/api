var app = module.exports = {};
var Check = app.model = require('./model');
var Share  = require('lib/Share').model;
var hooks = require('./hooks');


Share.schema.when('pre:add:check', hooks.fill());