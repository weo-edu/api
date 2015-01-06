var mongoose = require('mongoose');
var ShareSchema = require('./schema');
var chutil = require('lib/Channel');
var _ = require('lodash');
var access = require('lib/access');
var Student = require('lib/Student').model;

/**
 * Static methods
 */

ShareSchema.static('findForUser', function(user, contexts, channels) {
  if(! contexts || contexts.length === 0)
    contexts = user.groupIds;

  // Only include public if user not in group
  if (_.intersection(user.groupIds, chutil.toIds(channels)).length === 0)
    contexts.push('public');

  // If we don't have any contexts, we need something in here
  // so that an access check still takes place
  if(contexts.length === 0)
    contexts.push('__invalidContext');

  return this.find()
    .or(contexts.map(user.addressQuery.bind(user)))
    .where('deny').ne(user.userType);
});



/**
 * Instance methods
 */
ShareSchema.method('setId', function() {
  if (!this._id) {
    this._id = new mongoose.Schema.Types.ObjectId;
  }
});

ShareSchema.method('channelModels', function(cb) {
  chutil.models(this.channels, cb);
});

ShareSchema.method('deleteInstances', function(cb) {
  this.findInstances().remove(cb);
});

ShareSchema.method('findInstances', function() {
  return Share.find()
    .where('channels', this.getChannel('instances'))
    .where('shareType', 'shareInstance');
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

ShareSchema.method('instanceProperties', function(opts) {
  return {
    displayName: this.displayName,
    contexts: this.contextList([].concat(opts.context)),
    tags: this.tags,
    discussion: this.discussion,
    root: this.toKey(),
    parent: this.toKey()
  };
});

ShareSchema.method('createInstance', function(opts) {
  opts = opts || {};
  var inst = new ShareInstance({
    status: opts.status || 'published',
    shareType: 'shareInstance',
    channels: [
      opts.user.getChannel('activities'),
      this.getChannel('instances')
    ],
    object: this.object.toJSON(),
    actor: opts.user.toKey()
  });

  inst.set(this.instanceProperties(opts));

  inst.set({
    'replies.selfLink': this.replies.selfLink,
    'instances.selfLink': this.instances.selfLink,
    'students.selfLink': this.students.selfLink
  });

  return inst;
});

ShareSchema.method('getMembers', function(contexts) {
  contexts = contexts || this.contextIds;
  var individuals = [];
  var groups = [];

  this.contextList(contexts).forEach(function(address) {
    address.allow.map(function(allow) {
      return access.decode(allow.id);
    }).filter(function(entry) {
      // Skip public
      return !! entry.id;
    }).forEach(function(entry) {
      if(entry.type === 'user')
        individuals.push(entry.id);
      else if(entry.type === 'group' && entry.role === 'student')
        groups.push(entry.id);
    });
  });

  return Student.find()
    .or([{_id: {$in: individuals}}, {'groups.id': {$in: groups}}]);
});

/**
 * Hooks
 */
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


/**
 * Config
 */

ShareSchema.index({
  'displayName': 'text',
  'verb': 'text',
  'actor.displayName': 'text',
  '_object.content': 'text',
  '_object.displayName': 'text',
  'tags': 'text',
  '_object.attachments.content': 'text',
  '_object.attachments.displayName': 'text',
  '_object.attachments.objectType': 'text',
  '_object.attachments.attachments.content': 'text',
  '_object.attachments.attachments.displayName': 'text',
  '_object.attachments.attachments.attachments.content': 'text',
  '_object.attachments.attachments.attachments.displayName': 'text',
  'contexts.allow.displayName': 'text'
}, {
  name: 'ShareTextIndex',
  weights: {
    'tags': 10
  }
});

ShareSchema.index({
  channels: 1,
  'actor.id': 1,
  publishedAt: -1
});


var Share = module.exports = ShareSchema.Model = mongoose.model('Share', ShareSchema);
var ShareInstance = Share.ShareInstance = Share.discriminator('shareInstance', ShareSchema.ShareInstance);
