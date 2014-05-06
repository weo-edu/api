var validations = require('lib/validations')
  , _ = require('lodash')
  , access = require('lib/access');

module.exports = function(Schema) {

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


  var ToSchema = new Schema({});

  var ShareSchema = new Schema({
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
     * The person who performs the share
     * @type {Object}
     *
     * @field id The id of the user
     * @field name The display name of the user
     * @field url The link to the profile of the user
     * @field avatar The url of the avatar for the user
     */
    actor: {
      id: {
        required: true,
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        required: true,
        type: String
      },
      url: {
        required: true,
        type: String
        //validate: [validations.url, 'Actor profile link must be a valid url']
      },
      avatar: {
        required: true,
        type: String,
        validate: [validations.url, 'Actor avatar must be a valid url']
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
    object: {
      type: {
        type: String,
        required: true
      },
      content: {
        type: String
      },
      originalContent: {
        type: String,
      }
    },

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
     * Used to create share trees. Can often be thought of as inReplyTo.
     * @type {Object}
     *
     * @field id parent id
     * @field path ancestor path
     */
    parent: {
      id: String,
      path: String
    },

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

  ShareSchema.virtual('type').get(function() {
    return this.__t;
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

  ShareSchema.method('withParentShare', function(parentShare, addressId) {
    var self = this;
    Share.findById(parentShare, function(err, parentShare) {
      var address = parentShare.address(addressId);
      self.to.push(address);
    });
  });

  ShareSchema.method('isPublished', function() {
    return ! this.isNew && this.status === 'active';
  });

  ShareSchema.method('isQueued', function() {
    return this.status === 'pending';
  });

  return ShareSchema;
};