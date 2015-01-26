var helpers = module.exports;
var _ = require('lodash');
var mongoose = require('mongoose');
var lock = require('redis-lock')(require('lib/redis').default);

helpers.parse = function(channel) {
  var parts = channel.split('.');
  var root = parts[0].split('!');
  return {
    channel: channel,
    root: {
      modelName: root[0][0].toUpperCase() + root[0].slice(1),
      id: root[1]
    },
    path: parts.slice(1).join('.'),
    leaf: parts.length > 2 && parts[parts.length - 2],
    property: parts[parts.length - 1]
  };
};

helpers.stringify = function(kind, id, path) {
  return kind + '!' + id + '.' + path;
};

helpers.toIds = function(channels) {
  return _.map(channels, function(channel) {
    return helpers.parse(channel).root.id;
  });
};

helpers.withModel = function(channel, cb) {
  var descriptor = helpers.parse(channel);
  var root = descriptor.root;
  lock(root.id, 2000, function(done) {
    mongoose.model(root.modelName)
      .findById(root.id)
      .exec(function(err, model) {
        descriptor.model = model;
        descriptor.done = done;
        cb(err, descriptor);
      });
  });
};
