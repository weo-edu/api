var validations = require('lib/validations')
  , _ = require('lodash')
  , access = require('lib/access');

module.exports = function(Schema) {
  
  var ObjectSchema = require('lib/Object/schema')(Schema);

  var AddressSchema = new Schema({
    id: {
      type: String,
      required: true
    },
    allow: {
      type: [String],
      validate: [function(allow) {
        return _.all(allow, function(entry) {
          entry = access.decode(entry);
          if (!entry.type || !entry.role)
            return false;
          if (entry.type !== 'public' && !entry.id)
            return false
          return true;
        });
      }, 'Invalid access in allow']
    },
    deny: String
  }, {_id: false});

  var ShareSchema = new Schema({

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
     * @field url The link to the profile of the user
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
      url: {
        type: String,
        required: true
      },
      image: {
        url: {
          type: String,
          required: true
        }
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
    //object: ActivityObjectSchema.embed(),
    _object: [ObjectSchema],

    /**
     * Intanced data associated with the object.
     * @type {Object}
     */
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },

    /**
     * Specifies who will receive share.
     * @type {Object}
     *
     * @field to[].id Id of location where share is sent. Typically a class.
     * @field to[].access[] Describes who can see the share at the specified location. `type`:`role`:`id`
     * @field to[].deny Which role temporarily can't see the share.
     */
    to: [AddressSchema],

    /**
     * Channel to post share on.
     * @type {String}
     */
    channel: String,

    /**
     * Status of the share. Only active share are posted.
     * @type {Object}
     */
    status: {
      type: String,
      enum: ['active', 'pending'],
      default: 'active',
      required: true
    }
  });

  ShareSchema.path('to').validate(function(val) {
    if (!val.length) {
      return false;
    } else {
      return true;
    }
  }, 'To required', 'required');

  ShareSchema.virtual('object').get(function() {
    return this._object[0];
  })
  .set(function(val) {
    this._object.length = 0;
    this._object.push(val);
  })

  ShareSchema.pre('validate', function(next) {
    if (!this.verb)
      this.verb = this.object.verb();
    next();
  });

  ShareSchema.method('address', function(address) {
    return _.find(this.to, {id: address});
  });

  ShareSchema.method('ensureAddress', function(addressId, defaultAccess) {
    var address = this.address(addressId);
    if (!address) {
      this.to.push({
        id: addressId,
        allow: defaultAccess ? [defaultAccess] : []
      });
    }
  });

  ShareSchema.method('allow', function(addressId, access) {
    this.ensureAddress(addressId);
    var address = this.address(addressId);
    address.allow.push(access);
  });

  ShareSchema.method('withClass', function(groupId) {
    this.ensureAddress(groupId, access.entry('public', 'teacher'));
    this.allow(groupId, access.entry('group', 'student', groupId));
  });

  ShareSchema.method('withStudent', function(groupId, studentId) {
    this.ensureAddress(groupId, access.entry('public', 'teacher'));
    this.allow(groupId, access.entry('user', 'student', studentId));
  });

  ShareSchema.method('isPublished', function() {
    return ! this.isNew && this.status === 'active';
  });

  ShareSchema.method('isQueued', function() {
    return this.status === 'pending';
  });

  ShareSchema.method('objectById', function(id) {
    return this.object._objects[id];
  });

  return ShareSchema;
};