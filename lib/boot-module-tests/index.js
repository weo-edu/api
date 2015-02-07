var mock = require('mock-require');

mock('../io/index.js', {
  sockets: {
    to: function() {
      return this;
    },
    send: function() {
      return this;
    }
  }
});

var mongoose = require('mongoose');
var _ = require('lodash');
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
  mongoose.disconnect(done);
};

exports.connect = function() {
  mongoose.connect('localhost');
  mongoose.connection.models = mongoose.models;
};