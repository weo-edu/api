var utils = require('lib/utils');
var _ = require('lodash');
var mongoose = require('mongoose');
var lock = require('lib/lock');

exports.parse = function(channel) {
  var parts = channel.split('.');
  var root = parts[0].split('!');
  var modelName = root[0];

  if(modelName !== 'teacher' && modelName !== 'student' && modelName !== 'group')
    modelName = utils.capitalize(modelName);

  return {
    channel: channel,
    root: {
      modelName: modelName,
      id: root[1]
    },
    path: parts.slice(1).join('.'),
    leaf: parts.length > 2 && parts[parts.length - 2],
    property: parts[parts.length - 1]
  };
};

exports.stringify = function(kind, id, path) {
  return kind + '!' + id + '.' + path;
};

exports.toIds = function(channels) {
  return _.map(channels, function(channel) {
    return exports.parse(channel).root.id;
  });
};

exports.withModel = function(channel, cb) {
  var descriptor = exports.parse(channel);
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
