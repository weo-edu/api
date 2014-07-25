var access = require('lib/access');
var Schema = require('mongoose').Schema;
var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

var AddressSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  allow: {
    type: [String],
    validate: [
      function(allow) {
        return allow.every(function(entry) {
          entry = access.decode(entry);
          // type and role are required, id is only required
          // if type is not equal to 'public'
          return entry.type && entry.role && (entry.id || entry.type === 'public');
        });
      }
      , 'Invalid access in allow'
    ]
  },
  deny: String
}, {_id: false, id: false});

AddressSchema.method('tokens', function() {
  var deny = this.deny;
  return this.allow.filter(function(token) {
    return ! deny || access.decode(token).role !== deny;
  });
});

var ShareSchema = module.exports = new Schema({

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
   * The person who performs the activity
   * @type {Object}
   *
   * @field id The id of the user
   * @field displayName The display name of the user
   * @field url The link to the profile of the user (virtual)
   * @field image.url The url of the avatar for the user
   */

  actor: {
    id: {
      type: String,
      required: true,
      ref: 'User'
    },
    displayName: {
      type: String,
      required: true
    },
    image: {
      url: {
        type: String,
        required: true
      }
    },
    color: {
      type: String
    }
  },

  /**
   * The shares verb, indicating kind of share performed.
   * @type {Object}
   */
  verb: {
    type: String,
    required: true
  },



  /**
   * The object of the share.
   * @type {Object}
   *
   * @field type Type of object.
   * @field content Formatted content, suitable for display.
   * @field content The content provided by the author.
   */
  _object: [ObjectSchema],

  /**
   * Specifies who will receive share.
   * @type {Object}
   *
   * @field contexts[].id Id of location where share is sent. Typically a class.
   * @field contexts[].access[] Describes who can see the share at the specified location. `type`:`role`:`id`
   * @field contexts[].deny Which role temporarily can't see the share.
   */
  contexts: [AddressSchema],

  /**
   * Channel to post share on.
   * @type {String}
   */
  channels: {
    type: [String],
    required: true
  },

  /**
   * Root share that this share is on
   * @type {ObjectId}
   */
  root: {
    type: 'ObjectId',
    ref: 'Share'
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
  students: selfLink.embed()
});

ShareSchema.virtual('contextIds').get(function() {
  var self = this;
  return this.contexts.filter(function(ctx) {
    return ctx.id !== self.actor.id;
  }).map(function(ctx) {
    return ctx.id;
  });
});

ShareSchema.path('contexts').validate(function(val) {
  return !!val.length;
}, 'Contexts required', 'required');

ShareSchema.virtual('object').get(function() {
  return this._object && this._object[0];
})
.set(function(val) {
  this._object.length = 0;
  this._object.push(val);
});

ShareSchema.virtual('tags').get(function() {
  return this.object.tags;
});

ShareSchema.method('address', function(context) {
  return this.contexts.filter(function(ctx) {
    return ctx.id === context;
  })[0];
});

ShareSchema.method('ensureAddress', function(context, defaultAccess) {
  var address = this.address(context);
  if (!address) {
    this.contexts.push({
      id: context,
      allow: defaultAccess ? [defaultAccess] : []
    });
  }
});

ShareSchema.method('allow', function(context, access) {
  this.ensureAddress(context);
  var address = this.address(context);
  address.allow.push(access);
  return this;
});

ShareSchema.method('withClass', function(context) {
  this.ensureAddress(context, access.entry('public', 'teacher'));
  this.allow(context, access.entry('group', 'student', context));
  return this;
});

ShareSchema.method('withSubgroup', function(parent, subgroup) {
  this.ensureAddress(parent, access.entry('public', 'teacher'));
  this.allow(parent, access.entry('group', 'student', subgroup));
  return this;
});

ShareSchema.method('withStudent', function(context, studentId) {
  this.ensureAddress(context, access.entry('public', 'teacher'));
  this.allow(context, access.entry('user', 'student', studentId));
  return this;
});

ShareSchema.method('isPublished', function() {
  return ! this.isNew && this.status === 'active';
});

ShareSchema.method('isQueued', function() {
  return this.status === 'pending';
});

/**
 * Check to see if we are a root-level share
 * @return {Boolean} root or not
 */
ShareSchema.method('isRoot', function() {
  return !this.root || this.root === this.id;
});

ShareSchema.virtual('url').get(function() {
  return '/share/' + (this.root || this.id);
});


ShareSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.object;
  }
});

ShareSchema.plugin(selfLink);
