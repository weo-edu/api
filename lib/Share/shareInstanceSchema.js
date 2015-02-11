var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var selfLink = require('lib/schema-plugin-selflink');
var qs = require('querystring');
var status = require('./status');
var utils = require('lib/utils');
var _ = require('lodash');

/**
 * shareInstance discriminator
 */
var ShareInstance = new Schema({
  status: {
    type: Number,
    enum: Object.keys(status).map(function(k) { return status[k]; }),
    default: status.unopened,
    required: true
  },
  annotations: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('annotations')});
  })
}, {discriminatorKey: 'shareType'});

Object.keys(status).forEach(function(name) {
  var val = status[name];
  var capName = utils.capitalize(name);

  // E.g. isTurnedIn
  ShareInstance.method('is' + capName, function() {
    return this.status === val;
  });

  // E.g. hasTurnedIn
  ShareInstance.method('has' + capName, function() {
    return this.status >= val;
  });

  // E.g. setTurnedIn
  ShareInstance.method('set' + capName, function() {
    this.status = val;
  });

  var obj = {};
  obj[name] = Date;
  ShareInstance.add(obj, 'at.');

  // Static method to check a value (for use with aggregations
  // and such)
  ShareInstance.static('is' + capName, function(status) {
    return status === val;
  });

  ShareInstance.static('has' + capName, function(status) {
    return status >= val;
  });
});

var statusNames = _.invert(status);
ShareInstance.virtual('statusName').get(function() {
  return statusNames[this.status];
});

ShareInstance.static('statusName', function(status) {
  return statusNames[status];
});

ShareInstance.method('annotate', function(path, options) {
  options = options || {};
  var comment = this.createChild('annotation', {
    channels: this.getChannel('annotations')
  });
  comment.shareType = 'annotation';

  options.path = path;
  comment.object.location = options;
  return comment;
});

ShareInstance.method('instanceData', function() {
  return this.object.instanceData();
});

ShareInstance.method('applyInstanceData', function(data) {
  var self = this;
  data.forEach(function(item) {
    var object = self.object.find(item.id);
    object && object.applyInstanceData(item);
  });
});

ShareInstance.plugin(selfLink);
module.exports = ShareInstance;