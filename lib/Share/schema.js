var access = require('lib/access');
var Schema = require('mongoose').Schema;
var ObjectSchema = require('lib/Object/schema');
var UserSchema = require('lib/User/schema');
var selfLink = require('lib/schema-plugin-selflink');
var foreignKey = require('lib/schema-plugin-foreign-key');
var mongoose = require('mongoose');
var qs = require('querystring');
var _ = require('lodash');

var ShareSchema = module.exports = new Schema({
  shareType: {
    type: String,
    enum: ['activity', 'share'],
    default: 'share'
  },
  title: {
    type: String,
  },

  /**
   * type of share
   * @type {Object}
   *
   * Implemented by virtual
   */

  /**
   * time share is `activated`
   * @type {Date}
   */
  publishedAt: Date,

  /**
   * The shares verb, indicating kind of share performed.
   * @type {Object}
   */
  verb: {
    type: String,
    required: true
  },
  /**
   * The person who performs the activity
   * @type {Object}
   *
   * @field id The id of the user
   * @field displayName The display name of the user
   * @field url The link to the profile of the user (virtual)
   * @field image.url The url of the avatar for the user
   */
  actor: UserSchema.foreignKey.embed(),
  /**
   * Specifies who will receive share.
   * @type {Object}
   *
   * @field contexts[].id Id of location where share is sent. Typically a class.
   * @field contexts[].access[] Describes who can see the share at the specified location. `type`:`role`:`id`
   * @field contexts[].deny Which role temporarily can't see the share.
   */
  contexts: [access.AddressSchema],
  /**
   * Replies to this share
   * @type {SelfLink}
   */
  replies: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.path('replies')});
  }),
  /**
   * Channel to post share on.
   * @type {String}
   */
  channels: {
    type: [String],
    required: true
  },

  /**
   * Status of the share. Only active share are posted.
   * @type {Object}
   */
  status: {
    type: String,
    enum: ['active', 'pending', 'draft'],
    default: 'active',
    required: true
  },
  students: selfLink.embed(function() {
    return '/share/' + this.id + '/students';
  })
});

ShareSchema.plugin(foreignKey, {
  model: 'Share',
  transform: function(key) {
    key.actor = this.actor.toJSON();
    if (this.object.toKey) {
      key = this.object.toKey(key);
    }
    return key;
  }
});

ShareSchema.foreignKey.add({
  actor: UserSchema.foreignKey.embed()
});

ShareSchema.plugin(require('lib/schema-plugin-nested'));

ShareSchema.nested('root', ShareSchema.foreignKey);
ShareSchema.nested('parent', ShareSchema.foreignKey);

/**
 * The object of the share.
 * @type {Object}
 *
 * @field type Type of object.
 * @field content Formatted content, suitable for display.
 * @field content The content provided by the author.
 */
ShareSchema.nested('object', ObjectSchema);

ShareSchema.static('create', function(objectType) {
  var Share = mongoose.model('Share');
  return new Share({object: {objectType: objectType}});
});

ShareSchema.method('createChild', function(objecType, options) {
  options = options || {};

  var share = ShareSchema.Model.create(objecType);
  share.set({parent: this.toKey()});
  share.set({root: this.root || this.toKey()});
  share.contexts = this.contextList(options.contexts);
  if (options.channels)
    share.channels = [].concat(options.channels);
  return share;
});

ShareSchema.virtual('contextIds').get(function() {
  return this.contexts.map(function(ctx) {
    return ctx.descriptor.id;
  });
});

ShareSchema.path('contexts').validate(function(val) {
  return !!val.length;
}, 'Contexts required', 'required');


ShareSchema.virtual('tags').get(function() {
  return this.object.tags;
});

ShareSchema.method('canEdit', function(user) {
  var id = user.id || user;
  return this.actor.id === id;
});

ShareSchema.method('context', function(foreignKey) {
  var id = foreignKey.id || foreignKey;
  var len = this.contexts.length;

  for(var i = 0; i < len; i++)
    if(this.contexts[i].descriptor.id === id)
      return this.contexts[i];

  return null;
});

ShareSchema.method('contextList', function(addresses) {
  if (!addresses)
    return this.contexts;

  // Normalize the addresses to be ids
  addresses = addresses.map(function(addr) {
    return addr.id || addr;
  });

  return this.contexts.filter(function(ctx) {
    return addresses.indexOf(ctx.descriptor.id) !== -1;
  });
});


ShareSchema.method('ensureContext', function(contextKey) {
  var context = this.context(contextKey);

  if(! context) {
    this.contexts.push({
      descriptor: foreignKey.toAbstractKey(contextKey)
    });
    context = this.contexts[this.contexts.length - 1];
  }

  return context;
});

ShareSchema.method('addChannel', function(channel) {
  this.channels.push(channel);
  this.channels = _.uniq(this.channels);
});

ShareSchema.method('withGroup', function(model, opts) {
  var Group = mongoose.model('Group');
  opts = opts || {};
  // If we've been passed a class, the
  // parent is the class
  var parent = model.parent || model.toKey();
  if(parent.toJSON)
    parent = parent.toJSON();

  var access = this.ensureContext(parent)
    .grant('group', 'teacher', model)

  if(!opts.excludeStudent)
    access.grant('group', 'student', model);

  if (opts.channel) {
    this.channels.push(Group.path(parent, 'board'));
    this.channels = _.uniq(this.channels);
  }
});

ShareSchema.method('withGroups', function(groups) {
  var self = this;
  _.each(groups, function(group) {
    self.withGroup(group);
  });
});

ShareSchema.method('withStudent', function(context, userModel) {
  this.ensureContext(context.toKey())
    .grant('user', 'student', userModel)
    .grant('group', 'teacher', context);
  return this;
});

ShareSchema.method('withPublic', function(type) {
  type = type || 'teacher';
  this.ensureContext(access.public)
    .grant('public', type);
});

ShareSchema.method('isPublished', function() {
  return this.status === 'active';
});

ShareSchema.method('isQueued', function() {
  return this.status === 'pending';
});

ShareSchema.method('isDraft', function() {
  return this.status === 'draft';
});

/**
 * Check to see if we are a root-level share
 * @return {Boolean} root or not
 */
ShareSchema.method('isRoot', function() {
  return !this.root || this.root === this.id;
});

ShareSchema.virtual('url').get(function() {
  return '/share/' + (this.root ? this.root.id : this.id) + '/';
});


ShareSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.object;
  }
});

ShareSchema.plugin(selfLink);
