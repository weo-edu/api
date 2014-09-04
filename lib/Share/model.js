var mongoose = require('mongoose');
var ShareSchema = require('./schema');
var Seq = require('seq');
var chutil = require('lib/channel');
var _ = require('lodash');

/**
 * Static methods
 */





ShareSchema.static('findForUser', function(user, contexts, channels) {
  if(! contexts || contexts.length === 0)
    contexts = user.groupIds;

  // only inculde public if user not in group
  if (_.intersection(user.groupIds, chutil.toIds(channels)).length === 0)
    contexts.push('public');

  // If we don't have any contexts, we need something in here
  // so that an access check still takes place
  if(contexts.length === 0)
    contexts.push('__invalidContext');

  return this.find()
    .or(contexts.map(user.addressQuery.bind(user)));
});

ShareSchema.static('parseChannel', function(channel) {
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
});

ShareSchema.static('parents', function(channels, cb) {
  Seq(channels.map(Share.parseChannel))
    .parMap(function(descriptor) {
      var self = this;
      var root = descriptor.root;

      mongoose.model(root.modelName)
              .findById(root.id)
              .exec(function(err, model) {
        if(err) return self(err);
        descriptor.model = model;
        self(null, descriptor);
      });
    })
    .seq(function() { cb(null, [].slice.call(arguments)); })
    .catch(cb);
});


/**
 * Instance methods
 */
ShareSchema.method('setId', function() {
  if (!this._id) {
    this._id = new mongoose.Schema.Types.ObjectId;
  }
});

ShareSchema.method('parents', function(cb) {
  Share.parents(this.channels, cb);
});

ShareSchema.method('tokens', function() {
  var cache = {};
  return this.contexts.filter(function(context) {
    // We blacklist as opposed to whitelisting here
    // because contexts may theoretically be things
    // other than groups
    return context.descriptor.status !== 'archived';
  }).reduce(function(memo, context) {
    context.tokens().forEach(function(token) {
      if(! cache[token]) {
        cache[token] = true;
        memo.push(token);
      }
    });

    return memo;
  }, []);
});

ShareSchema.pre('validate', function(next) {
  if (!this._id)
    this._id = new mongoose.Schema.Types.ObjectId;
  next();
});

ShareSchema.pre('validate', function(next) {
  if (!this.verb) {
    if (this.object.attachments.length) {
      this.verb = this.object.attachments[0].verb();
    } else
      this.verb = this.object.verb();
  }
  next();
});

ShareSchema.index({
  'title': 'text',
  'verb': 'text',
  'actor.displayName': 'text',
  '_object.content': 'text',
  '_object.displayName': 'text',
  '_object.tags': 'text',
  '_object.attachments.content': 'text',
  '_object.attachments.displayName': 'text',
  '_object.attachments.objectType': 'text',
  '_object.attachments.attachments.content': 'text',
  '_object.attachments.attachments.displayName': 'text',
  '_object.attachments.attachments.attachments.content': 'text',
  '_object.attachments.attachments.attachments.displayName': 'text'
}, {
  name: 'ShareTextIndex',
  weights: {
    '_object.tags': 10
  }
});

ShareSchema.index({
  channel: 1,
  'contexts.id': 1
});

var Share = module.exports = ShareSchema.Model = mongoose.model('Share', ShareSchema);
