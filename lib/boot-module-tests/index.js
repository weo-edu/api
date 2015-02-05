var mongoose = require('mongoose');
var app = require('express')();
var _ = require('lodash');
var server;
var models = {};
var modelSchemas = {};
var plugins = [];

exports.prepare = function() {
  models = _.clone(mongoose.models);
  modelSchemas = _.clone(mongoose.modelSchemas);
  plugins = _.clone(mongoose.plugins);
};

exports.cleanup = function(done) {
  mongoose.models = _.clone(models);
  mongoose.modelSchemas = _.clone(modelSchemas);
  mongoose.plugins = _.clone(plugins);
  server.close();
  mongoose.disconnect(done);
};

exports.connect = function() {
  mongoose.connect('localhost');
  mongoose.connection.models = mongoose.models;
  server = app.listen(7000);
  require('lib/io').listen(server);
};